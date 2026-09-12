from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_active_coach, require_coach
from app.models.ai import AIInsight
from app.models.billing import PlatformSubscription, RegionSignalLog
from app.models.calendar_connections import CalendarConnection
from app.models.checkins import Checkin
from app.models.clients import Client
from app.models.enums import (
    AIInsightType,
    ClientStatus,
    PaymentProvider,
    SubscriptionStatus,
    SubscriptionTier,
)
from app.models.messaging import Thread
from app.models.tasks import Task
from app.models.users import CoachProfile, User
from app.payments.geo import client_ip, lookup_country
from app.rate_limit import limiter
from app.routers.billing import TIER_CLIENT_LIMITS
from app.schemas.attention import AttentionItem, NeedsAttentionOut
from app.schemas.calendar import AvailabilityRules
from app.schemas.coach import (
    CoachProfileOut,
    CoachProfileUpdate,
    DefaultVideoProviderUpdate,
    OnboardingRequest,
)
from app.storage import save_upload
from app.utils.time import utcnow

router = APIRouter(prefix="/coach", tags=["coach"])

GALLERY_MAX_IMAGES = 6


@router.post("/onboarding", response_model=CoachProfileOut, status_code=status.HTTP_201_CREATED)
async def complete_onboarding(
    body: OnboardingRequest,
    request: Request,
    user: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    existing = await db.get(CoachProfile, user.id)
    if existing is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Onboarding already completed")

    slug_taken = await db.execute(
        select(CoachProfile).where(CoachProfile.portal_slug == body.portal_slug)
    )
    if slug_taken.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "That portal slug is already taken")

    # The coach confirms/edits a pre-filled country at this step (frontend seeds it
    # from GET /geo/region) rather than the old silent registration-IP-only
    # assignment. A fresh IP lookup is still taken here for the audit trail and as
    # a fallback when the coach left the field untouched/empty.
    ip = client_ip(request.headers.get("x-forwarded-for"), request.client.host if request.client else None)
    ip_country = await lookup_country(ip)
    resolved_country = body.billing_country_code or ip_country or user.country_code

    is_india = resolved_country == "IN"
    profile = CoachProfile(
        user_id=user.id,
        portal_slug=body.portal_slug,
        business_name=body.business_name,
        niche=body.niche,
        billing_country_code=resolved_country,
        # The coach's own explicit choice from onboarding, if given — falls
        # back to the region-inferred default rather than silently defaulting
        # everyone who skips it to USD.
        currency=(body.currency or ("inr" if is_india else "usd")).lower(),
        coaching_mode=body.coaching_mode,
    )
    db.add(profile)
    user.timezone = body.timezone

    db.add(
        RegionSignalLog(
            coach_id=user.id,
            context="onboarding",
            declared_country_code=body.billing_country_code,
            ip_country_code=ip_country,
            mismatch=bool(body.billing_country_code and ip_country and body.billing_country_code != ip_country),
        )
    )

    # A plan picked on the pricing page before signup gets that plan's real
    # client limit during the trial (still status=trialing, no charge yet),
    # instead of a flat free-trial cap — so evaluating "can I actually run my
    # practice on this plan" doesn't require paying first. Falls back to the
    # old flat trial cap when no intended plan was carried through.
    intended_tier: SubscriptionTier | None = None
    if body.intended_tier:
        try:
            intended_tier = SubscriptionTier(body.intended_tier)
        except ValueError:
            intended_tier = None
    trial_client_limit = TIER_CLIENT_LIMITS.get(intended_tier, 10) if intended_tier else 10

    db.add(
        PlatformSubscription(
            coach_id=user.id,
            tier=intended_tier or SubscriptionTier.trial,
            status=SubscriptionStatus.trialing,
            trial_ends_at=utcnow() + timedelta(days=14),
            client_limit=trial_client_limit,
            provider=PaymentProvider.paddle,
            currency="inr" if is_india else "usd",
        )
    )
    await db.commit()
    await db.refresh(profile)
    await db.refresh(user)
    return _to_profile_out(profile, user)


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
        billing_country_code=profile.billing_country_code,
        currency=profile.currency,
        coaching_mode=profile.coaching_mode,
        default_video_provider=profile.default_video_provider,
        bio=profile.bio,
        website_url=profile.website_url,
        instagram_url=profile.instagram_url,
        linkedin_url=profile.linkedin_url,
        gallery_image_urls=profile.gallery_image_urls,
        tagline=profile.tagline,
        banner_url=profile.banner_url,
        custom_links=profile.custom_links,
        testimonials=profile.testimonials,
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
@limiter.limit("10/minute")
async def update_my_profile(
    request: Request,
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
    if body.bio is not None:
        profile.bio = body.bio
    if body.website_url is not None:
        profile.website_url = body.website_url
    if body.instagram_url is not None:
        profile.instagram_url = body.instagram_url
    if body.linkedin_url is not None:
        profile.linkedin_url = body.linkedin_url
    if body.tagline is not None:
        profile.tagline = body.tagline
    if body.custom_links is not None:
        profile.custom_links = [link.model_dump() for link in body.custom_links]
    if body.testimonials is not None:
        profile.testimonials = [t.model_dump() for t in body.testimonials]
    if body.billing_country_code is not None and body.billing_country_code != profile.billing_country_code:
        ip = client_ip(request.headers.get("x-forwarded-for"), request.client.host if request.client else None)
        ip_country = await lookup_country(ip)
        db.add(
            RegionSignalLog(
                coach_id=user.id,
                context="profile_update",
                declared_country_code=body.billing_country_code,
                ip_country_code=ip_country,
                mismatch=bool(ip_country and body.billing_country_code != ip_country),
            )
        )
        profile.billing_country_code = body.billing_country_code
    if body.currency is not None:
        profile.currency = body.currency
    if body.coaching_mode is not None:
        profile.coaching_mode = body.coaching_mode
    await db.commit()
    await db.refresh(profile)
    await db.refresh(user)
    return _to_profile_out(profile, user)


@router.post("/integrations/default", response_model=CoachProfileOut)
async def set_default_video_provider(
    body: DefaultVideoProviderUpdate,
    user: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    """Preselects the Schedule Builder's video-provider dropdown. Can only be
    set to a provider the coach has actually connected — this is a UI
    preference, not a connection step."""
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    connection = await db.execute(
        select(CalendarConnection).where(
            CalendarConnection.coach_id == user.id, CalendarConnection.provider == body.provider
        )
    )
    if connection.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Connect that provider first")
    profile.default_video_provider = body.provider
    await db.commit()
    await db.refresh(profile)
    return _to_profile_out(profile, user)


@router.post("/me/gallery", response_model=CoachProfileOut)
async def upload_gallery_image(
    file: UploadFile,
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    existing = profile.gallery_image_urls or []
    if len(existing) >= GALLERY_MAX_IMAGES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"You can add up to {GALLERY_MAX_IMAGES} images")
    key, file_type = await save_upload(file)
    if file_type != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please upload an image file")
    profile.gallery_image_urls = existing + [key]
    await db.commit()
    await db.refresh(profile)
    return _to_profile_out(profile, user)


@router.delete("/me/gallery/{index}", response_model=CoachProfileOut)
async def remove_gallery_image(
    index: int,
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    existing = profile.gallery_image_urls or []
    if index < 0 or index >= len(existing):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    profile.gallery_image_urls = existing[:index] + existing[index + 1 :]
    await db.commit()
    await db.refresh(profile)
    return _to_profile_out(profile, user)


@router.post("/me/logo", response_model=CoachProfileOut)
async def upload_logo(
    file: UploadFile,
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    key, file_type = await save_upload(file)
    if file_type != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please upload an image file")
    profile.logo_url = key
    await db.commit()
    await db.refresh(profile)
    return _to_profile_out(profile, user)


@router.delete("/me/logo", response_model=CoachProfileOut)
async def remove_logo(
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    profile.logo_url = None
    await db.commit()
    await db.refresh(profile)
    return _to_profile_out(profile, user)


@router.post("/me/banner", response_model=CoachProfileOut)
async def upload_banner(
    file: UploadFile,
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    """Mirrors upload_logo's exact pattern — the public profile's wide
    header image, distinct from both logo_url (brand mark) and the coach's
    own avatar (personal photo)."""
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    key, file_type = await save_upload(file)
    if file_type != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please upload an image file")
    profile.banner_url = key
    await db.commit()
    await db.refresh(profile)
    return _to_profile_out(profile, user)


@router.delete("/me/banner", response_model=CoachProfileOut)
async def remove_banner(
    user: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CoachProfileOut:
    profile = await db.get(CoachProfile, user.id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Onboarding not completed yet")
    profile.banner_url = None
    await db.commit()
    await db.refresh(profile)
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


# Turns the deterministic bucket signal into a concrete next step — no LLM
# call, same "score in Python, AI only for narrative" posture already used by
# compute_churn_score. This is what makes the Needs Attention panel double as
# a real Recommendations feature instead of just a flagged-item list.
SUGGESTED_ACTION_BY_CATEGORY: dict[str, str] = {
    "churn": "Review their recent check-ins and consider a call",
    "silence": "Send them a check-in message",
    "overdue": "Nudge them about the overdue task",
    "checkin": "Ask them for a quick check-in",
}


@router.get("/needs-attention", response_model=NeedsAttentionOut)
async def get_needs_attention(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> NeedsAttentionOut:
    """Deterministic, no-AI-call daily worklist — buckets each client by already-
    computed signals (churn score, thread silence, overdue tasks, stale check-ins)
    into urgent/behind/minor, same 'score in Python, AI only for narrative
    elsewhere' pattern already used by compute_churn_score. This is the flagship
    'who needs me today' surface, not another data table."""
    clients_result = await db.execute(
        select(Client, User)
        .join(User, User.id == Client.user_id)
        .where(Client.coach_id == coach.id, Client.status != ClientStatus.deleted)
    )
    rows = clients_result.all()
    now = utcnow()
    today = now.date()
    items: list[AttentionItem] = []

    if not rows:
        return NeedsAttentionOut(items=items, generated_at=now)

    client_ids = [client.id for client, _ in rows]

    # Four batched queries (independent of client count) replacing what was
    # previously up to 4 awaited queries PER client inside the loop below —
    # a real N+1 that showed up directly in dashboard load time for any coach
    # with more than a handful of clients.
    churn_result = await db.execute(
        select(AIInsight)
        .distinct(AIInsight.client_id)
        .where(AIInsight.client_id.in_(client_ids), AIInsight.type == AIInsightType.churn_score)
        .order_by(AIInsight.client_id, AIInsight.created_at.desc())
    )
    latest_churn_by_client = {insight.client_id: insight for insight in churn_result.scalars().all()}

    threads_result = await db.execute(select(Thread).where(Thread.client_id.in_(client_ids)))
    thread_by_client = {thread.client_id: thread for thread in threads_result.scalars().all()}

    overdue_result = await db.execute(
        select(Task.client_id, func.count())
        .where(Task.client_id.in_(client_ids), Task.done.is_(False), Task.due_date < today)
        .group_by(Task.client_id)
    )
    overdue_count_by_client = dict(overdue_result.all())

    checkin_result = await db.execute(
        select(Checkin.client_id, func.max(Checkin.submitted_at))
        .where(Checkin.client_id.in_(client_ids))
        .group_by(Checkin.client_id)
    )
    last_checkin_by_client = dict(checkin_result.all())

    for client, user in rows:
        # (severity, category, reason) — category drives the suggested_action
        # below so it stays a direct lookup, not a re-parse of the reason text.
        reasons: list[tuple[int, str, str]] = []

        churn = latest_churn_by_client.get(client.id)
        if churn:
            score = churn.payload_json.get("score", 0)
            if score >= 70:
                reasons.append((90, "churn", f"Churn risk {score}/100"))
            elif score >= 50:
                reasons.append((60, "churn", f"Churn risk {score}/100"))
            elif score >= 30:
                reasons.append((30, "churn", f"Churn risk {score}/100"))

        thread = thread_by_client.get(client.id)
        thread_id = thread.id if thread else None
        if thread and thread.last_message_at:
            days_quiet = (now - thread.last_message_at).days
            if days_quiet >= 7:
                reasons.append((85, "silence", f"No reply in {days_quiet} days"))
            elif days_quiet >= 4:
                reasons.append((55, "silence", f"No reply in {days_quiet} days"))

        overdue_count = overdue_count_by_client.get(client.id, 0)
        if overdue_count >= 3:
            reasons.append((80, "overdue", f"{overdue_count} overdue tasks"))
        elif overdue_count >= 1:
            reasons.append(
                (45, "overdue", f"{overdue_count} overdue task" + ("s" if overdue_count > 1 else ""))
            )

        last_checkin_at = last_checkin_by_client.get(client.id)
        if (now - client.joined_at).days >= 14:
            if last_checkin_at is None:
                reasons.append((50, "checkin", "No check-in yet"))
            else:
                days_since_checkin = (now - last_checkin_at).days
                if days_since_checkin >= 14:
                    reasons.append((70, "checkin", f"No check-in in {days_since_checkin} days"))
                elif days_since_checkin >= 7:
                    reasons.append((35, "checkin", f"No check-in in {days_since_checkin} days"))

        if not reasons:
            continue

        top_severity, top_category, top_reason = max(reasons, key=lambda r: r[0])
        if top_severity >= 75:
            bucket = "urgent"
        elif top_severity >= 50:
            bucket = "behind"
        else:
            bucket = "minor"

        items.append(
            AttentionItem(
                client_id=client.id,
                client_name=user.name,
                bucket=bucket,
                reason=top_reason,
                thread_id=thread_id,
                suggested_action=SUGGESTED_ACTION_BY_CATEGORY[top_category],
            )
        )

    order = {"urgent": 0, "behind": 1, "minor": 2}
    items.sort(key=lambda i: order[i.bucket])
    return NeedsAttentionOut(items=items, generated_at=now)
