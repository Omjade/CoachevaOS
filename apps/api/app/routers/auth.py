import mimetypes
import secrets
import urllib.parse
import uuid

import httpx
from fastapi import APIRouter, Cookie, Depends, HTTPException, Request, Response, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db
from app.deps import get_current_user
from app.models.clients import Client
from app.models.enums import UserRole
from app.models.goals import ClientGoal
from app.models.leads import Lead
from app.models.progress import ProgressEntry
from app.models.users import CoachProfile, User
from app.utils.time import utcnow
from app.rate_limit import limiter
from app.schemas.auth import LoginRequest, RegisterRequest, UserOut
from app.schemas.mfa import MfaRequiredOut
from app.security import (
    create_access_token,
    create_mfa_challenge_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.storage import read_file, save_upload

router = APIRouter(prefix="/auth", tags=["auth"])

ACCESS_COOKIE = "access_token"
REFRESH_COOKIE = "refresh_token"


def _set_auth_cookies(response: Response, user: User) -> None:
    access = create_access_token(user.id, user.role.value)
    refresh = create_refresh_token(user.id, user.role.value)
    cookie_kwargs = dict(httponly=True, samesite="lax", secure=settings.cookie_secure, path="/")
    response.set_cookie(
        ACCESS_COOKIE, access, max_age=settings.access_token_expire_minutes * 60, **cookie_kwargs
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh,
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        **cookie_kwargs,
    )


async def _post_login_url(db: AsyncSession, user: User) -> str:
    """Where to land a coach or client right after auth — resolves their real
    slug-scoped dashboard instead of the flat (dead, pre-Phase-7) /dashboard."""
    if user.role == UserRole.coach:
        profile = await db.get(CoachProfile, user.id)
        if profile is None:
            return f"{settings.frontend_url}/onboarding"
        return f"{settings.frontend_url}/{profile.portal_slug}/dashboard"

    result = await db.execute(select(Client).where(Client.user_id == user.id))
    client = result.scalar_one_or_none()
    if client is None:
        return settings.frontend_url
    profile = await db.get(CoachProfile, client.coach_id)
    if profile is None:
        return settings.frontend_url
    return f"{settings.frontend_url}/{profile.portal_slug}/dashboard"


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def register(
    request: Request, body: RegisterRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> User:
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
        timezone=body.timezone,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    _set_auth_cookies(response, user)
    return user


@router.post("/login", response_model=UserOut | MfaRequiredOut)
@limiter.limit("10/minute")
async def login(
    request: Request, body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)
) -> User | MfaRequiredOut:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if user is None or user.password_hash is None or not verify_password(
        body.password, user.password_hash
    ):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    if user.mfa_enabled:
        return MfaRequiredOut(challenge_token=create_mfa_challenge_token(user.id))

    _set_auth_cookies(response, user)
    return user


@router.get("/google/login")
async def google_login() -> RedirectResponse:
    if not settings.google_client_id:
        raise HTTPException(status.HTTP_501_NOT_IMPLEMENTED, "Google login not configured")

    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> RedirectResponse:
    if error or not code:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google_auth_failed")

    async with httpx.AsyncClient() as http:
        token_res = await http.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            return RedirectResponse(f"{settings.frontend_url}/login?error=google_auth_failed")
        access_token = token_res.json()["access_token"]

        userinfo_res = await http.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_res.status_code != 200:
            return RedirectResponse(f"{settings.frontend_url}/login?error=google_auth_failed")
        info = userinfo_res.json()

    email = info.get("email")
    name = info.get("name") or email
    if not email:
        return RedirectResponse(f"{settings.frontend_url}/login?error=google_auth_failed")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(email=email, name=name, role=UserRole.coach, password_hash=None)
        db.add(user)
        await db.commit()
        await db.refresh(user)

    response = RedirectResponse(await _post_login_url(db, user))
    _set_auth_cookies(response, user)
    return response


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)) -> User:
    return user


