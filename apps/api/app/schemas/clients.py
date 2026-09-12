import uuid
from datetime import date, datetime

from pydantic import BaseModel, EmailStr

from app.models.enums import ClientStatus, ClientType


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
    phone: str | None = None
    program: str | None
    status: ClientStatus
    joined_at: datetime
    invite_pending: bool
    niche: str | None = None
    client_type: ClientType = ClientType.remote
    subscription_valid_until: date | None = None

    model_config = {"from_attributes": True}


class ClientDetailOut(ClientOut):
    goals: str | None
    tags: list[str] | None
    notes: str | None
    thread_id: uuid.UUID | None = None
    timezone: str = "UTC"
    billing_currency: str | None = None
    coaching_start_date: date | None = None
    coaching_end_date: date | None = None


class InviteInfoOut(BaseModel):
    invite_token: str
    invite_path: str


class ClientPortalLinkOut(BaseModel):
    portal_code: str
    portal_path: str


class ClientPortalPreviewOut(BaseModel):
    name: str
    email: str
    coach_name: str
    business_name: str | None


class ClientNotesUpdate(BaseModel):
    notes: str | None


class ClientUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    goals: str | None = None
    program: str | None = None
    niche: str | None = None
    tags: list[str] | None = None
    status: ClientStatus | None = None
    billing_currency: str | None = None


class CoachingDatesUpdate(BaseModel):
    # Always assigned (never skipped on None) so either date can be cleared
    # once set — same shape as billing.py's SubscriptionUpdate.
    coaching_start_date: date | None
    coaching_end_date: date | None


class ClientSelfProfileOut(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    timezone: str
    goals: str | None
    program: str | None
    coach_name: str
    portal_slug: str | None
    subscription_valid_from: date | None = None
    subscription_valid_until: date | None = None
    # Same computed status the coach's ClientBillingCard already shows
    # (not_set/active/renewal_due/overdue, via billing.py's _compute_status)
    # — reused rather than duplicated, so a lapsed subscription can never
    # show a falsely-reassuring "Active" on the client's own side while the
    # coach's side correctly shows "Overdue".
    billing_status: str = "not_set"
    coaching_start_date: date | None = None
    coaching_end_date: date | None = None
    # Coach-managed, client-visible-but-not-editable — the coach edits these
    # via PATCH /clients/{id}; the client should be able to SEE their own
    # niche/phone/status, not change them, so there's no matching field on
    # ClientSelfProfileUpdate below.
    niche: str | None = None
    phone: str | None = None
    status: ClientStatus = ClientStatus.active
    billing_currency: str | None = None


class ClientSelfProfileUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
