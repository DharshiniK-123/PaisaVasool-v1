from typing import Any, Callable

import logging
import sys
import time
import uuid

from fastapi import Request, Response


def setup_logging() -> None:
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)
    logger.handlers.clear()

    console_handler = logging.StreamHandler(sys.stdout)
    console_formatter = logging.Formatter("%(asctime)s - %(levelname)s - %(name)s - %(message)s")
    console_handler.setFormatter(console_formatter)
    logger.addHandler(console_handler)


async def logging_middleware(
    request: Request, call_next: Callable[[Request], Any]
) -> Any:
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id

    logger = logging.getLogger("request")
    start = time.time()

    logger.info(f"[{request_id}] --> {request.method} {request.url.path}")

    try:
        response = await call_next(request)
    except Exception:
        logger.exception(f"[{request_id}] Unhandled error during request")
        raise

    duration = round((time.time() - start) * 1000, 2)
    log = logger.warning if response.status_code >= 400 else logger.info
    log(
        f"[{request_id}] <-- {request.method} {request.url.path} "
        f"| status={response.status_code} | duration={duration}ms"
    )

    response.headers["X-Request-ID"] = request_id
    return response