@router.post("/refresh", response_model=UserOut)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    refresh_token: str | None = Cookie(default=None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not refresh_token:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = decode_token(refresh_token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token") from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid token type")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")

    _set_auth_cookies(response, user)
    return user


@router.post("/me/avatar", response_model=UserOut)
async def upload_my_avatar(
    file: UploadFile,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> User:
    key, file_type = await save_upload(file)
    if file_type != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please upload an image file")
    user.avatar_url = key
    await db.commit()
    await db.refresh(user)
    return user


@router.get("/users/{user_id}/avatar")
async def get_user_avatar(
    user_id: uuid.UUID,
    _viewer: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    target = await db.get(User, user_id)
    if target is None or not target.avatar_url:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No avatar set")

    content = await read_file(target.avatar_url)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No avatar set")

    content_type, _ = mimetypes.guess_type(target.avatar_url)
    return Response(
        content=content,
        media_type=content_type or "image/jpeg",
        headers={"Content-Disposition": "inline"},
    )


@router.get("/me/export")
async def export_my_data(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    profile = {
        "id": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role.value,
        "timezone": user.timezone,
        "created_at": user.created_at.isoformat(),
    }

    if user.role == UserRole.coach:
        coach_profile = await db.get(CoachProfile, user.id)
        clients_result = await db.execute(select(Client).where(Client.coach_id == user.id))
        leads_result = await db.execute(select(Lead).where(Lead.coach_id == user.id))
        return {
            "profile": profile,
            "coach_profile": {
                "business_name": coach_profile.business_name,
                "niche": coach_profile.niche,
                "portal_slug": coach_profile.portal_slug,
            }
            if coach_profile
            else None,
            "clients": [
                {
                    "id": str(c.id),
                    "goals": c.goals,
                    "program": c.program,
                    "status": c.status.value,
                    "notes": c.notes,
                    "joined_at": c.joined_at.isoformat(),
                }
                for c in clients_result.scalars().all()
            ],
            "leads": [
                {"id": str(lead.id), "name": lead.name, "email": lead.email, "stage": lead.stage.value}
                for lead in leads_result.scalars().all()
            ],
        }

    client_result = await db.execute(select(Client).where(Client.user_id == user.id))
    client = client_result.scalar_one_or_none()
    if client is None:
        return {"profile": profile}

    goals_result = await db.execute(select(ClientGoal).where(ClientGoal.client_id == client.id))
    progress_result = await db.execute(
        select(ProgressEntry).where(ProgressEntry.client_id == client.id)
    )
    return {
        "profile": profile,
        "client_record": {
            "goals": client.goals,
            "program": client.program,
            "status": client.status.value,
            "joined_at": client.joined_at.isoformat(),
        },
        "goal_list": [
            {"title": g.title, "target_date": g.target_date.isoformat() if g.target_date else None, "done": g.done}
            for g in goals_result.scalars().all()
        ],
        "progress_entries": [
            {"note": p.note, "entry_date": p.entry_date.isoformat(), "has_media": p.media_key is not None}
            for p in progress_result.scalars().all()
        ],
    }


@router.post("/me/delete", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(
    response: Response,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Anonymizes rather than hard-deletes: records the other party legitimately
    relies on (a coach's client history, a client's message thread) stay intact —
    nothing in the schema cascades deletes, and this avoids orphaning that data."""
    placeholder = f"deleted-{user.id}@deleted.local"
    user.name = "Deleted user"
    user.email = placeholder
    user.password_hash = None
    user.avatar_url = None
    user.mfa_enabled = False
    user.mfa_secret = None
    user.mfa_backup_codes = None
    user.deleted_at = utcnow()

    if user.role == UserRole.coach:
        profile = await db.get(CoachProfile, user.id)
        if profile is not None:
            profile.portal_slug = f"deleted-{secrets.token_hex(4)}"

    await db.commit()
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/")


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(ACCESS_COOKIE, path="/")
    response.delete_cookie(REFRESH_COOKIE, path="/")
