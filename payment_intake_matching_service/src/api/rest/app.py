from fastapi import FastAPI
from src.data.clients.postgres_client import init_db
from src.api.rest.routes import document_routes

app = FastAPI(title="payment intake and matching service")

app.include_router(document_routes.router, prefix="/api/v1/payment_intake_matching")

@app.on_event("startup")
async def on_startup():
    await init_db()