import logging
from dataclasses import dataclass, field
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.models.postgres.customer import Customer
from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice
from src.utils.normalize import _normalize

logger = logging.getLogger(__name__)


def _fmt_customer(name: str | None, email: str | None) -> str:

    name  = (name  or "").strip()
    email = (email or "").strip()

    if name and email:
        return f"{name} ({email})"
    if email:
        return email
    if name:
        return name
    return "Unknown Customer"


@dataclass
class CandidateSet:
    same_currency:   list[InvoiceData] = field(default_factory=list)
    fx_mismatch:     list[InvoiceData] = field(default_factory=list)
    already_paid:    list[InvoiceData] = field(default_factory=list)
    deleted:         list[InvoiceData] = field(default_factory=list)

    customer_name:   str | None = None
    customer_email:  str | None = None

    def has_open(self) -> bool:
        return bool(self.same_currency or self.fx_mismatch)

    @property
    def customer_label(self) -> str:
        return _fmt_customer(self.customer_name, self.customer_email)

    def best_failure_reason(self, payment, invoice_nos: list[str]) -> str:
        customer = self.customer_label

        for inv in self.already_paid:
            inv_num = _normalize(inv.invoice_number or "")
            if any(n == inv_num or inv_num in n or n in inv_num for n in invoice_nos):
                return (
                    f"Invoice '{inv.invoice_number}' for {customer} has already been "
                    "fully paid by a previous payment. This payment cannot be applied "
                    "to it again. Please verify whether a duplicate payment was made."
                )

        for inv in self.deleted:
            inv_num = _normalize(inv.invoice_number or "")
            if any(n == inv_num or inv_num in n or n in inv_num for n in invoice_nos):
                return (
                    f"Invoice '{inv.invoice_number}' for {customer} exists but has been "
                    "deleted/archived and cannot receive payments. Please contact your "
                    "finance team to restore the invoice or redirect this payment."
                )

        return (
            f"No open invoices were found for {customer}. "
            "Either all invoices are already fully paid, or the customer details "
            "do not match any invoice on record."
        )


class CandidateFetcher:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def fetch(self, payment, invoice_nos: list[str]) -> CandidateSet:
        customer_result = await self.db.execute(
            select(Customer).where(Customer.id == payment.customer_id)
        )
        customer = customer_result.scalar_one_or_none()
        customer_name  = customer.name  if customer else None
        customer_email = customer.email if customer else None

        fully_paid_subq = (
            select(MatchingPaymentInvoice.invoice_id)
            .where(MatchingPaymentInvoice.match_status == "FULL")
        )

        open_result = await self.db.execute(
            select(InvoiceData).where(
                and_(
                    InvoiceData.customer_id == payment.customer_id,
                    InvoiceData.id.notin_(fully_paid_subq),
                    InvoiceData.is_deleted.is_(False),
                )
            )
        )
        open_invoices: list[InvoiceData] = open_result.scalars().all()

        paid_result = await self.db.execute(
            select(InvoiceData).where(
                and_(
                    InvoiceData.customer_id == payment.customer_id,
                    InvoiceData.id.in_(fully_paid_subq),
                    InvoiceData.is_deleted.is_(False),
                )
            )
        )
        already_paid: list[InvoiceData] = paid_result.scalars().all()

        deleted_result = await self.db.execute(
            select(InvoiceData).where(
                and_(
                    InvoiceData.customer_id == payment.customer_id,
                    InvoiceData.is_deleted.is_(True),
                )
            )
        )
        deleted: list[InvoiceData] = deleted_result.scalars().all()

        same_currency: list[InvoiceData] = []
        fx_mismatch:   list[InvoiceData] = []

        for inv in open_invoices:
            inv_num    = _normalize(inv.invoice_number or "")
            number_hit = any(
                n == inv_num or inv_num in n or n in inv_num
                for n in invoice_nos
            )
            if not number_hit:
                continue
            if payment.currency == inv.currency:
                same_currency.append(inv)
            else:
                fx_mismatch.append(inv)

        logger.debug(
            "candidate_fetch",
            extra={
                "payment_id":    payment.id,
                "customer":      _fmt_customer(customer_name, customer_email),
                "same_currency": len(same_currency),
                "fx_mismatch":   len(fx_mismatch),
                "already_paid":  len(already_paid),
                "deleted":       len(deleted),
            },
        )

        return CandidateSet(
            same_currency=same_currency,
            fx_mismatch=fx_mismatch,
            already_paid=already_paid,
            deleted=deleted,
            customer_name=customer_name,
            customer_email=customer_email,
        )