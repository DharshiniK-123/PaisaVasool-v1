from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware

from src.api.middleware.logging import logging_middleware, setup_logging
from src.api.middleware.authorizationMiddleware import AuthorizationMiddleware
from src.api.middleware.cors import setup_cors
from src.api.rest.routes.auth_service_routes import router as auth_router
from src.api.rest.routes.payment_intake_matching_routes import router as payment_intake_matching_router


setup_logging()

app = FastAPI(title="Paisa Vasool API Gateway")

app.add_middleware(BaseHTTPMiddleware, dispatch=logging_middleware)
app.add_middleware(AuthorizationMiddleware)

setup_cors(app)

app.include_router(auth_router)
app.include_router(payment_intake_matching_router)

@app.get("/")
async def health():
    return {"status": "gateway running"}