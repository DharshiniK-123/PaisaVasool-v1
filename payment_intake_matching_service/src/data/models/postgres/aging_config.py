from sqlalchemy import Column, Integer, String
from src.data.clients.postgres_client import base


class AgingConfig(base):
    __tablename__ = "aging_config"

    id                  = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    severity            = Column(String(50), nullable=False, unique=True)  # LOW/MEDIUM/HIGH/CRITICAL
    due_days_from       = Column(Integer, nullable=False)   # e.g. 0
    due_days_to         = Column(Integer, nullable=True)    # e.g. 30 — NULL means infinite (CRITICAL bucket)
    reminder_frequency  = Column(Integer, nullable=False)   # days between reminders