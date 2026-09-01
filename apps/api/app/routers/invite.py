import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import check_client_cap
from app.models.clients import Client
from app.models.users import CoachProfile, User
from app.rate_limit import limiter
from app.routers.auth import _set_auth_cookies
from app.schemas.invite import InviteAcceptRequest, InvitePreviewOut
from app.security import hash_password, verify_password
from app.utils.time import utcnow

router = APIRouter(prefix="/invite", tags=["invite"])


async def _resolve_invite_client(db: AsyncSession, code: str) -> tuple[Client, User]:
    result = await db.execute(select(Client).where(Client.invite_code == code))
    client = result.scalar_one_or_none()
    if client is None or client.invite_expires_at is None or client.invite_expires_at < utcnow():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired invite link")

    user = await db.get(User, client.user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite no longer valid")
    return client, user


async def _coach_slug_and_name(db: AsyncSession, coach_id: uuid.UUID) -> tuple[str | None, str]:
    coach = await db.get(User, coach_id)
    profile = await db.get(CoachProfile, coach_id)
    return (profile.portal_slug if profile else None), (coach.name if coach else "")


@router.get("/{token}", response_model=InvitePreviewOut)
@limiter.limit("20/minute")
async def preview_invite(
    request: Request, token: str, db: AsyncSession = Depends(get_db)
) -> InvitePreviewOut:
    client, user = await _resolve_invite_client(db, token)
    if client.invite_accepted_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This invite has already been used")

    slug, coach_name = await _coach_slug_and_name(db, client.coach_id)
    return InvitePreviewOut(
        name=user.name,
        email=user.email,
        coach_name=coach_name,
        portal_slug=slug,
        existing_account=user.password_hash is not None,
    )


@router.post("/{token}/accept", response_model=None, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def accept_invite(
    request: Request,
    token: str,
    body: InviteAcceptRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    client, user = await _resolve_invite_client(db, token)
    if client.invite_accepted_at is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This invite has already been used")

    # Defensive — a client's active "slot" is already claimed at creation time
    # today (see create_client_with_user), so this is a no-op in practice, but
    # guards against any future flow that reactivates a client via invite.
    await check_client_cap(db, client.coach_id)

    if user.password_hash is None:
        user.password_hash = hash_password(body.password)
    else:
        # An existing account (already active with another coach — shared
        # identity, see Phase 48) — confirm identity with their real password
        # rather than overwriting it with whatever this form submitted.
        if not verify_password(body.password, user.password_hash):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect password")

    client.invite_accepted_at = utcnow()
    await db.commit()

    _set_auth_cookies(response, user, coach_id=client.coach_id)
    slug, _ = await _coach_slug_and_name(db, client.coach_id)
    return {
        "id": str(user.id),
        "client_id": str(client.id),
        "email": user.email,
        "name": user.name,
        "portal_slug": slug,
    }
