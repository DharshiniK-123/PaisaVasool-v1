from fastapi import APIRouter, Request, Response
import httpx
import os

router = APIRouter(prefix="/api/v1/users")

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_auth(request: Request, path: str):
    # Forward both headers AND cookies
    forward_headers = dict(request.headers)
    forward_headers.pop("host", None)  # remove host header — causes issues with proxy

    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=f"{AUTH_SERVICE_URL}/api/v1/users/{path}",
            headers=forward_headers,   # ✅ includes Authorization
            cookies=request.cookies,   # ✅ includes refresh_token cookie
            content=await request.body(),
            params=request.query_params,
        )

    # ✅ Forward ALL response headers including Set-Cookie
    # So refresh_token cookie set by auth service reaches the browser
    response_headers = dict(response.headers)
    response_headers.pop("transfer-encoding", None)  # causes issues

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,      # ✅ forwards Set-Cookie to browser
        media_type=response.headers.get("content-type"),
    )