from src.api.rest.app import app
from src.api.middleware.logging import setup_logging

from src.data.clients.postgres_client import init_db

from src.api.rest.routes import user_routes
setup_logging()



@app.on_event("startup")
async def on_startup():
    await init_db()


app.include_router(router=user_routes.router)