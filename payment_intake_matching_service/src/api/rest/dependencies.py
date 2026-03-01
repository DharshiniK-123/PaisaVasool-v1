from src.data.clients.postgres_client import AsyncSessionLocal


async def get_db():
    async with AsyncSessionLocal() as Session:
        yield Session


from fastapi import Depends, HTTPException, Request
from src.config.jwt_handler import verify_access_token

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            scheme, token = auth_header.split(" ")
        except ValueError:
            raise HTTPException(status_code=401, detail="Invalid authorization format")
        if scheme != "Bearer":
            raise HTTPException(status_code=401, detail="Invalid auth scheme")
    else:
        # Fall back to cookie
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(status_code=401, detail="Missing Authorization header or cookie")

    payload = verify_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload