from fastapi import APIRouter, Request, Response
import httpx
import os

router = APIRouter(prefix="/api/v1/payment_intake_matching")

MATCHING_SERVICE_URL = os.getenv("MATCHING_SERVICE_URL")

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_matching(request: Request, path: str):

    url = f"{MATCHING_SERVICE_URL}/api/v1/payment_intake_matching/{path}"

    # ✅ Forward Authorization header from frontend to payment service
    forward_headers = {}
    auth_header = request.headers.get("Authorization")
    if auth_header:
        forward_headers["Authorization"] = auth_header

    async with httpx.AsyncClient(timeout=httpx.Timeout(10.0, read=120.0)) as client:
        if request.headers.get("content-type", "").startswith("multipart/form-data"):
            form = await request.form()
            files = []
            data = {}
            for key, value in form.multi_items():
                if hasattr(value, "filename"):
                    files.append((
                        key,
                        (value.filename, await value.read(), value.content_type),
                    ))
                else:
                    data[key] = value

            response = await client.request(
                method=request.method,
                url=url,
                params=request.query_params,
                data=data,
                files=files,
                headers=forward_headers,  # ✅ added
                cookies=request.cookies,
            )
        else:
            response = await client.request(
                method=request.method,
                url=url,
                params=request.query_params,
                content=await request.body(),
                headers=forward_headers,  # ✅ added
                cookies=request.cookies,
            )

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=dict(response.headers),
    )