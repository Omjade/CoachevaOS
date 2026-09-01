import uuid

from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    timezone: str = "UTC"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CoachChoice(BaseModel):
    """One of a client's possibly-multiple coach relationships (see Phase 48 —
    shared login across coaches), offered as a login-time pick when ambiguous."""

    coach_id: uuid.UUID
    business_name: str
    portal_slug: str | None


class CoachChoiceRequiredOut(BaseModel):
    coach_choice_required: bool = True
    challenge_token: str
    choices: list[CoachChoice]


class SelectCoachRequest(BaseModel):
    challenge_token: str
    coach_id: uuid.UUID


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: UserRole
    avatar_url: str | None = None
    timezone: str
    mfa_enabled: bool = False

    model_config = {"from_attributes": True}
