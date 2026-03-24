import logging
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice

logger = logging.getLogger(__name__)


async def get_already_matched_amount(
    invoice_id: int,
    db: AsyncSession,
    lock: bool = False,
) -> Decimal:
    if lock:
        await db.execute(
            select(InvoiceData)
            .where(InvoiceData.id == invoice_id)
            .with_for_update()
        )

    result = await db.execute(
        select(func.coalesce(func.sum(MatchingPaymentInvoice.matched_amount), 0))
        .where(
            and_(
                MatchingPaymentInvoice.invoice_id == invoice_id,
                MatchingPaymentInvoice.match_status.in_(["FULL", "PARTIAL", "OVERPAYMENT"]),
            )
        )
    )
    return Decimal(str(result.scalar()))


async def is_duplicate(payment_id: int, invoice_id: int, db: AsyncSession) -> bool:
    result = await db.execute(
        select(func.count(MatchingPaymentInvoice.id))
        .where(
            and_(
                MatchingPaymentInvoice.payment_detail_id == payment_id,
                MatchingPaymentInvoice.invoice_id        == invoice_id,
                MatchingPaymentInvoice.match_status.in_(["FULL", "PARTIAL", "OVERPAYMENT"]),
            )
        )
    )
    return (result.scalar() or 0) > 0


async def payment_already_processed(payment_id: int, db: AsyncSession) -> bool:
    # INVALIDATED records do not count — the invoice was deleted and the payment
    # must be re-matched against the replacement invoice.
    result = await db.execute(
        select(func.count(MatchingPaymentInvoice.id))
        .where(
            and_(
                MatchingPaymentInvoice.payment_detail_id == payment_id,
                MatchingPaymentInvoice.match_status.in_(["FULL", "PARTIAL", "OVERPAYMENT"]),
            )
        )
    )
    return (result.scalar() or 0) > 0


async def delete_failed_records(payment_id: int, db: AsyncSession) -> None:
    """Delete all FAILED and INVALIDATED match records for a payment so it can be retried.
    INVALIDATED records are created when the matched invoice is deleted — they must be
    cleared before re-matching so payment_already_processed returns False."""
    result = await db.execute(
        select(MatchingPaymentInvoice).where(
            and_(
                MatchingPaymentInvoice.payment_detail_id == payment_id,
                MatchingPaymentInvoice.match_status.in_(["FAILED", "INVALIDATED"]),
            )
        )
    )
    for record in result.scalars().all():
        await db.delete(record)
    await db.flush()


async def fetch_existing_records(payment_id: int, db: AsyncSession) -> list[MatchingPaymentInvoice]:
    result = await db.execute(
        select(MatchingPaymentInvoice)
        .where(MatchingPaymentInvoice.payment_detail_id == payment_id)
    )
    return result.scalars().all()


async def save_failed_match(
    payment_id: int,
    reason:     str,
    db:         AsyncSession,
    invoice_id: int | None = None,
    score:      int        = 0,
) -> MatchingPaymentInvoice:
    record = MatchingPaymentInvoice(
        payment_detail_id=payment_id,
        invoice_id=invoice_id,
        matched_amount=Decimal("0.00"),
        amount_pending=None,
        match_score=Decimal(str(score)),
        match_status="FAILED",
        match_reason=reason,
    )
    db.add(record)
    await db.flush()
    logger.info(
        "match_failed",
        extra={"payment_id": payment_id, "invoice_id": invoice_id, "reason": reason[:120]},
    )
    return record


async def save_duplicate_match(
    payment_id: int,
    invoice:    InvoiceData,
    db:         AsyncSession,
) -> MatchingPaymentInvoice:
    record = MatchingPaymentInvoice(
        payment_detail_id=payment_id,
        invoice_id=invoice.id,
        matched_amount=Decimal("0.00"),
        amount_pending=Decimal(str(invoice.total_amount)),
        match_score=Decimal("0.00"),
        match_status="DUPLICATE",
        match_reason=(
            f"This payment has already been matched to invoice '{invoice.invoice_number}'. "
            "Creating a second match record would result in double-counting."
        ),
    )
    db.add(record)
    await db.flush()
    return record


async def save_successful_match(
    payment_id:     int,
    invoice_id:     int,
    matched_amount: Decimal,
    amount_pending: Decimal,
    score:          int,
    match_status:   str,
    match_reason:   str,
    db:             AsyncSession,
) -> MatchingPaymentInvoice:
    record = MatchingPaymentInvoice(
        payment_detail_id=payment_id,
        invoice_id=invoice_id,
        matched_amount=matched_amount,
        amount_pending=amount_pending,
        match_score=Decimal(str(score)),
        match_status=match_status,
        match_reason=match_reason,
    )
    db.add(record)
    await db.flush()
    logger.info(
        "match_saved",
        extra={
            "payment_id":  payment_id,
            "invoice_id":  invoice_id,
            "status":      match_status,
            "score":       score,
            "matched_amt": str(matched_amount),
        },
    )
    return record


# ---------------------------------------------------------------------------
# Auto-resolve helpers
# Each function handles one discrepancy type and flips qualifying records to
# RESOLVED so they drop off the discrepancy list automatically.
# ---------------------------------------------------------------------------

