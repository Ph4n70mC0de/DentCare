"""Auth request/response schemas."""

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class LoginResponse(BaseModel):
    user: dict


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    permissions: list[str] = []
