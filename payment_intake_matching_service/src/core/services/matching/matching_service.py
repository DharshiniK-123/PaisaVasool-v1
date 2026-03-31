import logging
from datetime import date
from decimal import Decimal
from typing import cast

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config.matching_config import MATCHING_CONFIG
from src.core.enums import MatchStatus
from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice
from src.data.models.postgres.payment_detail import PaymentDetail
from src.utils.extract_multiple_invoice_nos import _extract_multiple_invoice_nos
from src.utils.fx_client import get_exchange_rate

from .candidate_fetcher import CandidateFetcher
from .db_writer import (
    fetch_existing_records,
    get_already_matched_amount,
    is_duplicate,
    payment_already_processed,
    save_duplicate_match,
    save_failed_match,
    save_suggested_match,
    save_successful_match,
    update_invoice_status,
)
from .pipeline import DEEP_MATCH_PIPELINE, run_scoring_pipeline
from .resolver import build_status_sentence, resolve_match

logger = logging.getLogger(__name__)

ZERO = Decimal("0.00")

CONCLUSIVE_STATUSES = (
    MatchStatus.FULL,
    MatchStatus.PARTIAL,
    MatchStatus.OVERPAYMENT,
    MatchStatus.MANUALLY_MATCHED,
)


def _validate_payment(payment) -> str | None:
    """
    Returns an error reason string if the payment is invalid, else None.

    NOTE: Missing invoice_no is NO LONGER a hard failure here.
    Payments without an invoice number fall through to deep match.
    Only a zero/negative amount is a hard stop.
    """
    pay_amount = Decimal(str(payment.payment_amount))

    if pay_amount <= ZERO:
        return (
            f"Payment amount is {payment.currency} {pay_amount:,.2f}, which is not a valid "
            "amount. Payments must be greater than zero. This record requires manual review."
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
) -> tuple[MatchingPaymentInvoice | None, Decimal]:
    """
    Attempt to match a single invoice against the remaining payment.
    Used for both normal and FX-converted matches.
    """
    if await is_duplicate(payment.id, invoice.id, db):
        rec = await save_duplicate_match(payment.id, invoice, db)
        return rec, remaining_pay

    already_matched = await get_already_matched_amount(invoice.id, db)
    inv_remaining   = Decimal(str(invoice.total_amount)) - already_matched
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


async def _run_deep_match(
    payment,
    candidates_deep: list[InvoiceData],
    remaining_pay:   Decimal,
    db:              AsyncSession,
) -> list[MatchingPaymentInvoice]:
    """
    Deep match: no invoice number provided.
    Score all open customer invoices using DEEP_MATCH_PIPELINE
    (skips InvoiceNumberStrategy which would hard-disqualify everything).
    """
    scored: list[tuple[int, InvoiceData]] = []

    for invoice in candidates_deep:
        already_matched = await get_already_matched_amount(invoice.id, db)
        inv_remaining   = Decimal(str(invoice.total_amount)) - already_matched
        if inv_remaining <= ZERO:
            continue

        score, _ = run_scoring_pipeline(
            payment=payment,
            invoice=invoice,
            invoice_nos=[],
            remaining_pay=remaining_pay,
            inv_remaining=inv_remaining,
            pipeline=DEEP_MATCH_PIPELINE,
        )

        if score >= MATCHING_CONFIG.deep_match_threshold:
            scored.append((score, invoice))

    if not scored:
        return []

    # Sort highest score first
    scored.sort(key=lambda x: x[0], reverse=True)

    records: list[MatchingPaymentInvoice] = []

    if len(scored) == 1 or (scored[0][0] - scored[1][0] >= 10):
        best_score, best_invoice = scored[0]
        already_matched = await get_already_matched_amount(best_invoice.id, db)
        inv_remaining   = Decimal(str(best_invoice.total_amount)) - already_matched
        _, matched_amount, amount_pending = resolve_match(remaining_pay, inv_remaining)

        rec = await save_suggested_match(
            payment_id=payment.id,
            invoice_id=int(best_invoice.id),
            matched_amount=matched_amount,
            amount_pending=amount_pending,
            score=best_score,
            match_reason=(
                f"Deep match: no invoice number provided. "
                f"Best candidate: invoice '{best_invoice.invoice_number}' "
                f"matched by amount ({payment.currency} {remaining_pay:,.2f}) "
                f"and customer. Score: {best_score}/60. "
                "Please review and approve or reject this match."
            ),
            db=db,
        )
        records.append(rec)

    else:
        logger.info(
            "deep_match_multiple_candidates",
            extra={
                "payment_id": payment.id,
                "candidates": [(s, inv.invoice_number) for s, inv in scored],
            },
        )
        for rank, (score, invoice) in enumerate(scored, start=1):
            already_matched = await get_already_matched_amount(invoice.id, db)
            inv_remaining   = Decimal(str(invoice.total_amount)) - already_matched
            _, matched_amount, amount_pending = resolve_match(remaining_pay, inv_remaining)

            rec = await save_suggested_match(
                payment_id=payment.id,
                invoice_id=int(invoice.id),
                matched_amount=matched_amount,
                amount_pending=amount_pending,
                score=score,
                match_reason=(
                    f"Deep match: no invoice number provided. "
                    f"Multiple invoices match with similar confidence "
                    f"(candidate {rank} of {len(scored)}): "
                    f"invoice '{invoice.invoice_number}', score {score}/60. "
                    "Manual selection required — please approve one and reject the others."
                ),
                db=db,
            )
            records.append(rec)

    return records


