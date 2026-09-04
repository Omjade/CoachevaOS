import mimetypes

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.clients import Client
from app.models.forms import Form, FormSubmission
from app.models.landing_interest import LandingInterest
from app.models.leads import Lead
from app.models.enums import LeadStage
from app.models.notifications import Notification
from app.notifications import broadcast_notification
from app.models.programs import Program
from app.models.users import CoachProfile, User
from app.rate_limit import limiter
from app.routers.programs import _to_template_out
from app.schemas.clients import ClientPortalPreviewOut
from app.schemas.coach import PortalPublicOut
from app.schemas.forms import FormFieldSchema, FormSubmitRequest, PublicFormOut
from app.schemas.landing_interest import LandingInterestCreate, PortalContactRequest
from app.schemas.programs import ProgramTemplateOut
from app.storage import get_presigned_url, read_file
from app.utils.time import utcnow

router = APIRouter(prefix="/portal", tags=["portal"])


async def _get_coach_by_slug(db: AsyncSession, slug: str) -> tuple[CoachProfile, User]:
    result = await db.execute(
        select(CoachProfile, User)
        .join(User, User.id == CoachProfile.user_id)
        .where(CoachProfile.portal_slug == slug)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No coach found for this portal")
    return row


@router.get("/{slug}", response_model=PortalPublicOut)
async def get_portal_by_slug(slug: str, db: AsyncSession = Depends(get_db)) -> PortalPublicOut:
    profile, user = await _get_coach_by_slug(db, slug)
    featured_form_slug = await db.scalar(
        select(Form.slug).where(
            Form.coach_id == profile.user_id,
            Form.featured_on_public_profile.is_(True),
            Form.is_active.is_(True),
        )
    )
    return PortalPublicOut(
        business_name=profile.business_name,
        niche=profile.niche,
        brand_color=profile.brand_color,
        logo_url=profile.logo_url,
        coach_name=user.name,
        bio=profile.bio,
        website_url=profile.website_url,
        instagram_url=profile.instagram_url,
        linkedin_url=profile.linkedin_url,
        gallery_image_urls=profile.gallery_image_urls,
        featured_form_slug=featured_form_slug,
    )


@router.get("/{slug}/gallery/{index}")
async def get_public_gallery_image(slug: str, index: int, db: AsyncSession = Depends(get_db)):
    """Mirrors get_public_form_image's exact pattern — serves by index rather
    than exposing the raw storage key."""
    profile, _user = await _get_coach_by_slug(db, slug)
    images = profile.gallery_image_urls or []
    if index < 0 or index >= len(images):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    key = images[index]
    presigned = get_presigned_url(key)
    if presigned:
        return RedirectResponse(presigned)
    content = await read_file(key)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Image not found")
    content_type, _ = mimetypes.guess_type(key)
    return Response(
        content=content, media_type=content_type or "image/jpeg", headers={"Content-Disposition": "inline"}
    )


@router.get("/{slug}/logo")
async def get_public_logo(slug: str, db: AsyncSession = Depends(get_db)):
    """Mirrors get_public_gallery_image's exact pattern for the coach's own
    logo — serves the stored key rather than exposing it directly."""
    profile, _user = await _get_coach_by_slug(db, slug)
    if not profile.logo_url:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No logo set")
    presigned = get_presigned_url(profile.logo_url)
    if presigned:
        return RedirectResponse(presigned)
    content = await read_file(profile.logo_url)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No logo set")
    content_type, _ = mimetypes.guess_type(profile.logo_url)
    return Response(
        content=content, media_type=content_type or "image/png", headers={"Content-Disposition": "inline"}
    )


@router.get("/{slug}/packages", response_model=list[ProgramTemplateOut])
async def get_public_packages(slug: str, db: AsyncSession = Depends(get_db)) -> list[ProgramTemplateOut]:
    """Public, no-session equivalent of programs.py's list_my_available_packages
    — for an anonymous portfolio visitor there's no client context to sort
    niche-matches first, so this just lists every client-selectable template."""
    profile, _user = await _get_coach_by_slug(db, slug)
    result = await db.execute(
        select(Program).where(
            Program.coach_id == profile.user_id,
            Program.is_template.is_(True),
            Program.client_selectable.is_(True),
        )
    )
    templates = list(result.scalars().all())
    return [await _to_template_out(db, t) for t in templates]


@router.get("/{slug}/c/{code}", response_model=ClientPortalPreviewOut)
@limiter.limit("20/minute")
async def get_client_portal_preview(
    request: Request, slug: str, code: str, db: AsyncSession = Depends(get_db)
) -> ClientPortalPreviewOut:
    """Resolves a client's permanent personal bookmark link — the frontend page
    at /{slug}/c/{code} uses this to personalize the login redirect (pre-filled
    email, coach branding) for a client who isn't currently signed in."""
    profile, _coach_user = await _get_coach_by_slug(db, slug)
    result = await db.execute(
        select(Client).where(Client.portal_code == code, Client.coach_id == profile.user_id)
    )
    client = result.scalar_one_or_none()
    if client is None or client.user_id is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link isn't available")

    user = await db.get(User, client.user_id)
    if user is None or client.invite_accepted_at is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This link isn't available")

    return ClientPortalPreviewOut(
        name=user.name, email=user.email, coach_name=_coach_user.name, business_name=profile.business_name
    )


@router.get("/{slug}/forms/{form_slug}", response_model=PublicFormOut)
async def get_public_form(
    slug: str, form_slug: str, db: AsyncSession = Depends(get_db)
) -> PublicFormOut:
    profile, user = await _get_coach_by_slug(db, slug)
    result = await db.execute(
        select(Form).where(
            Form.coach_id == profile.user_id, Form.slug == form_slug, Form.is_active.is_(True)
        )
    )
    form = result.scalar_one_or_none()
    if form is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This form isn't available")
    return PublicFormOut(
        title=form.title,
        description=form.description,
        fields=[FormFieldSchema.model_validate(f) for f in (form.fields_json or [])],
        coach_name=user.name,
        business_name=profile.business_name,
        has_image=form.image_key is not None,
    )


@router.get("/{slug}/forms/{form_slug}/image")
async def get_public_form_image(slug: str, form_slug: str, db: AsyncSession = Depends(get_db)):
    profile, _user = await _get_coach_by_slug(db, slug)
    result = await db.execute(
        select(Form).where(
            Form.coach_id == profile.user_id, Form.slug == form_slug, Form.is_active.is_(True)
        )
    )
    form = result.scalar_one_or_none()
    if form is None or not form.image_key:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No cover image set")
    presigned = get_presigned_url(form.image_key)
    if presigned:
        return RedirectResponse(presigned)
    content = await read_file(form.image_key)
    if content is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No cover image set")
    content_type, _ = mimetypes.guess_type(form.image_key)
    return Response(
        content=content, media_type=content_type or "image/jpeg", headers={"Content-Disposition": "inline"}
    )


@router.post("/{slug}/forms/{form_slug}/submit", status_code=status.HTTP_201_CREATED)
async def submit_public_form(
    slug: str, form_slug: str, body: FormSubmitRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    profile, _user = await _get_coach_by_slug(db, slug)
    result = await db.execute(
        select(Form).where(
            Form.coach_id == profile.user_id, Form.slug == form_slug, Form.is_active.is_(True)
        )
    )
    form = result.scalar_one_or_none()
    if form is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This form isn't available")

    fields = [FormFieldSchema.model_validate(f) for f in (form.fields_json or [])]
    for field in fields:
        if field.required and not body.answers.get(field.id):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, f'"{field.label}" is required')

    submission = FormSubmission(
        form_id=form.id,
        coach_id=profile.user_id,
        answers_json=body.answers,
        submitted_at=utcnow(),
    )
    db.add(submission)
    await db.flush()

    def find_answer(field_type: str) -> str | None:
        for f in fields:
            if f.type.value == field_type:
                value = body.answers.get(f.id)
                if isinstance(value, str) and value:
                    return value
        return None

    def find_name() -> str:
        for f in fields:
            if f.type.value == "text" and "name" in f.label.lower():
                value = body.answers.get(f.id)
                if isinstance(value, str) and value:
                    return value
        for f in fields:
            if f.type.value == "text":
                value = body.answers.get(f.id)
                if isinstance(value, str) and value:
                    return value
        return "New lead"

    notes_lines = []
    for f in fields:
        value = body.answers.get(f.id)
        if value:
            rendered = ", ".join(value) if isinstance(value, list) else value
            notes_lines.append(f"{f.label}: {rendered}")

    lead = Lead(
        coach_id=profile.user_id,
        name=find_name(),
        email=find_answer("email"),
        phone=find_answer("phone"),
        interested_in=form.title,
        stage=LeadStage.new,
        notes="\n".join(notes_lines),
        source="form",
        form_submission_id=submission.id,
    )
    db.add(lead)
    notification = Notification(
        user_id=profile.user_id,
        type="form_submitted",
        payload_json={
            "message": f'New submission: "{form.title}" from {lead.name}',
            "form_id": str(form.id),
        },
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    await broadcast_notification(notification)
    return {"ok": True}


@router.post("/{slug}/contact", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def submit_portal_contact(
    request: Request, slug: str, body: PortalContactRequest, db: AsyncSession = Depends(get_db)
) -> dict:
    """The public profile's built-in 'get in touch' card — creates a real
    Lead for that coach (source="public_profile"), same pipeline a manually-
    added or form-submitted lead lands in."""
    profile, _user = await _get_coach_by_slug(db, slug)
    lead = Lead(
        coach_id=profile.user_id,
        name=body.name,
        email=body.email,
        stage=LeadStage.new,
        notes=body.message,
        source="public_profile",
    )
    db.add(lead)
    notification = Notification(
        user_id=profile.user_id,
        type="new_lead",
        payload_json={"message": f"New lead from your public profile: {body.name}"},
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    await broadcast_notification(notification)
    return {"ok": True}


@router.post("/landing-interest", status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def submit_landing_interest(
    request: Request, body: LandingInterestCreate, db: AsyncSession = Depends(get_db)
) -> dict:
    db.add(LandingInterest(name=body.name, email=body.email, niche=body.niche, note=body.note))
    await db.commit()
    return {"ok": True}
