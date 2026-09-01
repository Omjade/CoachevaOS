import uuid

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.billing import PlatformSubscription
from app.models.clients import Client
from app.models.enums import ClientStatus, SubscriptionStatus, UserRole
from app.models.users import User
from app.security import decode_token
from app.utils.time import utcnow


async def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not access_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(access_token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc
    if payload.get("type") != "access":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def require_coach(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.coach:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Coach access required")
    return user


async def get_platform_subscription(
    db: AsyncSession, coach_id: uuid.UUID
) -> PlatformSubscription | None:
    """PlatformSubscription's primary key is its own UUIDPk `id`, not coach_id
    (which is only unique-indexed) — always look it up by coach_id, never db.get()."""
    result = await db.execute(
        select(PlatformSubscription).where(PlatformSubscription.coach_id == coach_id)
    )
    return result.scalar_one_or_none()


async def require_active_coach(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> User:
    """Gates write actions once a coach's trial has expired with no plan selected
    (see docs/PRD.md platform billing section) — reads stay open, writes are blocked
    until a plan is chosen. No-op if onboarding hasn't run yet (no subscription row)."""
    sub = await get_platform_subscription(db, coach.id)
    if sub is None:
        return coach

    if sub.status == SubscriptionStatus.trialing and utcnow() > sub.trial_ends_at:
        sub.status = SubscriptionStatus.trial_expired
        await db.commit()

    if sub.status == SubscriptionStatus.trial_expired:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "Your trial has ended — choose a plan to keep adding or editing data.",
        )
    if sub.status == SubscriptionStatus.restricted:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "Your payment couldn't be processed — update your billing details to keep adding or editing data.",
        )
    return coach


async def check_client_cap(db: AsyncSession, coach_id: uuid.UUID) -> None:
    """Raises 402 if the coach is already at their plan's active-client limit.
    Call this BEFORE creating/reactivating a client, not after — this is the
    single choke point shared by direct add, bulk import, and reactivation via
    PATCH, so the check can't be bypassed by going through a different route."""
    sub = await get_platform_subscription(db, coach_id)
    if sub is None or sub.client_limit is None:
        return
    active_count = await db.scalar(
        select(func.count()).select_from(Client).where(
            Client.coach_id == coach_id, Client.status == ClientStatus.active
        )
    )
    if (active_count or 0) >= sub.client_limit:
        raise HTTPException(
            status.HTTP_402_PAYMENT_REQUIRED,
            "You've reached your plan's client limit — upgrade to add more.",
        )


async def get_current_client(
    access_token: str | None = Cookie(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Client:
    """A client's session is scoped to their own client record — every client-side
    query should go through this record's coach_id, never the raw user_id, so a
    client can never read another coach's data.

    A single User can now be a Client of more than one coach (see Phase 48 —
    shared login across coaches), so which Client row applies is decided by
    the access token's own `coach_id` claim (set at login time, see
    security.py/_create_token and auth.py's login/select-coach flow), not by
    assuming a single match. Re-decodes the same cookie get_current_user
    already validated — cheap, no extra I/O."""
    if user.role != UserRole.client:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Client access required")

    coach_id: uuid.UUID | None = None
    if access_token:
        try:
            payload = decode_token(access_token)
            raw = payload.get("coach_id")
            if raw:
                coach_id = uuid.UUID(raw)
        except ValueError:
            pass  # get_current_user already validated this exact cookie

    query = select(Client).where(Client.user_id == user.id)
    if coach_id is not None:
        query = query.where(Client.coach_id == coach_id)
    result = await db.execute(query)
    clients = result.scalars().all()
    if len(clients) == 0:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client profile not found")
    if len(clients) > 1:
        # No coach_id claim (a token issued before this feature existed) and
        # genuinely ambiguous — fail safely rather than guessing which coach's
        # data to expose.
        raise HTTPException(
            status.HTTP_409_CONFLICT, "Multiple coach relationships found — please log in again"
        )
    return clients[0]
