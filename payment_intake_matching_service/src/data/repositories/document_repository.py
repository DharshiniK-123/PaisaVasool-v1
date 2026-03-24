from sqlalchemy import select, insert as sa_insert
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.models.postgres.document import Document
from src.data.models.postgres.invoice_data import InvoiceData
from src.data.models.postgres.payment_detail import PaymentDetail
from src.data.models.postgres.matching_payment_invoice import MatchingPaymentInvoice
from src.data.models.postgres.customer import Customer


async def insert_document_returning_id(
    user_id: int | None,
    document_type: str,
    original_name: str,
    file_type: str,
    storage_path: str,
    db: AsyncSession,
) -> int:
    stmt = (
        sa_insert(Document)
        .values(
            user_id=user_id,
            document_type=document_type,
            file_name=original_name,
            file_type=file_type,
            storage_path=storage_path,
            status="PENDING",
        )
        .returning(Document.id)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one()


async def get_invoice_by_number_and_customer(
    invoice_number: str,
    customer_id: int,
    db: AsyncSession,
) -> InvoiceData | None:
    result = await db.execute(
        select(InvoiceData).where(
            InvoiceData.invoice_number == invoice_number,
            InvoiceData.customer_id == customer_id,
            InvoiceData.is_deleted.is_(False),
        )
    )
    return result.scalar_one_or_none()


async def insert_record_returning_id(
    model,
    document_id: int,
    customer_id: int,
    db: AsyncSession,
    **data,
) -> int:
    stmt = (
        sa_insert(model)
        .values(document_id=document_id, customer_id=customer_id, **data)
        .returning(model.id)
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.scalar_one()


async def get_customer_by_email(email: str, db: AsyncSession) -> Customer | None:
    result = await db.execute(
        select(Customer).where(Customer.email == email)
    )
    return result.scalar_one_or_none()


async def create_customer(name: str, email: str, db: AsyncSession) -> Customer:
    stmt = sa_insert(Customer).values(name=name, email=email)
    await db.execute(stmt)
    await db.commit()
    return await get_customer_by_email(email, db)


async def get_unmatched_payments_for_customer(
    customer_id: int,
    db: AsyncSession,
) -> list[PaymentDetail]:
    """Return all non-deleted payments for a customer that have not yet been
    successfully matched (i.e. have no FULL / PARTIAL / OVERPAYMENT record).

    These are payments that arrived before their invoice existed and need to
    be retried now that a new invoice has been saved.
    """
    successfully_matched_subq = (
        select(MatchingPaymentInvoice.payment_detail_id)
        .where(
            MatchingPaymentInvoice.match_status.in_(["FULL", "PARTIAL", "OVERPAYMENT"])
        )
    )

    result = await db.execute(
        select(PaymentDetail).where(
            PaymentDetail.customer_id == customer_id,
            PaymentDetail.is_deleted.is_(False),
            PaymentDetail.id.notin_(successfully_matched_subq),
        )
    )
    return result.scalars().all()
