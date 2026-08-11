import uuid

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    timezone: str = "UTC"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    avatar_url: str | None = None
    timezone: str

    model_config = {"from_attributes": True}
