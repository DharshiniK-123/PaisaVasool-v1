from __future__ import annotations

import re
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class CreateUser(BaseModel):
    first_name: str = Field(..., max_length=100, description="First name of the user")
    last_name: str = Field(..., max_length=100, description="Last name of the user")
    email: EmailStr
    phone_no: str = Field(..., description="Phone number must be 10 digits")

    @field_validator("phone_no")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Phone number must be valid format with 10 digits")
        return v

    password: str = Field(
        ...,
        min_length=6,
        description="Password above 6 letters including lowercase, uppercase, digits and symbols",
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    model_config = {"from_attributes": True}


class AdminCreateUser(BaseModel):
    first_name: str = Field(..., max_length=100)
    last_name: str = Field(..., max_length=100)
    email: EmailStr
    phone_no: str = Field(..., description="Phone number must be 10 digits")

    @field_validator("phone_no")
    @classmethod
    def validate_phone(cls, v: str) -> str:
        if not re.match(r"^[6-9]\d{9}$", v):
            raise ValueError("Phone number must be valid format with 10 digits")
        return v

    password: str = Field(..., min_length=6)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters long.")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter.")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter.")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must contain at least one number.")
        if not re.search(r"[!@#$%^&*()_+\-=\[\]{}|;:,.<>/?~]", v):
            raise ValueError("Password must contain at least one special character.")
        return v

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: str
    phone_no: str
    role: str
    is_active: str = "active"
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    email: EmailStr
    password: str
