from datetime import date
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.models.postgres.aging_config import AgingConfig
from src.data.models.postgres.invoice_data import InvoiceData


async def get_active_aging_configs(db: AsyncSession) -> list[AgingConfig]:
    result = await db.execute(
        select(AgingConfig)
        .where(AgingConfig.is_active)
        .where(AgingConfig.severity != "SCHEDULER")
        .order_by(AgingConfig.due_days_from)
    )
    return result.scalars().all()


async def get_overdue_invoices(db: AsyncSession) -> list[InvoiceData]:
    today = date.today()
    result = await db.execute(
        select(InvoiceData).where(
            and_(
                InvoiceData.payment_status.in_(["UNPAID", "PARTIALLY_PAID"]),
                InvoiceData.due_date < today,
            )
        )
    )
    return result.scalars().all()
