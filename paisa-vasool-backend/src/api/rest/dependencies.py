from src.data.clients.postgres_client import AsyncSessionLocal
from fastapi import Depends, HTTPException, Request
from src.config.jwthandler import verify_access_token

async def get_db():
    async with AsyncSessionLocal() as Session:
        yield Session

async def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
    else:
        raise HTTPException(status_code=401, detail="Access token missing")

    payload = verify_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return payload

async def get_current_admin(request: Request):
    payload = await get_current_user(request)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload