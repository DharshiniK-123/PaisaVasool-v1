from fastapi import APIRouter, Request, Response
import httpx
import os

router = APIRouter(prefix="/api/v1/users")

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL")

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_auth(request: Request, path: str):
    forward_headers = dict(request.headers)
    forward_headers.pop("host", None)
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=f"{AUTH_SERVICE_URL}/api/v1/users/{path}",
            headers=forward_headers,  
            cookies=request.cookies,
            content=await request.body(),
            params=request.query_params,
        )
    response_headers = dict(response.headers)
    response_headers.pop("transfer-encoding", None) 

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=response_headers,
        media_type=response.headers.get("content-type"),
    )