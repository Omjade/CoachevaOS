import re

from pydantic import BaseModel, field_validator

from app.models.enums import CalendarProvider, CoachingMode

SLUG_RE = re.compile(r"^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$")


class OnboardingRequest(BaseModel):
    portal_slug: str
    business_name: str | None = None
    niche: str
    timezone: str = "UTC"
    billing_country_code: str | None = None
    coaching_mode: CoachingMode = CoachingMode.online
    # The coach's own declared client-billing currency (invoices, dashboard
    # amounts, program pricing) — distinct from CoachevaOS's own platform
    # pricing, which is still resolved from billing_country_code/region.
    currency: str | None = None
    # Which paid plan the coach picked on the pricing page before signing up,
    # if any (e.g. "growth") — lets the trial reflect that plan's client
    # limit instead of a flat free-trial cap, so they can properly evaluate
    # the plan they intend to pay for. Purely informational: status stays
    # "trialing" and no payment is taken until they actually check out.
    intended_tier: str | None = None

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


class CustomLink(BaseModel):
    label: str
    url: str

    @field_validator("label")
    @classmethod
    def validate_label(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 60:
            raise ValueError("Label must be 1-60 characters")
        return v

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        v = (_validate_profile_url(v) or "").strip()
        if not v:
            raise ValueError("Must be a full URL starting with http:// or https://")
        return v


class Testimonial(BaseModel):
    quote: str
    author: str

    @field_validator("quote")
    @classmethod
    def validate_quote(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 400:
            raise ValueError("Quote must be 1-400 characters")
        return v

    @field_validator("author")
    @classmethod
    def validate_author(cls, v: str) -> str:
        v = v.strip()
        if not v or len(v) > 100:
            raise ValueError("Author must be 1-100 characters")
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
    coaching_mode: CoachingMode = CoachingMode.online
    default_video_provider: CalendarProvider | None = None
    bio: str | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    gallery_image_urls: list[str] | None = None
    tagline: str | None = None
    banner_url: str | None = None
    custom_links: list[CustomLink] | None = None
    testimonials: list[Testimonial] | None = None

    model_config = {"from_attributes": True}


class CoachProfileUpdate(BaseModel):
    name: str | None = None
    timezone: str | None = None
    business_name: str | None = None
    niche: str | None = None
    billing_country_code: str | None = None
    currency: str | None = None
    coaching_mode: CoachingMode | None = None
    bio: str | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    tagline: str | None = None
    custom_links: list[CustomLink] | None = None
    testimonials: list[Testimonial] | None = None

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

    @field_validator("tagline")
    @classmethod
    def validate_tagline(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        if len(v) > 150:
            raise ValueError("Tagline must be 150 characters or fewer")
        return v or None

    @field_validator("custom_links")
    @classmethod
    def validate_custom_links(cls, v: list[CustomLink] | None) -> list[CustomLink] | None:
        if v is not None and len(v) > 6:
            raise ValueError("Up to 6 links")
        return v

    @field_validator("testimonials")
    @classmethod
    def validate_testimonials(cls, v: list[Testimonial] | None) -> list[Testimonial] | None:
        if v is not None and len(v) > 6:
            raise ValueError("Up to 6 testimonials")
        return v


class DefaultVideoProviderUpdate(BaseModel):
    provider: CalendarProvider


class PortalPublicOut(BaseModel):
    business_name: str | None
    niche: str | None
    brand_color: str | None
    logo_url: str | None
    coach_name: str
    # The coach's own personal photo (User.avatar_url) — this is what the
    # public profile's headshot renders, deliberately separate from
    # logo_url (a business/brand mark that also replaces the CoachevaOS
    # mark in the coach's own sidebar). Uploading one must never change
    # the other.
    coach_user_id: str
    bio: str | None = None
    website_url: str | None = None
    instagram_url: str | None = None
    linkedin_url: str | None = None
    gallery_image_urls: list[str] | None = None
    featured_form_slug: str | None = None
    tagline: str | None = None
    banner_url: str | None = None
    custom_links: list[CustomLink] | None = None
    testimonials: list[Testimonial] | None = None
