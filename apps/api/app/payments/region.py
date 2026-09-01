import uuid
from dataclasses import dataclass

from fastapi import Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.users import CoachProfile, User
from app.payments.geo import client_ip, lookup_country


@dataclass
class RegionResolution:
    country_code: str | None
    source: str  # "declared" | "ip" | "registration_ip" | "none"
    ip_country_code: str | None
    mismatch: bool


async def resolve_region(db: AsyncSession, coach_id: uuid.UUID, request: Request) -> RegionResolution:
    """Combines every country signal this app has for a coach into one
    resolution, in order of trust — never a single signal decided blindly.

    Declared (CoachProfile.billing_country_code, set at onboarding/profile)
    wins when present: it's the value closest to what the coach will actually
    enter at Paddle's own checkout, and unlike IP it can't drift between page
    loads. A fresh IP lookup is still taken on every call and compared against
    it — agreement or disagreement is reported via `mismatch`, but the
    declared value is never silently overridden by IP. With nothing declared
    yet, falls back to the fresh IP lookup, then to the registration-time
    User.country_code snapshot, then to None (defaults to Global/USD — the
    more expensive tier, so there's no incentive to fake a fallback)."""
    ip = client_ip(request.headers.get("x-forwarded-for"), request.client.host if request.client else None)
    ip_country = await lookup_country(ip)

    profile = await db.get(CoachProfile, coach_id)
    declared = profile.billing_country_code if profile else None

    if declared:
        mismatch = bool(ip_country) and ip_country != declared
        return RegionResolution(country_code=declared, source="declared", ip_country_code=ip_country, mismatch=mismatch)

    if ip_country:
        return RegionResolution(country_code=ip_country, source="ip", ip_country_code=ip_country, mismatch=False)

    user = await db.get(User, coach_id)
    if user and user.country_code:
        return RegionResolution(
            country_code=user.country_code, source="registration_ip", ip_country_code=None, mismatch=False
        )

    return RegionResolution(country_code=None, source="none", ip_country_code=None, mismatch=False)
