import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.deps import require_active_coach, require_coach
from app.models.forms import Form, FormSubmission
from app.models.users import User
from app.schemas.forms import (
    FormCreate,
    FormFieldSchema,
    FormOut,
    FormSubmissionOut,
    FormUpdate,
)

router = APIRouter(prefix="/forms", tags=["forms"])

RESERVED_SLUGS = {
    "dashboard",
    "leads",
    "clients",
    "chat",
    "calendar",
    "documents",
    "billing",
    "settings",
    "checkin",
    "files",
    "messages",
    "onboarding",
    "progress",
    "tasks",
    "forms",
}


def _slugify(title: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.strip().lower()).strip("-")
    return slug or "form"


async def _unique_slug(db: AsyncSession, coach_id: uuid.UUID, title: str) -> str:
    base = _slugify(title)
    slug = base
    suffix = 2
    while True:
        taken_reserved = slug in RESERVED_SLUGS
        result = await db.execute(
            select(Form.id).where(Form.coach_id == coach_id, Form.slug == slug)
        )
        if not taken_reserved and result.scalar_one_or_none() is None:
            return slug
        slug = f"{base}-{suffix}"
        suffix += 1


def _to_form_out(form: Form, submission_count: int = 0) -> FormOut:
    return FormOut(
        id=form.id,
        title=form.title,
        slug=form.slug,
        description=form.description,
        fields=[FormFieldSchema.model_validate(f) for f in (form.fields_json or [])],
        is_active=form.is_active,
        created_at=form.created_at,
        submission_count=submission_count,
    )


async def _get_owned_form(db: AsyncSession, coach: User, form_id: uuid.UUID) -> Form:
    form = await db.get(Form, form_id)
    if form is None or form.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Form not found")
    return form


@router.post("", response_model=FormOut, status_code=status.HTTP_201_CREATED)
async def create_form(
    body: FormCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> FormOut:
    slug = await _unique_slug(db, coach.id, body.title)
    form = Form(
        coach_id=coach.id,
        title=body.title,
        slug=slug,
        description=body.description,
        fields_json=[f.model_dump(mode="json") for f in body.fields],
    )
    db.add(form)
    await db.commit()
    await db.refresh(form)
    return _to_form_out(form)


@router.get("", response_model=list[FormOut])
async def list_forms(
    coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[FormOut]:
    result = await db.execute(
        select(Form, func.count(FormSubmission.id))
        .outerjoin(FormSubmission, FormSubmission.form_id == Form.id)
        .where(Form.coach_id == coach.id)
        .group_by(Form.id)
        .order_by(Form.created_at.desc())
    )
    return [_to_form_out(form, count) for form, count in result.all()]


@router.get("/{form_id}", response_model=FormOut)
async def get_form(
    form_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> FormOut:
    form = await _get_owned_form(db, coach, form_id)
    return _to_form_out(form)


@router.patch("/{form_id}", response_model=FormOut)
async def update_form(
    form_id: uuid.UUID,
    body: FormUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> FormOut:
    form = await _get_owned_form(db, coach, form_id)
    if body.title is not None and body.title != form.title:
        form.title = body.title
        form.slug = await _unique_slug(db, coach.id, body.title)
    if body.description is not None:
        form.description = body.description
    if body.fields is not None:
        form.fields_json = [f.model_dump(mode="json") for f in body.fields]
    if body.is_active is not None:
        form.is_active = body.is_active
    await db.commit()
    await db.refresh(form)
    return _to_form_out(form)


@router.delete("/{form_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form(
    form_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    form = await _get_owned_form(db, coach, form_id)
    result = await db.execute(
        select(func.count(FormSubmission.id)).where(FormSubmission.form_id == form.id)
    )
    if (result.scalar_one() or 0) > 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            "This form has submissions — deactivate it instead of deleting.",
        )
    await db.delete(form)
    await db.commit()


@router.get("/{form_id}/submissions", response_model=list[FormSubmissionOut])
async def list_form_submissions(
    form_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> list[FormSubmissionOut]:
    await _get_owned_form(db, coach, form_id)
    result = await db.execute(
        select(FormSubmission)
        .where(FormSubmission.form_id == form_id)
        .order_by(FormSubmission.submitted_at.desc())
    )
    return [
        FormSubmissionOut(
            id=s.id, form_id=s.form_id, answers=s.answers_json, submitted_at=s.submitted_at
        )
        for s in result.scalars().all()
    ]


@router.get("/submissions/{submission_id}", response_model=FormSubmissionOut)
async def get_form_submission(
    submission_id: uuid.UUID,
    coach: User = Depends(require_coach),
    db: AsyncSession = Depends(get_db),
) -> FormSubmissionOut:
    submission = await db.get(FormSubmission, submission_id)
    if submission is None or submission.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Submission not found")
    return FormSubmissionOut(
        id=submission.id,
        form_id=submission.form_id,
        answers=submission.answers_json,
        submitted_at=submission.submitted_at,
    )
