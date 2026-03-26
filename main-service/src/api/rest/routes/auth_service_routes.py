import logging

import httpx
from fastapi import APIRouter, Request, Response

from src.config.settings import settings

router = APIRouter(prefix="/api/v1/users")

AUTH_SERVICE_URL = settings.AUTH_SERVICE_URL

logger = logging.getLogger(__name__)


@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy_auth(request: Request, path: str) -> Response:

    """Api gateway route for auth service"""

    forward_headers = dict(request.headers)
    forward_headers.pop("host", None)

    url = f"{AUTH_SERVICE_URL}/api/v1/users/{path}"

    try:
        async with httpx.AsyncClient(timeout=settings.HTTP_TIMEOUT) as client:
            response = await client.request(
                method=request.method,
                url=url,
                headers=forward_headers,
                cookies=request.cookies,
                content=await request.body(),
                params=request.query_params,
            )

        response_headers = dict(response.headers)
        response_headers.pop("transfer-encoding", None)

        logger.info(
            "proxy_request_success",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "forward_url": url,
                "status_code": response.status_code,
            },
        )

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get("content-type"),
        )

    except httpx.HTTPStatusError as exc:
        logger.error(
            "proxy_http_error",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "forward_url": url,
                "error": str(exc),
            },
        )
        return Response(
            content=b'{"error": "Upstream service error"}',
            status_code=502,
            media_type="application/json",
        )

    except httpx.RequestError as exc:
        logger.error(
            "proxy_request_failed",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "forward_url": url,
                "error": str(exc),
            },
        )
        return Response(
            content=b'{"error": "Service unavailable"}',
            status_code=503,
            media_type="application/json",
        )

    except Exception:
        logger.exception(
            "proxy_unexpected_error",
            extra={
                "method": request.method,
                "path": str(request.url.path),
                "forward_url": url,
            },
        )
        return Response(
            content=b'{"error": "Internal server error"}',
            status_code=500,
            media_type="application/json",
        )
