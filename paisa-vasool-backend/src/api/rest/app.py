from fastapi import FastAPI
from src.data.clients.postgres_client import init_db
from src.api.rest.routes import user_routes

app = FastAPI(title="Auth Service")

app.include_router(user_routes.router, prefix="/api/v1/users")

@app.on_event("startup")
async def on_startup():
    await init_db()