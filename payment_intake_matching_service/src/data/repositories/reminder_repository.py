from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.models.postgres.reminder_log import ReminderLog
from src.data.models.postgres.customer import Customer


async def get_last_sent_reminder(invoice_id: int, db: AsyncSession) -> ReminderLog | None:
    result = await db.execute(
        select(ReminderLog)
        .where(
            and_(
                ReminderLog.invoice_id == invoice_id,
                ReminderLog.status == "SENT",
            )
        )
        .order_by(ReminderLog.sent_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_customer_by_id(customer_id: int, db: AsyncSession) -> Customer | None:
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id)
    )
    return result.scalar_one_or_none()


async def save_reminder_log(reminder: ReminderLog, db: AsyncSession) -> ReminderLog:
    db.add(reminder)
    await db.flush()
    return reminder