async def run_matching_for_payment(
    payment_id: int,
    db:         AsyncSession,
    hint_invoice_id: int | None = None,
) -> list:
    """
    Match a payment against open invoices.

    Steps:
      1. Idempotency — return existing records if already processed or pending review
      2. Validate payment (amount > 0)
      3. Fetch + categorize invoice candidates
      4. If invoice_no present: same-currency matches
      5. If invoice_no present: FX-converted matches
      6. If invoice_no absent:  deep match (amount + customer scoring)
      7. Save unmatched remainder if any
      8. Update invoice payment statuses
      9. Commit
    """

    # 1. Idempotency (now also blocks re-run for SUGGESTED)
    if await payment_already_processed(payment_id, db):
        logger.info("payment_already_processed", extra={"payment_id": payment_id})
        return await fetch_existing_records(payment_id, db)

    # 2. Fetch payment
    result = await db.execute(
        select(PaymentDetail).where(
            PaymentDetail.id == payment_id,
            PaymentDetail.is_deleted.is_(False),
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        logger.warning("payment_not_found", extra={"payment_id": payment_id})
        return []

    logger.info(
        "matching_start",
        extra={
            "payment_id": payment_id,
            "amount":     str(payment.payment_amount),
            "currency":   payment.currency,
            "invoice_no": payment.invoice_no,
        },
    )

    # 3. Validate (only hard-fails on zero/negative amount now)
    validation_error = _validate_payment(payment)
    if validation_error:
        rec: MatchingPaymentInvoice | None = await save_failed_match(
            payment_id, validation_error, db
        )
        await db.commit()
        return [rec] if rec else []

    pay_amount    = Decimal(str(payment.payment_amount))
    remaining_pay = pay_amount
    records:      list[MatchingPaymentInvoice] = []

    invoice_nos = _extract_multiple_invoice_nos((payment.invoice_no or "").strip())

    # 4. Fetch candidates
    candidates = await CandidateFetcher(db).fetch(payment, invoice_nos)

    if not candidates.has_open():
        reason = candidates.best_failure_reason(payment, invoice_nos)
        rec = await save_failed_match(payment_id, reason, db)
        await db.commit()
        return [rec] if rec else []

    # 5. Same-currency matches (invoice_no path)
    for invoice in candidates.same_currency:
        if remaining_pay <= ZERO:
            break

        rec, remaining_pay = await _process_invoice(
            payment=payment,
            invoice=invoice,
            invoice_nos=invoice_nos,
            remaining_pay=remaining_pay,
            db=db,
        )
        if rec is not None:
            records.append(rec)

    # 6. FX-converted matches (invoice_no path)
    for invoice in candidates.fx_mismatch:
        if remaining_pay <= ZERO:
            break

        try:
            fx_rate = await get_exchange_rate(
                cast(date, payment.paid_date),
                str(payment.currency),
                str(invoice.currency),
                db,
            )
        except RuntimeError as exc:
            rec = await save_failed_match(
                payment_id,
                f"Currency mismatch: payment is in {payment.currency} but invoice "
                f"'{invoice.invoice_number}' is in {invoice.currency}. "
                f"Automatic FX conversion failed: {exc}. Manual review required.",
                db,
                invoice_id=int(invoice.id),
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
        )
        if rec is not None:
            records.append(rec)

    # 7. Deep match (no invoice_no path)
    if not records and candidates.deep_candidates:
        logger.info(
            "deep_match_attempt",
            extra={
                "payment_id": payment_id,
                "candidates": len(candidates.deep_candidates),
            },
        )
        deep_records = await _run_deep_match(
            payment=payment,
            candidates_deep=candidates.deep_candidates,
            remaining_pay=remaining_pay,
            db=db,
        )
        if deep_records:
            records.extend(deep_records)
            await db.commit()
            return records
        else:
            rec = await save_failed_match(
                payment_id,
                (
                    "No invoice number was provided and no open invoices could be matched "
                    f"by amount ({payment.currency} {pay_amount:,.2f}) with sufficient "
                    "confidence. Manual assignment is required."
                ),
                db,
            )
            records.append(rec)
            await db.commit()
            return records

    # 8. Unmatched remainder (normal path)
    last_status = next(
        (r.match_status for r in reversed(records)
         if r.match_status in CONCLUSIVE_STATUSES),
        None,
    )
    overpayment_absorbed = (last_status == MatchStatus.OVERPAYMENT and remaining_pay > ZERO)

    if remaining_pay > ZERO and not overpayment_absorbed:
        successful = [r for r in records if r.match_status in CONCLUSIVE_STATUSES]
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

    # 9. Update invoice statuses + commit
    matched_invoice_ids = {
        r.invoice_id for r in records
        if r.invoice_id and r.match_status in CONCLUSIVE_STATUSES
    }
    for invoice_id in matched_invoice_ids:
        await update_invoice_status(int(invoice_id), db)

    await db.commit()

    logger.info(
        "matching_complete",
        extra={
            "payment_id":    payment_id,
            "records":       len(records),
            "remaining_pay": str(remaining_pay),
        },
    )

    return records
