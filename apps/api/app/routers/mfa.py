import base64
import io
import secrets
import uuid

import pyotp
import qrcode
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status

from app.db import get_db
from app.deps import get_current_user
from app.models.users import User
from app.rate_limit import limiter
from app.routers.auth import _set_auth_cookies
from app.schemas.auth import UserOut
from app.schemas.mfa import (
    MfaDisableRequest,
    MfaEnableOut,
    MfaEnableRequest,
    MfaSetupOut,
    MfaVerifyRequest,
)
from app.security import decode_token, hash_password, verify_password
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/auth/mfa", tags=["mfa"])

BACKUP_CODE_COUNT = 10


def _qr_data_uri(otpauth_uri: str) -> str:
    img = qrcode.make(otpauth_uri)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode()
    return f"data:image/png;base64,{encoded}"


def _generate_backup_codes() -> list[str]:
    return [secrets.token_hex(4) for _ in range(BACKUP_CODE_COUNT)]


@router.post("/setup", response_model=MfaSetupOut)
@limiter.limit("10/minute")
async def setup_mfa(
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MfaSetupOut:
    if user.mfa_enabled:
        raise HTTPException(status.HTTP_409_CONFLICT, "Two-factor authentication is already enabled")

    secret = pyotp.random_base32()
    user.mfa_secret = secret
    await db.commit()

    otpauth_uri = pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name="CoachevaOS")
    return MfaSetupOut(secret=secret, otpauth_uri=otpauth_uri, qr_data_uri=_qr_data_uri(otpauth_uri))


@router.post("/enable", response_model=MfaEnableOut)
@limiter.limit("10/minute")
async def enable_mfa(
    request: Request,
    body: MfaEnableRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> MfaEnableOut:
    if not user.mfa_secret:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Start setup first")
    if not pyotp.totp.TOTP(user.mfa_secret).verify(body.code, valid_window=1):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")

    backup_codes = _generate_backup_codes()
    user.mfa_enabled = True
    user.mfa_backup_codes = [hash_password(c) for c in backup_codes]
    await db.commit()
    return MfaEnableOut(backup_codes=backup_codes)


@router.post("/disable", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
async def disable_mfa(
    request: Request,
    body: MfaDisableRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    if not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Two-factor authentication is not enabled")
    if user.password_hash is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect password")
    if not pyotp.totp.TOTP(user.mfa_secret).verify(body.code, valid_window=1):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")

    user.mfa_enabled = False
    user.mfa_secret = None
    user.mfa_backup_codes = None
    await db.commit()


@router.post("/verify", response_model=UserOut)
@limiter.limit("10/minute")
async def verify_mfa(
    request: Request,
    body: MfaVerifyRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> User:
    try:
        payload = decode_token(body.challenge_token)
    except ValueError as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired code") from exc
    if payload.get("type") != "mfa_challenge":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid challenge token")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if user is None or not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid challenge token")

    raw_coach_id = payload.get("coach_id")
    coach_id = uuid.UUID(raw_coach_id) if raw_coach_id else None

    if pyotp.totp.TOTP(user.mfa_secret).verify(body.code, valid_window=1):
        _set_auth_cookies(response, user, coach_id=coach_id)
        return user

    backup_codes = user.mfa_backup_codes or []
    for i, hashed in enumerate(backup_codes):
        if verify_password(body.code, hashed):
            remaining = backup_codes[:i] + backup_codes[i + 1 :]
            user.mfa_backup_codes = remaining
            await db.commit()
            _set_auth_cookies(response, user, coach_id=coach_id)
            return user

    raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid code")
