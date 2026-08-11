import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import ClientStatus


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    program: str | None = None
    goals: str | None = None


class ClientOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    email: str
    program: str | None
    status: ClientStatus
    joined_at: datetime
    invite_pending: bool

    model_config = {"from_attributes": True}


class ClientDetailOut(ClientOut):
    goals: str | None
    subscription_valid_until: date | None
    tags: list[str] | None
    notes: str | None
    thread_id: uuid.UUID | None = None
    timezone: str = "UTC"


class InviteInfoOut(BaseModel):
    invite_token: str
    invite_path: str


class ClientNotesUpdate(BaseModel):
    notes: str | None


class ClientUpdate(BaseModel):
    name: str | None = None
    goals: str | None = None
    program: str | None = None
    tags: list[str] | None = None
    status: ClientStatus | None = None


class ClientSelfProfileOut(BaseModel):
    name: str
    email: str
    timezone: str
    goals: str | None
    program: str | None
    coach_name: str
    portal_slug: str | None


class ClientSelfProfileUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
