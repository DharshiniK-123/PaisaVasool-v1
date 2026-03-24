
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.config.matching_config import MATCHING_CONFIG
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice
from src.data.models.postgres.payment_detail import PaymentDetail
from src.utils.extract_multiple_invoice_nos import _extract_multiple_invoice_nos
from src.utils.fx_client import get_exchange_rate
from .candidate_fetcher import CandidateFetcher
from .db_writer import (delete_failed_records,fetch_existing_records,get_already_matched_amount,is_duplicate,payment_already_processed,save_duplicate_match,save_failed_match,save_successful_match,update_invoice_status,)
from .pipeline import run_scoring_pipeline
from .resolver import build_status_sentence, resolve_match

ZERO = Decimal("0.00")
FX_VARIANCE_THRESHOLD = Decimal("0.05")   

def _validate_payment(payment) -> str | None:
    pay_amount = Decimal(str(payment.payment_amount))

    if pay_amount <= ZERO:
        return (
            f"Payment amount is {payment.currency} {pay_amount:,.2f}, which is not a valid "
            "amount. Payments must be greater than zero. This record requires manual review."
        )

    if not (payment.invoice_no or "").strip():
        return (
            "No invoice number was provided with this payment. "
            "The payment cannot be automatically matched and requires manual review."
        )

    return None


async def _process_invoice(
    payment,
    invoice,
    invoice_nos:         list[str],
    remaining_pay:       Decimal,
    db:                  AsyncSession,
    converted:           bool           = False,
    fx_rate:             Decimal | None = None,
    original_pay_amount: Decimal | None = None,
    customer_name:       str | None     = None,
    customer_email:      str | None     = None,
) -> tuple[MatchingPaymentInvoice | None, Decimal]:
    
    if await is_duplicate(payment.id, invoice.id, db):
        rec = await save_duplicate_match(payment.id, invoice, db)
        return rec, remaining_pay

    already_matched = await get_already_matched_amount(invoice.id, db, lock=True)

    inv_remaining = Decimal(str(invoice.total_amount)) - already_matched
    if inv_remaining <= ZERO:
        return None, remaining_pay

    pay_to_score = (
        (remaining_pay * fx_rate).quantize(Decimal("0.01"))
        if converted and fx_rate
        else remaining_pay
    )

    score, reasons = run_scoring_pipeline(
        payment=payment,
        invoice=invoice,
        invoice_nos=invoice_nos,
        remaining_pay=pay_to_score,
        inv_remaining=inv_remaining,
        converted=converted,
        fx_rate=fx_rate,
        original_pay_amount=original_pay_amount,
        customer_name=customer_name,
        customer_email=customer_email,
    )

    if score < MATCHING_CONFIG.min_match_score:
        rec = await save_failed_match(
            payment.id,
            (
                f"Low confidence match for invoice '{invoice.invoice_number}' "
                f"(score: {score}/100). "
                + " ".join(reasons)
                + " Manual review is recommended."
            ),
            db,
            invoice_id=invoice.id,
            score=score,
        )
        return rec, remaining_pay

    match_status, matched_amount, amount_pending = resolve_match(pay_to_score, inv_remaining)

    status_sentence = build_status_sentence(
        match_status=match_status,
        invoice=invoice,
        payment=payment,
        matched_amount=matched_amount,
        amount_pending=amount_pending,
        remaining_pay=pay_to_score,
        inv_remaining=inv_remaining,
        converted=converted,
        fx_rate=fx_rate,
    )

    rec = await save_successful_match(
        payment_id=payment.id,
        invoice_id=invoice.id,
        matched_amount=matched_amount,
        amount_pending=amount_pending,
        score=score,
        match_status=match_status,
        match_reason=" ".join(reasons) + " " + status_sentence,
        db=db,
    )

    if converted and fx_rate:
        consumed = (matched_amount / fx_rate).quantize(Decimal("0.01"))
    else:
        consumed = matched_amount

    return rec, remaining_pay - consumed



