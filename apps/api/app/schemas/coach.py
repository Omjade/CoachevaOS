import re

from pydantic import BaseModel, field_validator

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$")


class OnboardingRequest(BaseModel):
    portal_slug: str
    business_name: str | None = None
    niche: str
    timezone: str = "UTC"
    billing_country_code: str | None = None

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

    @field_validator("billing_country_code")
    @classmethod
    def validate_billing_country(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if len(v) != 2:
            raise ValueError("Country code must be a 2-letter ISO code")
        return v


def _validate_profile_url(v: str | None) -> str | None:
    if v is None or v == "":
        return None
    v = v.strip()
    if not (v.startswith("http://") or v.startswith("https://")):
        raise ValueError("Must be a full URL starting with http:// or https://")
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
    billing_country_code: str | None = None
    currency: str = "usd"
    bio: str | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    gallery_image_urls: list[str] | None = None

    model_config = {"from_attributes": True}


class CoachProfileUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
    business_name: str | None = None
    niche: str | None = None
    billing_country_code: str | None = None
    currency: str | None = None
    bio: str | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None

    @field_validator("billing_country_code")
    @classmethod
    def validate_billing_country(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().upper()
        if len(v) != 2:
            raise ValueError("Country code must be a 2-letter ISO code")
        return v

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip().lower()
        if len(v) != 3 or not v.isalpha():
            raise ValueError("Currency must be a 3-letter ISO code, e.g. usd, inr, eur")
        return v

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 500:
            raise ValueError("Bio must be 500 characters or fewer")
        return v or None

    @field_validator("website_url", "instagram_url", "linkedin_url")
    @classmethod
    def validate_profile_urls(cls, v: str | None) -> str | None:
        return _validate_profile_url(v)


class PortalPublicOut(BaseModel):
    business_name: str | None
    niche: str | None
    brand_color: str | None
    logo_url: str | None
    coach_name: str
    bio: str | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    gallery_image_urls: list[str] | None = None
    featured_form_slug: str | None = None
