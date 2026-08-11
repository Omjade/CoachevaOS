import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import SubscriptionStatus, SubscriptionTier


class InvoiceCreate(BaseModel):
    amount: float
    due_date: date


class InvoiceOut(BaseModel):
    id: uuid.UUID
    amount: float
    due_date: date
    paid: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionUpdate(BaseModel):
    subscription_valid_until: date | None


class ClientBillingOut(BaseModel):
    subscription_valid_until: date | None
    status: str
    invoices: list[InvoiceOut]


class PlatformSubscriptionOut(BaseModel):
    tier: SubscriptionTier
    status: SubscriptionStatus
    trial_ends_at: datetime
    current_period_end: datetime | None
    client_limit: int | None
    active_client_count: int


class SelectPlanRequest(BaseModel):
    tier: SubscriptionTier