async def resolve_partial_records(invoice_id: int, db: AsyncSession) -> None:
    """PARTIAL → RESOLVED when invoice becomes PAID or OVERPAID.
    Triggered by update_invoice_status whenever total matched == invoice total."""
    result = await db.execute(
        select(MatchingPaymentInvoice).where(
            and_(
                MatchingPaymentInvoice.invoice_id == invoice_id,
                MatchingPaymentInvoice.match_status == "PARTIAL",
            )
        )
    )
    for record in result.scalars().all():
        record.match_status = "RESOLVED"
        record.match_reason = (record.match_reason or "") + (
            " This partial payment has since been completed — invoice is now fully paid."
        )
    await db.flush()


async def resolve_duplicate_records(payment_id: int, db: AsyncSession) -> None:
    """DUPLICATE → RESOLVED when the conflicting payment is soft-deleted.
    Call this whenever a PaymentDetail is marked is_deleted=True."""
    from src.data.models.postgres.payment_detail import PaymentDetail

    result = await db.execute(
        select(MatchingPaymentInvoice).where(
            and_(
                MatchingPaymentInvoice.payment_detail_id == payment_id,
                MatchingPaymentInvoice.match_status == "DUPLICATE",
            )
        )
    )
    for record in result.scalars().all():
        # Find other DUPLICATE records on the same invoice
        others_result = await db.execute(
            select(MatchingPaymentInvoice).where(
                and_(
                    MatchingPaymentInvoice.invoice_id == record.invoice_id,
                    MatchingPaymentInvoice.match_status == "DUPLICATE",
                    MatchingPaymentInvoice.payment_detail_id != payment_id,
                )
            )
        )
        other_records = others_result.scalars().all()

        # Resolve only if every other duplicate payment is now deleted
        all_others_deleted = True
        for other_rec in other_records:
            pay_result = await db.execute(
                select(PaymentDetail).where(PaymentDetail.id == other_rec.payment_detail_id)
            )
            pay = pay_result.scalar_one_or_none()
            if pay and not pay.is_deleted:
                all_others_deleted = False
                break

        if all_others_deleted and other_records:
            record.match_status = "RESOLVED"
            record.match_reason = (record.match_reason or "") + (
                " The duplicate payment entry has been removed — this record is no longer a duplicate."
            )
    await db.flush()


async def resolve_failed_records_for_payment(payment_id: int, db: AsyncSession) -> None:
    """FAILED → RESOLVED when the payment itself is soft-deleted/voided.
    A deleted payment can never be matched, so its FAILED records are moot."""
    result = await db.execute(
        select(MatchingPaymentInvoice).where(
            and_(
                MatchingPaymentInvoice.payment_detail_id == payment_id,
                MatchingPaymentInvoice.match_status == "FAILED",
            )
        )
    )
    for record in result.scalars().all():
        record.match_status = "RESOLVED"
        record.match_reason = (record.match_reason or "") + (
            " Payment was deleted/voided — discrepancy is no longer applicable."
        )
    await db.flush()


async def resolve_overpayment_records(invoice_id: int, db: AsyncSession) -> None:
    """OVERPAYMENT → RESOLVED when the invoice is soft-deleted/voided.
    Once an invoice is gone there is nothing to overpay against."""
    result = await db.execute(
        select(MatchingPaymentInvoice).where(
            and_(
                MatchingPaymentInvoice.invoice_id == invoice_id,
                MatchingPaymentInvoice.match_status == "OVERPAYMENT",
            )
        )
    )
    for record in result.scalars().all():
        record.match_status = "RESOLVED"
        record.match_reason = (record.match_reason or "") + (
            " Invoice has been voided — overpayment discrepancy is no longer applicable."
        )
    await db.flush()



async def invalidate_match_records_for_invoice(invoice_id: int, db: AsyncSession) -> None:
    """When an invoice is deleted, mark all its successful match records
    (FULL / PARTIAL / OVERPAYMENT) as INVALIDATED so the linked payments
    are no longer considered processed and can be re-matched against the
    replacement invoice that the user uploads next."""
    result = await db.execute(
        select(MatchingPaymentInvoice).where(
            and_(
                MatchingPaymentInvoice.invoice_id == invoice_id,
                MatchingPaymentInvoice.match_status.in_(["FULL", "PARTIAL", "OVERPAYMENT"]),
            )
        )
    )
    for record in result.scalars().all():
        record.match_status = "INVALIDATED"
        record.match_reason = (record.match_reason or "") + (
            " Invoice was deleted — this match has been invalidated."
            " Payment will be re-matched when a replacement invoice is uploaded."
        )
    await db.flush()

async def update_invoice_status(invoice_id: int, db: AsyncSession) -> None:
    result = await db.execute(
        select(InvoiceData).where(
            InvoiceData.id == invoice_id,
            InvoiceData.is_deleted.is_(False),
        )
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        return

    has_overpayment_result = await db.execute(
        select(func.count(MatchingPaymentInvoice.id)).where(
            and_(
                MatchingPaymentInvoice.invoice_id   == invoice_id,
                MatchingPaymentInvoice.match_status == "OVERPAYMENT",
            )
        )
    )
    has_overpayment = (has_overpayment_result.scalar() or 0) > 0

    total_matched       = await get_already_matched_amount(invoice_id, db)
    total               = Decimal(str(invoice.total_amount))
    invoice.paid_amount = total_matched

    if has_overpayment or total_matched > total:
        invoice.payment_status = "OVERPAID"
        await resolve_partial_records(invoice_id, db)
    elif total_matched == total:
        invoice.payment_status = "PAID"
        await resolve_partial_records(invoice_id, db)
    elif total_matched > 0:
        invoice.payment_status = "PARTIALLY_PAID"
    else:
        invoice.payment_status = "UNPAID"

    await db.flush()
