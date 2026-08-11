from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.forms import Form, FormSubmission
from app.models.leads import Lead
from app.models.enums import LeadStage
from app.models.users import CoachProfile, User
from app.schemas.coach import PortalPublicOut
from app.schemas.forms import FormFieldSchema, FormSubmitRequest, PublicFormOut
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
    return PortalPublicOut(
        business_name=profile.business_name,
        niche=profile.niche,
        brand_color=profile.brand_color,
        logo_url=profile.logo_url,
        coach_name=user.name,
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
    await db.commit()
    return {"ok": True}
