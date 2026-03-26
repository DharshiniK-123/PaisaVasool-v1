from __future__ import annotations

import logging

from fastapi import FastAPI

from src.api.rest.routes import health_routes, user_routes
from src.observability.logging import setup_logging

logger = logging.getLogger(__name__)

app = FastAPI(title="Auth Service")

app.include_router(user_routes.router, prefix="/api/v1/users")
app.include_router(health_routes.router, prefix="/api/v1/users")


@app.on_event("startup")
async def on_startup() -> None:
    setup_logging()
    logger.info("Auth service starting up")
