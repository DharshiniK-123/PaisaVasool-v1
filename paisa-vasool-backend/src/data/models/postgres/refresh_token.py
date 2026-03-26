import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import Boolean, DateTime, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.data.clients.postgres_client import base


def refresh_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=7)


class RefreshToken(base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, nullable=False)
    token_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), unique=True, nullable=False, default=uuid.uuid4
    )
    expire_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=refresh_expiry
    )
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())


