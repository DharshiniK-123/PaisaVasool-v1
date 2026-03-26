from fastapi import APIRouter, Request, Response
import httpx
import os

router = APIRouter(prefix="/api/v1/payment_intake_matching")

MATCHING_SERVICE_URL = os.getenv("MATCHING_SERVICE_URL")


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_matching(request: Request, path: str):
    """Api gateway route for payment_intake_mathcing service"""
    url = f"{MATCHING_SERVICE_URL}/api/v1/payment_intake_matching/{path}"
    forward_headers = {}
    auth_header = request.headers.get("Authorization")
    if auth_header:
        forward_headers["Authorization"] = auth_header

    content_type = request.headers.get("content-type", "")

    async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, read=600.0)) as client:
        if content_type.startswith("multipart/form-data"):
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
                headers=forward_headers,
                cookies=request.cookies,
            )
        elif content_type.startswith("application/json"):
            try:
                json_body = await request.json()
            except Exception:
                json_body = None 
            response = await client.request(
                method=request.method,
                url=url,
                params=request.query_params,
                json=json_body,   
                headers=forward_headers,
                cookies=request.cookies,
            )
        else:
            response = await client.request(
                method=request.method,
                url=url,
                params=request.query_params,
                content=await request.body(),
                headers=forward_headers,
                cookies=request.cookies,
            )

    excluded = {"content-encoding", "transfer-encoding", "content-length"}
    clean_headers = {k: v for k, v in response.headers.items() if k.lower() not in excluded}

    return Response(
        content=response.content,
        status_code=response.status_code,
        headers=clean_headers,
    )