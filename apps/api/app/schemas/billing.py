import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.enums import BillingCycle, PaymentProvider, SubscriptionStatus, SubscriptionTier


class InvoiceCreate(BaseModel):
    amount: float
    due_date: date
    currency: str | None = None


class InvoiceOut(BaseModel):
    id: uuid.UUID
    amount: float
    currency: str = "USD"
    due_date: date
    paid: bool
    paid_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SubscriptionUpdate(BaseModel):
    subscription_valid_until: date | None
    subscription_valid_from: date | None = None


class ClientBillingOut(BaseModel):
    subscription_valid_from: date | None
    subscription_valid_until: date | None
    status: str
    billing_currency: str | None = None
    invoices: list[InvoiceOut]


class PlatformSubscriptionOut(BaseModel):
    tier: SubscriptionTier
    status: SubscriptionStatus
    trial_ends_at: datetime
    current_period_end: datetime | None
    client_limit: int | None
    active_client_count: int
    provider: PaymentProvider | None = None
    currency: str | None = None
    billing_cycle: BillingCycle | None = None
    cancel_at_period_end: bool = False
    grace_period_ends_at: datetime | None = None
