from fastapi import APIRouter, Depends, Request, Response
from src.config.hashing import verify_password
from src.config.jwthandler import create_access_token, create_refresh_token, verify_access_token, verify_refresh_token
from src.config.settings import settings
from src.api.rest.dependencies import get_current_user, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from src.schemas.user_schema import CreateUser,UserLogin
from src.core.services.user_service import create_user, get_user, get_user_by_phone, insert_refresh_token, is_revoked, revoke_refresh_token
from src.core.services.otp_services import cache_signup_otp,verify_signup_otp
from src.utils.email import send_otp_email

router = APIRouter()

@router.post("/register")
async def register_user(user_data : CreateUser, db : AsyncSession = Depends(get_db)):

    try:
        existing_user = await get_user(user_data.email, db)
        if existing_user:
            print(f"User already exists with email: {user_data.email}")
            raise HTTPException(status_code=400,detail="Email already exists")
        
        existing_phone = await get_user_by_phone(user_data.phone_no, db)

        if existing_phone:
            print(f"User already exists with phone: {user_data.phone_no}")
            raise HTTPException(status_code=400,detail="Phone number already exists")
        
        print(f"Creating user with data: {user_data.model_dump()}")
        await create_user(db = db, user_data=user_data)
        return {"message": "User registered successfully"}

    except IntegrityError as e:
        print(f"IntegrityError: {str(e)}")
        raise HTTPException(status_code=400,detail="Email or phone number already exists")

    except Exception as e:
        print(f"General error: {str(e)}")
        raise HTTPException(status_code=500,detail=f"Something went wrong {str(e)}")



@router.post("/login")
async def login_user(request: Request,response:Response,user_data : UserLogin,db : AsyncSession = Depends(get_db)):
    try :
        email = user_data.email
        password = user_data.password
        
        user = await get_user(email, db)

        if not user:
            raise HTTPException(status_code=401,detail="Invalid credentials")
        
        if not verify_password(password,user.password):
                raise HTTPException(status_code=401,detail="Invalid credentials password not mached")
        payload = {
            "id": user.id,
            "email": user.email
        }   
        print("JWT payload:", payload)

        access_data = create_access_token(payload=payload)
        print("access token created")
        refresh_data = create_refresh_token(payload=payload)
        
        print("refresh token created")

        access_token = access_data[0]
        
        refresh_token = refresh_data[0]
        
        refresh_token_id = refresh_data[1]
        
        print("refresh token id:", refresh_data[1])
        
        await insert_refresh_token(db, refresh_token_id)
        
        print("refresh token stored in DB")
        
        response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax",secure=False,max_age=settings.JWT_EXPIRATION_MINUTES*60) 
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, samesite="lax",secure=False,max_age=settings.JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS*8600) 

        return {"message": "Authentication Successfull","access_token": access_token}
    
    except Exception as e:
        print(f"[refresh] Token creation failed: {e}")
        raise HTTPException(status_code=500, detail="Token generation failed")


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return {
        "user_id": user["id"],
        "email": user["email"]
    }


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    refresh_token = request.cookies.get("refresh_token")

    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")

    payload = verify_refresh_token(refresh_token)
    if payload is None:
        raise HTTPException(status_code=403, detail="Invalid refresh token")
    
    if payload:
        jti = payload.get("jti")
        await revoke_refresh_token(jti, db)

    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")

    return {"message": "Logged out successfully"}


@router.post("/refresh")
async def refresh_token(request: Request,response:Response, db: AsyncSession = Depends(get_db)):
    
    refresh_token = request.cookies.get("refresh_token")

    payload = verify_refresh_token(refresh_token)

    if payload is None:
        raise HTTPException(status_code=403, detail="Invalid refresh token")
    
    jti = payload.get("jti")

    if await is_revoked(jti=jti,db = db):
        raise HTTPException(status_code=403, detail="Refresh token revoked")

    user_id = payload.get("id")
    email = payload.get("email")
    
    token_data = {
        "email" : email,"id" : user_id
    }

    access_data = create_access_token(payload=token_data)
    access_token = access_data[0]

    response.set_cookie(key="access_token", value=access_token, httponly=True, samesite="lax",secure=False,max_age=settings.JWT_EXPIRATION_MINUTES) 
    
    return { "access_token": access_token,"token_type": "bearer" }
