import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())


def _create_token(user_id: uuid.UUID, role: str, expires_delta: timedelta, token_type: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "role": role,
        "type": token_type,
        "iat": now,
        "exp": now + expires_delta,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_access_token(user_id: uuid.UUID, role: str) -> str:
    return _create_token(
        user_id, role, timedelta(minutes=settings.access_token_expire_minutes), "access"
    )


def create_refresh_token(user_id: uuid.UUID, role: str) -> str:
    return _create_token(
        user_id, role, timedelta(days=settings.refresh_token_expire_days), "refresh"
    )


def create_invite_token(user_id: uuid.UUID) -> str:
    return _create_token(user_id, "client", timedelta(days=14), "invite")


def create_mfa_challenge_token(user_id: uuid.UUID) -> str:
    return _create_token(user_id, "", timedelta(minutes=5), "mfa_challenge")


def create_integration_state_token(coach_id: uuid.UUID, provider: str, extra: str = "") -> str:
    """Short-lived signed state param for OAuth connect flows — avoids needing a
    server-side session store; `extra` carries PKCE code_verifier when needed."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(coach_id),
        "provider": provider,
        "extra": extra,
        "type": "integration_state",
        "iat": now,
        "exp": now + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise ValueError("invalid token") from exc
