from fastapi import APIRouter, Request, Response
import httpx

router = APIRouter(prefix="/api/v1/users")

AUTH_SERVICE_URL = "http://localhost:8001/api/v1/users"

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_auth(request: Request, path: str):
    async with httpx.AsyncClient() as client:
        response = await client.request(
            method=request.method,
            url=f"{AUTH_SERVICE_URL}/{path}",
            headers=request.headers.raw,
            content=await request.body()
        )

    proxy_response = Response(
        content=response.content,
        status_code=response.status_code,  
        headers=dict(response.headers),    
    )

    return proxy_response