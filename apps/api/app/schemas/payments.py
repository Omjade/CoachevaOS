from typing import Literal

from pydantic import BaseModel

from app.models.enums import BillingCycle, SubscriptionTier


class CheckoutTokenRequest(BaseModel):
    tier: SubscriptionTier
    cycle: BillingCycle
    # The region the coach is checking out under (drives which pricing table
    # they saw and the countryCode hint passed to Paddle's checkout) — never
    # trusted blindly server-side, see POST /billing/paddle/checkout-token.
    region: Literal["global", "india"] = "global"
    confirm_region_mismatch: bool = False


class CheckoutTokenOut(BaseModel):
    price_id: str
    client_side_token: str
    environment: str
    customer_email: str
    custom_data: dict[str, str]
    resolved_country_code: str | None = None
    region_mismatch: bool = False
    # Set only once this coach has a real Paddle customer id (i.e. they've
    # completed at least one prior checkout) — feeds Paddle.Initialize()'s
    # pwCustomer for Paddle Retain. Omitted (None) for a brand-new customer;
    # Paddle Retain has nothing to recover for someone who's never checked
    # out, so there's no id to pass yet.
    processor_customer_id: str | None = None


class ChangePlanRequest(BaseModel):
    tier: SubscriptionTier
    cycle: BillingCycle


class CancelSubscriptionRequest(BaseModel):
    pass


class PortalSessionOut(BaseModel):
    url: str
