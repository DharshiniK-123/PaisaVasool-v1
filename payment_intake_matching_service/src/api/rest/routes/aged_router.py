from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from src.api.rest.dependencies import get_db
from src.core.services.scheduler import run_aging_and_reminders, reschedule_aging_job
from src.data.models.postgres.reminder_log import ReminderLog
from src.data.models.postgres.aging_config import AgingConfig
from src.schemas.payment_intake_matching import (AgingConfigCreate,AgingConfigUpdate,AgingConfigResponse,ReminderLogResponse,)

router = APIRouter(tags=["Aging & Reminders"])


@router.post("/aging/run")
async def trigger_aging_job():
    await run_aging_and_reminders()
    return {"status": "Aging job completed successfully"}

@router.get("/aging/reminders", response_model=list[ReminderLogResponse])
async def get_all_reminders(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ReminderLog).order_by(ReminderLog.sent_at.desc())
    )
    return result.scalars().all()


@router.get("/aging/reminders/status/{status}", response_model=list[ReminderLogResponse])
async def get_reminders_by_status(status: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.status == status.upper()).order_by(ReminderLog.sent_at.desc()))
    return result.scalars().all()


@router.get("/aging/reminders/invoice/{invoice_id}", response_model=list[ReminderLogResponse])
async def get_reminders_by_invoice(invoice_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.invoice_id == invoice_id).order_by(ReminderLog.sent_at.desc()))
    return result.scalars().all()


@router.get("/aging/reminders/customer/{customer_id}", response_model=list[ReminderLogResponse])
async def get_reminders_by_customer(customer_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.customer_id == customer_id).order_by(ReminderLog.sent_at.desc()))
    return result.scalars().all()


@router.get("/aging/reminders/{reminder_id}", response_model=ReminderLogResponse)
async def get_reminder_by_id(reminder_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ReminderLog).where(ReminderLog.id == reminder_id))
    reminder = result.scalar_one_or_none()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder

@router.get("/aging-config/", response_model=list[AgingConfigResponse])
async def get_all_configs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgingConfig).order_by(AgingConfig.due_days_from))
    return result.scalars().all()


@router.get("/aging-config/{config_id}", response_model=AgingConfigResponse)
async def get_config(config_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgingConfig).where(AgingConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config


@router.post("/aging-config/", response_model=AgingConfigResponse)
async def create_config(payload: AgingConfigCreate, db: AsyncSession = Depends(get_db)):
    config = AgingConfig(**payload.model_dump())
    db.add(config)
    await db.commit()
    await db.refresh(config)

    if config.severity == "SCHEDULER" and config.run_hour is not None:
        await reschedule_aging_job(config.run_hour, config.run_minute or 0)

    return config


@router.put("/aging-config/{config_id}", response_model=AgingConfigResponse)
async def update_config(config_id: int, payload: AgingConfigUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgingConfig).where(AgingConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(config, key, value)

    await db.commit()
    await db.refresh(config)

    if config.severity == "SCHEDULER" and config.run_hour is not None:
        await reschedule_aging_job(config.run_hour, config.run_minute or 0)

    return config


@router.delete("/aging-config/{config_id}")
async def delete_config(config_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(AgingConfig).where(AgingConfig.id == config_id))
    config = result.scalar_one_or_none()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    await db.delete(config)
    await db.commit()
    return {"status": "Deleted successfully"}