async def run_matching_for_payment(payment_id: int, db: AsyncSession) -> list:
    if await payment_already_processed(payment_id, db):
        return await fetch_existing_records(payment_id, db)

    # Clear any previous FAILED records so this run starts clean.
    # This handles the case where a payment was uploaded before its invoice
    # existed — the earlier attempt produced a FAILED record, and now that
    # the invoice has arrived we need to retry from scratch.
    await delete_failed_records(payment_id, db)

    result = await db.execute(
        select(PaymentDetail).where(
            PaymentDetail.id == payment_id,
            PaymentDetail.is_deleted.is_(False),
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        return []

    
    validation_error = _validate_payment(payment)
    if validation_error:

        rec = await save_failed_match(payment_id, validation_error, db)

        await db.commit()
        return [rec]

    pay_amount    = Decimal(str(payment.payment_amount))
    remaining_pay = pay_amount
    records:      list[MatchingPaymentInvoice] = []

    invoice_nos = _extract_multiple_invoice_nos((payment.invoice_no or "").strip())

    candidates = await CandidateFetcher(db).fetch(payment, invoice_nos)

    if not candidates.has_open():
        reason = candidates.best_failure_reason(payment, invoice_nos)
        rec    = await save_failed_match(payment_id, reason, db)
        await db.commit()
        return [rec]

    for invoice in candidates.same_currency:
        if remaining_pay <= ZERO:
            break

        rec, remaining_pay = await _process_invoice(
            payment=payment,
            invoice=invoice,
            invoice_nos=invoice_nos,
            remaining_pay=remaining_pay,
            db=db,
            customer_name=candidates.customer_name,
            customer_email=candidates.customer_email,
        )
        if rec is not None:
            records.append(rec)

    for invoice in candidates.fx_mismatch:
        if remaining_pay <= ZERO:
            break

        try:
            fx_rate = await get_exchange_rate(
                payment.paid_date,
                payment.currency,
                invoice.currency,
                db,
            )
        except RuntimeError as exc:
            rec = await save_failed_match(
                payment_id,
                f"Currency mismatch: payment is in {payment.currency} but invoice "
                f"'{invoice.invoice_number}' is in {invoice.currency}. "
                f"Automatic FX conversion failed: {exc}. Manual review required.",
                db,
                invoice_id=invoice.id,
            )
            records.append(rec)
            continue

        converted_amount = (remaining_pay * fx_rate).quantize(Decimal("0.01"))

        already_matched_for_check = await get_already_matched_amount(invoice.id, db)
        inv_remaining_for_check   = Decimal(str(invoice.total_amount)) - already_matched_for_check

        if inv_remaining_for_check > ZERO:
            variance = abs(converted_amount - inv_remaining_for_check) / inv_remaining_for_check

            if variance > FX_VARIANCE_THRESHOLD:
                rec = await save_failed_match(
                    payment_id,
                    f"FX conversion variance too high for invoice '{invoice.invoice_number}'. "
                    f"Converted payment ({invoice.currency} {converted_amount:,.2f}) "
                    f"differs from invoice outstanding "
                    f"({invoice.currency} {inv_remaining_for_check:,.2f}) "
                    f"by {variance * 100:.1f}% — exceeds the 5% threshold. "
                    f"Rate used: 1 {payment.currency} = {fx_rate:.8f} {invoice.currency} "
                    f"on {payment.paid_date}. Manual review required.",
                    db,
                    invoice_id=invoice.id,
                )
                records.append(rec)
                continue  

        rec, remaining_pay = await _process_invoice(
            payment=payment,
            invoice=invoice,
            invoice_nos=invoice_nos,
            remaining_pay=remaining_pay,
            db=db,
            converted=True,
            fx_rate=fx_rate,
            original_pay_amount=remaining_pay,
            customer_name=candidates.customer_name,
            customer_email=candidates.customer_email,
        )
        if rec is not None:
            records.append(rec)

    last_status = next(
        (r.match_status for r in reversed(records)
         if r.match_status in ("FULL", "PARTIAL", "OVERPAYMENT")),
        None,
    )
    overpayment_absorbed = (
        last_status == "OVERPAYMENT" and remaining_pay > ZERO
    )

    if remaining_pay > ZERO and not overpayment_absorbed:
        successful = [
            r for r in records
            if r.match_status in ("FULL", "PARTIAL", "OVERPAYMENT")
        ]
        if successful:
            applied = ", ".join(f"'{r.invoice_id}'" for r in successful)
            reason  = (
                f"{payment.currency} {remaining_pay:,.2f} of the payment could not be "
                f"matched to any invoice after applying amounts to invoice(s) {applied}. "
                "The remaining amount requires manual review."
            )
        else:
            reason = (
                f"The full payment amount of {payment.currency} {pay_amount:,.2f} "
                "could not be matched to any open invoice. "
                "Please verify the invoice number and customer details."
            )
        rec = await save_failed_match(payment_id, reason, db)
        records.append(rec)

    matched_invoice_ids = {
        r.invoice_id for r in records
        if r.invoice_id and r.match_status in ("FULL", "PARTIAL", "OVERPAYMENT")
    }
    for invoice_id in matched_invoice_ids:
        await update_invoice_status(invoice_id, db)

    await db.commit()


    return records