import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class IntakeCreate(BaseModel):
    goals: str | None = None
    experience: str | None = None
    availability: str | None = None
    notes: str | None = None
    # Collected once here, at the client's own onboarding — previously never
    # captured for clients at all (only coaches set these, at registration/
    # their own onboarding). Written onto the client's User row alongside the
    # intake response, not stored on IntakeResponse itself.
    country_code: str | None = None
    timezone: str | None = None

    @field_validator("country_code")
    @classmethod
    def validate_country_code(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if len(v) != 2:
            raise ValueError("Country code must be a 2-letter ISO code")
        return v


class IntakeOut(BaseModel):
    id: uuid.UUID
    goals: str | None
    experience: str | None
    availability: str | None
    notes: str | None
    submitted_at: datetime

    model_config = {"from_attributes": True}
