from sqlalchemy import Column, Integer, String, DateTime, func
from src.data.clients.postgres_client import base

class User(base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_no = Column(String(15), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="finance_associate")
    is_active = Column(String(10), nullable=False, default="active")
    created_at = Column(DateTime(timezone=True), default=func.now())