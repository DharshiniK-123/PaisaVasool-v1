from __future__ import annotations

import logging
from typing import Any, cast

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.rest.dependencies import get_current_admin, get_current_user, get_db
from src.config.hashing import get_password_hashed, verify_password
from src.config.jwthandler import (
    create_access_token,
    create_refresh_token,
    verify_refresh_token,
)
from src.config.settings import settings
from src.core.services.user_service import (
    create_user,
    get_all_users,
    get_user,
    get_user_by_phone,
    insert_refresh_token,
    is_revoked,
    revoke_refresh_token,
    toggle_user_status,
)
from src.schemas.user_schema import AdminCreateUser, CreateUser, UserLogin, UserResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register")
async def register_user(
    user_data: CreateUser, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Register route."""
    try:
        existing_user = await get_user(user_data.email, db)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        existing_phone = await get_user_by_phone(user_data.phone_no, db)
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already exists")

        await create_user(db=db, user_data=user_data)

        return {"message": "User registered successfully"}

    except HTTPException:
        raise

    except IntegrityError as e:
        logger.exception("Integrity error during registration")
        raise HTTPException(status_code=400, detail="Email or phone number already exists") from e

    except Exception as e:
        logger.exception("Unexpected error during registration")
        raise HTTPException(status_code=500, detail="Registration failed. Please try again.") from e


@router.post("/login")
async def login_user(
    request: Request,
    response: Response,
    user_data: UserLogin,
    db: AsyncSession = Depends(get_db),
) -> dict[str, str | int]:
    """Login route for users."""
    try:
        user = await get_user(user_data.email, db)

        if not user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(user_data.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        payload = {"id": user.id, "email": user.email, "role": user.role}

        access_token, _ = create_access_token(payload=payload)
        refresh_token, refresh_token_id = create_refresh_token(payload=payload)

        await insert_refresh_token(db, refresh_token_id)

        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            samesite="lax",
            secure=False,
            max_age=settings.JWT_REFRESH_SECRET_KEY_EXPIRATION_DAYS * 86400,
        )

        logger.info("User logged in", extra={"user_id": user.id})

        return {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "access_token": access_token,
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Login failed")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.") from e


@router.get("/auth/me")
async def me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, str | int]:
    """Return current authenticated user data."""
    return {
        "user_id": user["id"],
        "email": user["email"],
        "role": user.get("role", "finance_associate"),
    }


@router.post("/logout")
async def logout(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Logout route for user."""
    try:
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(status_code=401, detail="Already logged out or session expired.")

        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=403, detail="Invalid session. Please log in again.")

        jti = payload.get("jti")
        if not isinstance(jti, str):
            raise HTTPException(status_code=403, detail="Invalid token identifier.")

        await revoke_refresh_token(jti, db)
        response.delete_cookie("refresh_token")

        logger.info("User logged out")

        return {"message": "Logged out successfully"}

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Logout failed")
        raise HTTPException(status_code=500, detail="Logout failed. Please try again.") from e


@router.post("/refresh")
async def refresh_token(
    request: Request, response: Response, db: AsyncSession = Depends(get_db)
) -> dict[str, str]:
    """Issue a new access token using a valid refresh token cookie."""
    try:
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            raise HTTPException(status_code=403, detail="Session expired. Please log in again.")

        payload = verify_refresh_token(refresh_token)
        if payload is None:
            raise HTTPException(status_code=403, detail="Invalid session. Please log in again.")

        jti = payload.get("jti")
        if not isinstance(jti, str):
            raise HTTPException(status_code=403, detail="Invalid token identifier.")

        if await is_revoked(jti=jti, db=db):
            raise HTTPException(
                status_code=403, detail="Session has been revoked. Please log in again."
            )

        access_token, _ = create_access_token(
            payload={
                "id": payload.get("id"),
                "email": payload.get("email"),
                "role": payload.get("role", "finance_associate"),
            }
        )

        return {"access_token": access_token, "token_type": "bearer"}

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Token refresh failed")
        raise HTTPException(
            status_code=500, detail="Session refresh failed. Please log in again."
        ) from e


@router.get("/admin/users", response_model=list[UserResponse])
async def list_users(
    admin: dict[str, Any] = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> list[UserResponse]:
    """List all non-admin users."""
    try:
        return cast(list[UserResponse], await get_all_users(db))

    except Exception as e:
        logger.exception("Failed to fetch users")
        raise HTTPException(status_code=500, detail="Failed to fetch users.") from e


@router.post("/admin/users", response_model=UserResponse)
async def admin_create_user(
    user_data: AdminCreateUser,
    admin: dict[str, Any] = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Admin endpoint to create a new user."""
    try:
        existing_user = await get_user(user_data.email, db)
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already exists")

        existing_phone = await get_user_by_phone(user_data.phone_no, db)
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already exists")

        await create_user(db=db, user_data=cast(CreateUser, user_data), role="finance_associate")

        created = await get_user(user_data.email, db)
        if not created:
            raise HTTPException(status_code=500, detail="Failed to retrieve created user.")
        return cast(UserResponse, created)

    except HTTPException:
        raise

    except IntegrityError as e:
        logger.exception("Integrity error during admin user creation")
        raise HTTPException(status_code=400, detail="Email or phone number already exists") from e

    except Exception as e:
        logger.exception("Failed to create user")
        raise HTTPException(
            status_code=500, detail="Failed to create user. Please try again."
        ) from e


@router.patch("/admin/users/{user_id}/toggle-status", response_model=UserResponse)
async def toggle_user_status_route(
    user_id: int,
    admin: dict[str, Any] = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Toggle user active/inactive status."""
    try:
        user = await toggle_user_status(user_id=user_id, db=db)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return cast(UserResponse, user)

    except HTTPException:
        raise

    except Exception as e:
        logger.exception("Failed to toggle user status", extra={"user_id": user_id})
        raise HTTPException(status_code=500, detail="Failed to update user status.") from e

