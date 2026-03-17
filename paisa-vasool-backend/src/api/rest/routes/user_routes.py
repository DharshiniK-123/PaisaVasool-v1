from fastapi import APIRouter, Depends, Request, Response
from src.config.hashing import verify_password
from src.config.jwthandler import create_access_token, create_refresh_token,  verify_refresh_token
from src.config.settings import settings
from src.api.rest.dependencies import get_current_user, get_current_admin, get_db
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from src.schemas.user_schema import CreateUser, UserLogin, AdminCreateUser, UserResponse
from src.core.services.user_service import create_user, get_user, get_user_by_phone, insert_refresh_token, is_revoked, revoke_refresh_token, get_all_users
from typing import List


router = APIRouter()

@router.post("/register")
async def register_user(user_data : CreateUser, db : AsyncSession = Depends(get_db)):

    try:
        existing_user = await get_user(user_data.email, db)
        if existing_user:
            raise HTTPException(status_code=400,detail="Email already exists")
        
        existing_phone = await get_user_by_phone(user_data.phone_no, db)
        if existing_phone:
            raise HTTPException(status_code=400,detail="Phone number already exists")
        
        await create_user(db = db, user_data=user_data)

        return {"message": "User registered successfully"}
    
    except HTTPException:
        raise

    except IntegrityError as e:
        raise HTTPException(status_code=400,detail="Email or phone number already exists")
    
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Registration failed. Please try again.")



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
        user_id=user.id
        email_ad=user.email
        payload = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
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
        
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, samesite="lax",secure=False,max_age=settings.JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS*86400) 
        
        
        print(user_id)
        print(email_ad)
        print(access_token)
        return {
            "user_id": user_id,
            "email": email_ad,
            "role": user.role,
            "access_token": access_token,
            
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[refresh] Token creation failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    print("user me entered---------------------------")
    return {
        "user_id": user["id"],
        "email": user["email"],
        "role": user.get("role", "finance_associate"),
    }


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(status_code=401, detail="Already logged out or session expired.")

        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=403, detail="Invalid session. Please log in again.")
        
        if payload:
            jti = payload.get("jti")
            await revoke_refresh_token(jti, db)
        response.delete_cookie("refresh_token")

        return {"message": "Logged out successfully"}
    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="Logout failed. Please try again.")



@router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        refresh_token = request.cookies.get("refresh_token") 

        if not refresh_token:
            raise HTTPException(status_code=403, detail="Session expired. Please log in again.")

        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=403, detail="Invalid session. Please log in again.")

        jti = payload.get("jti")
        if await is_revoked(jti=jti, db=db):
            raise HTTPException(status_code=403, detail="Session has been revoked. Please log in again.")

        access_data = create_access_token(payload={"id": payload.get("id"), "email": payload.get("email"), "role": payload.get("role", "finance_associate")})
        access_token = access_data[0]

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="Session refresh failed. Please log in again.")


# ── Admin routes ──────────────────────────────────────────────────────────────

@router.get("/admin/users", response_model=List[UserResponse])
async def list_users(
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all finance associate users. Admin only."""
    try:
        users = await get_all_users(db)
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch users.")


@router.post("/admin/users", response_model=UserResponse)
async def admin_create_user(
    user_data: AdminCreateUser,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Create a finance associate user. Admin only."""
    try:
        existing_user = await get_user(user_data.email, db)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        existing_phone = await get_user_by_phone(user_data.phone_no, db)
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already exists")

        await create_user(db=db, user_data=user_data, role="finance_associate")

        created = await get_user(user_data.email, db)
        return created

    except HTTPException:
        raise
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Email or phone number already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create user. Please try again.")

    try:
        existing_user = await get_user(user_data.email, db)
        if existing_user:
            raise HTTPException(status_code=400,detail="Email already exists")
        
        existing_phone = await get_user_by_phone(user_data.phone_no, db)
        if existing_phone:
            raise HTTPException(status_code=400,detail="Phone number already exists")
        
        await create_user(db = db, user_data=user_data)

        return {"message": "User registered successfully"}
    
    except HTTPException:
        raise

    except IntegrityError as e:
        raise HTTPException(status_code=400,detail="Email or phone number already exists")
    
    except Exception as e:
        raise HTTPException(status_code=500,detail=f"Registration failed. Please try again.")



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
        user_id=user.id
        email_ad=user.email
        payload = {
            "id": user.id,
            "email": user.email,
            "role": user.role,
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
        
        response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, samesite="lax",secure=False,max_age=settings.JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS*86400) 
        
        
        print(user_id)
        print(email_ad)
        print(access_token)
        return {
            "user_id": user_id,
            "email": email_ad,
            "access_token": access_token,
            
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[refresh] Token creation failed: {e}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")


@router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    print("user me entered---------------------------")
    return {
        "user_id": user["id"],
        "email": user["email"]
    }


@router.post("/logout")
async def logout(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(status_code=401, detail="Already logged out or session expired.")

        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=403, detail="Invalid session. Please log in again.")
        
        if payload:
            jti = payload.get("jti")
            await revoke_refresh_token(jti, db)
        response.delete_cookie("refresh_token")

        return {"message": "Logged out successfully"}
    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="Logout failed. Please try again.")



@router.post("/refresh")
async def refresh_token(request: Request, response: Response, db: AsyncSession = Depends(get_db)):
    try:
        refresh_token = request.cookies.get("refresh_token") 

        if not refresh_token:
            raise HTTPException(status_code=403, detail="Session expired. Please log in again.")

        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=403, detail="Invalid session. Please log in again.")

        jti = payload.get("jti")
        if await is_revoked(jti=jti, db=db):
            raise HTTPException(status_code=403, detail="Session has been revoked. Please log in again.")

        access_data = create_access_token(payload={"id": payload.get("id"), "email": payload.get("email")})
        access_token = access_data[0]

        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise

    except Exception:
        raise HTTPException(status_code=500, detail="Session refresh failed. Please log in again.")

@router.patch("/admin/users/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status_route(
    user_id: int,
    admin=Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Activate or deactivate a finance associate. Admin only."""
    from src.core.services.user_service import toggle_user_status
    try:
        user = await toggle_user_status(user_id=user_id, db=db)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update user status.")