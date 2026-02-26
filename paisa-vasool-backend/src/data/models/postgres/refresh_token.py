from datetime import datetime, timedelta, timezone
import uuid 
from sqlalchemy import Boolean, Column,Integer, DateTime , func
from sqlalchemy.dialects.postgresql import UUID
from src.data.clients.postgres_client import base

def refresh_expiry():
    return datetime.now(timezone.utc) + timedelta(days=7)

class RefreshToken(base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key = True , autoincrement = True, nullable= False)
    token_id = Column(UUID(as_uuid=True),unique=True,nullable=False,default=uuid.uuid4)
    expire_at = Column(DateTime(timezone=True),nullable=False,default=refresh_expiry) 
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=func.now())
