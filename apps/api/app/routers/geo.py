import uuid

from fastapi import APIRouter, Cookie, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.enums import PaymentProvider
from app.models.users import User
from app.payments.geo import client_ip, lookup_country
from app.payments.region import resolve_region
from app.schemas.geo import RegionOut
from app.security import decode_token

router = APIRouter(prefix="/geo", tags=["geo"])


@router.get("/region", response_model=RegionOut)
async def get_region(
    request: Request,
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> RegionOut:
    """Public (no-auth-required) region suggestion for the pre-signup pricing
    page, upgraded to a fully reconciled multi-signal result when a valid
    coach session cookie is present — the billing/onboarding pages hit this
    same endpoint post-auth and get the declared-country-aware answer for
    free rather than needing a second endpoint."""
    country: str | None = None
    source = "none"
    mismatch = False

    if access_token:
        try:
            payload = decode_token(access_token)
            if payload.get("type") == "access":
                user = await db.get(User, uuid.UUID(payload["sub"]))
                if user is not None:
                    resolution = await resolve_region(db, user.id, request)
                    country, source, mismatch = resolution.country_code, resolution.source, resolution.mismatch
        except Exception:
            pass

    if country is None:
        ip = client_ip(request.headers.get("x-forwarded-for"), request.client.host if request.client else None)
        country = await lookup_country(ip)
        source = "ip" if country else "none"

    is_india = country == "IN"
    return RegionOut(
        country_code=country,
        suggested_provider=PaymentProvider.paddle,
        suggested_currency="inr" if is_india else "usd",
        region="india" if is_india else "global",
        source=source,
        mismatch=mismatch,
    )
