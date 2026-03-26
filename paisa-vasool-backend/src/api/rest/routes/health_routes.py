from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.rest.dependencies import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/")
async def health_check() -> dict[str, str]:
    """Basic liveness check — is the service running?"""
    return {"status": "ok"}


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)) -> dict[str, Any]:
    """Readiness check — is the service ready to handle requests?"""
    checks: dict[str, str] = {}

    try:
        await db.execute(text("SELECT 1"))
        checks["postgres"] = "ok"
    except Exception as e:
        checks["postgres"] = f"error: {str(e)}"

    overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"

    return {
        "status": overall,
        "checks": checks,
    }