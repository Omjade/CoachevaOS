import re

from pydantic import BaseModel, field_validator

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$")


class OnboardingRequest(BaseModel):
    portal_slug: str
    business_name: str | None = None
    niche: str
    timezone: str = "UTC"

    @field_validator("portal_slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        v = v.strip().lower()
        if not SLUG_RE.match(v):
            raise ValueError(
                "Slug must be 3-64 lowercase letters, numbers or hyphens, "
                "and cannot start/end with a hyphen"
            )
        return v


class CoachProfileOut(BaseModel):
    portal_slug: str
    business_name: str | None
    niche: str | None
    brand_color: str | None
    logo_url: str | None
    name: str
    email: str
    timezone: str

    model_config = {"from_attributes": True}


class CoachProfileUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
    business_name: str | None = None
    niche: str | None = None


class PortalPublicOut(BaseModel):
    business_name: str | None
    niche: str | None
    brand_color: str | None
    logo_url: str | None
    coach_name: str
