import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.clients import Client
from app.models.users import CoachProfile, User
from app.rate_limit import limiter
from app.routers.auth import _set_auth_cookies
from app.schemas.invite import InviteAcceptRequest, InvitePreviewOut
from app.security import decode_token, hash_password

router = APIRouter(prefix="/invite", tags=["invite"])


async def _resolve_invite_user(db: AsyncSession, token: str) -> User:
    try:
        payload = decode_token(token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid or expired invite link") from exc
    if payload.get("type") != "invite":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid invite link")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Invite no longer valid")
    return user


async def _coach_slug_for_client_user(db: AsyncSession, user: User) -> tuple[str | None, str]:
    result = await db.execute(select(Client).where(Client.user_id == user.id))
    client = result.scalar_one_or_none()
    if client is None:
        return None, ""
    coach = await db.get(User, client.coach_id)
    profile = await db.get(CoachProfile, client.coach_id)
    return (profile.portal_slug if profile else None), (coach.name if coach else "")


@router.get("/{token}", response_model=InvitePreviewOut)
@limiter.limit("20/minute")
async def preview_invite(
    request: Request, token: str, db: AsyncSession = Depends(get_db)
) -> InvitePreviewOut:
    user = await _resolve_invite_user(db, token)
    if user.password_hash is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This invite has already been used")

    slug, coach_name = await _coach_slug_for_client_user(db, user)
    return InvitePreviewOut(name=user.name, email=user.email, coach_name=coach_name, portal_slug=slug)


@router.post("/{token}/accept", response_model=None, status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def accept_invite(
    request: Request,
    token: str,
    body: InviteAcceptRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> dict:
    user = await _resolve_invite_user(db, token)
    if user.password_hash is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This invite has already been used")

    user.password_hash = hash_password(body.password)
    await db.commit()

    _set_auth_cookies(response, user)
    slug, _ = await _coach_slug_for_client_user(db, user)
    return {"id": str(user.id), "email": user.email, "name": user.name, "portal_slug": slug}
