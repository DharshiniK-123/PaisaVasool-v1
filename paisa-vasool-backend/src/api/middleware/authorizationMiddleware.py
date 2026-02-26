from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from src.config.jwthandler import verify_access_token


class AuthorizationMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request : Request, call_next):
        if request.method == "OPTIONS":
            return await call_next(request)
        public_paths = ["/","/users/login", "/users/register", "/users/refresh"]
        if request.url.path in public_paths:
            return await call_next(request)
        try :
            credential = request.headers.get('Authorization')
            if credential is None:
                raise HTTPException(detail="Bearer authorization required", status_code=401)
            credential = credential.split(' ')
            if credential[0] != 'Bearer':
                raise HTTPException(status_code=403, detail = "Invalid or expired token.")  
            access_payload = verify_access_token(credential[1])
            if access_payload is None:
                raise HTTPException(status_code=403, detail="Invalid or expired token.") 
            request.state.user = access_payload
            return await call_next(request) 
        except HTTPException as e:
            return JSONResponse(status_code=e.status_code, content={"detail-123": e.detail})
        except Exception as e:
            return JSONResponse(status_code=400 , content={"detail-456": str(e)})


