from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import httpx


AUTH_SERVICE_ME_URL = "http://auth-service:8000/api/v1/users/auth/me"


class AuthorizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        if request.method == "OPTIONS":
            return await call_next(request)

        public_paths = [
            "/",
            "/api/v1/users/login",
            "/api/v1/users/register",
            "/api/v1/users/refresh",
            "/docs",
            "/openapi.json"
        ]

        if request.url.path in public_paths:
            return await call_next(request)

        try:
            auth_header = request.headers.get("Authorization")
            if not auth_header:
                raise HTTPException(status_code=401, detail="Authorization header missing")
            try:
                scheme, token = auth_header.split(" ")
            except ValueError:
                raise HTTPException(status_code=401,detail="Invalid authorization format")
            if scheme != "Bearer":
                raise HTTPException(status_code=401, detail="Invalid auth scheme")

            async with httpx.AsyncClient(timeout=3) as client:
                response = await client.get(
                    AUTH_SERVICE_ME_URL,
                    headers={"Authorization": f"Bearer {token}"}
                )

            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")

         
            request.state.user = response.json()

            return await call_next(request)

        except HTTPException as e:
            return JSONResponse(
                status_code=e.status_code,
                content={"detail": e.detail}
            )

        except Exception:
            return JSONResponse(
                status_code=500,
                content={"detail": "Authentication service unavailable"}
            )