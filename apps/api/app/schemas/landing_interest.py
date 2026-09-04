from pydantic import BaseModel, EmailStr


class LandingInterestCreate(BaseModel):
    name: str
    email: EmailStr
    niche: str | None = None
    note: str | None = None


class PortalContactRequest(BaseModel):
    name: str
    email: EmailStr
    message: str | None = None
