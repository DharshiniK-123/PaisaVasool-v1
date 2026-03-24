from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from src.data.models.postgres.scheduler_settings import SchedulerSettings


async def get_or_create_scheduler_settings(db: AsyncSession) -> SchedulerSettings:
    result = await db.execute(
        select(SchedulerSettings).where(SchedulerSettings.id == 1)
    )
    settings = result.scalar_one_or_none()

    if settings is None:
        settings = SchedulerSettings(id=1, run_hour=9, run_minute=0, is_enabled=True)
        db.add(settings)
        await db.commit()

    return settings
