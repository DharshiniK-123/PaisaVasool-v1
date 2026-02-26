import json
import random
from typing import Optional
from src.data.clients.redis_clients import redis_client

OTP_TTL_SECONDS = 300 


def generate_otp() -> str:
    return str(random.randint(100000, 999999))


def _signup_otp_key(email: str) -> str:
    return f"otp:signup:{email}"


async def cache_signup_otp(email: str, payload: dict) -> str:
    
    otp = generate_otp()
    key = _signup_otp_key(email)

    value = {
        "otp": otp,
        "payload": payload
    }

    await redis_client.setex(
        key,
        OTP_TTL_SECONDS,
        json.dumps(value)
    )

    return otp


async def verify_signup_otp(email: str, otp: str) -> Optional[dict]:
    
    key = _signup_otp_key(email)
    data = await redis_client.get(key)

    if not data:
        return None  

    parsed = json.loads(data)

    if parsed["otp"] != otp:
        return None

    await redis_client.delete(key)

    return parsed["payload"]