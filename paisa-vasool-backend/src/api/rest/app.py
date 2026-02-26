from fastapi import FastAPI
from src.api.middleware.authorizationMiddleware import AuthorizationMiddleware
from src.api.middleware.logging import logging_middleware

from starlette.middleware.base import BaseHTTPMiddleware
from src.api.middleware.cors import setup_cors


app=FastAPI()

app.add_middleware(BaseHTTPMiddleware, dispatch = logging_middleware)
app.add_middleware(AuthorizationMiddleware)
setup_cors(app)