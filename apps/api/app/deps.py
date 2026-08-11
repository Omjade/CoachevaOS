import uuid

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.billing import PlatformSubscription
from app.models.clients import Client
from app.models.enums import SubscriptionStatus, UserRole
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
    return coach


async def get_current_client(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Client:
    """A client's session is scoped to their own client record — every client-side
    query should go through this record's coach_id, never the raw user_id, so a
    client can never read another coach's data."""
    if user.role != UserRole.client:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Client access required")
    result = await db.execute(select(Client).where(Client.user_id == user.id))
    client = result.scalar_one_or_none()
    if client is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Client profile not found")
    return client
