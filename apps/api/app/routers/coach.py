from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_active_coach, require_coach
from app.models.billing import PlatformSubscription
from app.models.enums import SubscriptionStatus, SubscriptionTier
from app.models.users import CoachProfile, User
from app.schemas.calendar import AvailabilityRules
from app.schemas.coach import CoachProfileOut, CoachProfileUpdate, OnboardingRequest
from app.utils.time import utcnow

router = APIRouter(prefix="/coach", tags=["coach"])


@router.post("/onboarding", response_model=CoachProfileOut, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(
    body: OnboardingRequest,
    user: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfile:
    existing = await db.get(CoachProfile, user.id)
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Onboarding already completed")

    slug_taken = await db.execute(
        select(CoachProfile).where(CoachProfile.portal_slug == body.portal_slug)
    )
    if slug_taken.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "That portal slug is already taken")

    profile = CoachProfile(
        user_id=user.id,
        portal_slug=body.portal_slug,
        business_name=body.business_name,
        niche=body.niche,
    )
    db.add(profile)
    user.timezone = body.timezone
    db.add(
        PlatformSubscription(
            coach_id=user.id,
            tier=SubscriptionTier.trial,
            status=SubscriptionStatus.trialing,
            trial_ends_at=utcnow() + timedelta(days=14),
        )
    )
    await db.commit()
    await db.refresh(profile)
    return profile


def _to_profile_out(profile: CoachProfile, user: User) -> CoachProfileOut:
    return CoachProfileOut(
        portal_slug=profile.portal_slug,
        business_name=profile.business_name,
        niche=profile.niche,
        brand_color=profile.brand_color,
        logo_url=profile.logo_url,
        name=user.name,
        email=user.email,
        timezone=user.timezone,
    )


@router.get("/me/profile", response_model=CoachProfileOut)
async def get_my_profile(
    user: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    return _to_profile_out(profile, user)


@router.patch("/me/profile", response_model=CoachProfileOut)
async def update_my_profile(
    body: CoachProfileUpdate,
    user: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    if body.name is not None:
        user.name = body.name
    if body.timezone is not None:
        user.timezone = body.timezone
    if body.business_name is not None:
        profile.business_name = body.business_name
    if body.niche is not None:
        profile.niche = body.niche
    await db.commit()
    await db.refresh(profile)
    await db.refresh(user)
    return _to_profile_out(profile, user)


@router.get("/availability", response_model=AvailabilityRules)
async def get_availability(
    user: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> AvailabilityRules:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    if not profile.availability_rules_json:
        return AvailabilityRules()
    return AvailabilityRules.model_validate(profile.availability_rules_json)


@router.patch("/availability", response_model=AvailabilityRules)
async def update_availability(
    body: AvailabilityRules,
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> AvailabilityRules:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    profile.availability_rules_json = body.model_dump()
    await db.commit()
    return body
