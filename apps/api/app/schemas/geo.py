from typing import Literal

from pydantic import BaseModel

from app.models.enums import PaymentProvider


class RegionOut(BaseModel):
    country_code: str | None
    suggested_provider: PaymentProvider
    suggested_currency: str
    # Reconciled region label — "declared" (authenticated coach's own confirmed
    # billing country, once set) or "ip" (best-effort geolocation, used pre-auth
    # or before any country has been declared). The frontend should prefer this
    # over re-deriving a region from suggested_provider/suggested_currency.
    region: Literal["global", "india"]
    source: Literal["declared", "ip", "registration_ip", "none"]
    mismatch: bool = False
