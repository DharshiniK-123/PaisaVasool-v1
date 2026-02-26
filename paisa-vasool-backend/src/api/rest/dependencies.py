from src.data.clients.postgres_client import AsyncSessionLocal

async def get_db():
    async with AsyncSessionLocal() as Session:
        yield Session