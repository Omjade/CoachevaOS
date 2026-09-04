import mimetypes
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile, status
from fastapi.responses import RedirectResponse
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import generate_json
from app.ai.prompts import form_ai_draft_prompt
from app.config import settings
from app.db import get_db
from app.deps import require_active_coach, require_coach
from app.models.clients import Client
from app.models.enums import FormFieldType, MessageType
from app.models.forms import Form, FormSubmission
from app.models.messaging import Thread
from app.models.users import CoachProfile, User
from app.routers.threads import _create_and_broadcast
from app.schemas.ai import FormAiDraftOut, FormAiDraftRequest, FormFieldDraft
from app.schemas.forms import (
    FormCreate,
    FormFieldSchema,
    FormOut,
    FormShareOut,
    FormShareRequest,
    FormSubmissionOut,
    FormUpdate,
)
from app.storage import get_presigned_url, read_file, save_upload

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
    "client",
    "assistant",
    "programs",
    "packages",
    "coach",
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
        has_image=form.image_key is not None,
        featured_on_public_profile=form.featured_on_public_profile,
    )


async def _get_owned_form(db: AsyncSession, coach: User, form_id: uuid.UUID) -> Form:
    form = await db.get(Form, form_id)
    if form is None or form.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Form not found")
    return form


@router.post("/ai-draft", response_model=FormAiDraftOut)
async def ai_draft_form(
    body: FormAiDraftRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> FormAiDraftOut:
    system, user_prompt = form_ai_draft_prompt(body.description)
    fallback = {"title": "New form", "description": "", "fields": []}
    payload = await generate_json(
        system, user_prompt, fallback, max_tokens=600, db=db, coach_id=coach.id, feature="form_ai_draft"
    )

    valid_types = {t.value for t in FormFieldType}
    fields = []
    for f in payload.get("fields", []):
        if not isinstance(f, dict) or f.get("type") not in valid_types:
            continue
        fields.append(
            FormFieldDraft(
                type=f["type"],
                label=str(f.get("label", "")).strip() or "Untitled field",
                required=bool(f.get("required", False)),
                options=f.get("options") if f.get("type") in ("select", "radio", "checkbox") else None,
            )
        )

    return FormAiDraftOut(
        title=payload.get("title", fallback["title"]),
        description=payload.get("description", ""),
        fields=fields,
    )


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
    if body.featured_on_public_profile is not None:
        if body.featured_on_public_profile:
            # At most one featured form per coach — unset any other form's
            # flag rather than enforcing it as a DB constraint.
            await db.execute(
                update(Form)
                .where(Form.coach_id == coach.id, Form.id != form.id)
                .values(featured_on_public_profile=False)
            )
        form.featured_on_public_profile = body.featured_on_public_profile
    await db.commit()
    await db.refresh(form)
    return _to_form_out(form)


@router.post("/{form_id}/image", response_model=FormOut)
async def upload_form_image(
    form_id: uuid.UUID,
    file: UploadFile,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> FormOut:
    form = await _get_owned_form(db, coach, form_id)
    key, file_type = await save_upload(file)
    if file_type != "image":
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Please upload an image file")
    form.image_key = key
    await db.commit()
    await db.refresh(form)
    return _to_form_out(form)


@router.delete("/{form_id}/image", response_model=FormOut)
async def delete_form_image(
    form_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> FormOut:
    form = await _get_owned_form(db, coach, form_id)
    form.image_key = None
    await db.commit()
    await db.refresh(form)
    return _to_form_out(form)


@router.get("/{form_id}/image")
async def get_form_image(
    form_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
):
    form = await _get_owned_form(db, coach, form_id)
    if not form.image_key:
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


@router.post("/{form_id}/share", response_model=FormShareOut)
async def share_form_with_clients(
    form_id: uuid.UUID,
    body: FormShareRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> FormShareOut:
    """Sends the form's link as a chat message to each selected client's
    existing thread — reuses the real chat pipeline rather than a separate
    delivery mechanism, so it shows up exactly like any other message."""
    form = await _get_owned_form(db, coach, form_id)
    profile = await db.get(CoachProfile, coach.id)
    slug = profile.portal_slug if profile else ""
    link = f"{settings.frontend_url}/{slug}/{form.slug}"
    message_body = f'{coach.name} shared a form with you: "{form.title}"\n{link}'

    result = await db.execute(
        select(Client.id).where(Client.id.in_(body.client_ids), Client.coach_id == coach.id)
    )
    owned_client_ids = set(result.scalars().all())

    sent = 0
    for client_id in owned_client_ids:
        thread_result = await db.execute(
            select(Thread).where(Thread.client_id == client_id, Thread.coach_id == coach.id)
        )
        thread = thread_result.scalar_one_or_none()
        if thread is None:
            continue
        await _create_and_broadcast(
            db, thread, coach, type_=MessageType.text, body=message_body, media_url=None
        )
        sent += 1
    return FormShareOut(sent=sent)


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
            "This form has submissions. Deactivate it instead of deleting.",
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


def _submission_rows(form: Form, submissions: list[FormSubmission]) -> tuple[list[str], list[list[str]]]:
    fields = [FormFieldSchema.model_validate(f) for f in (form.fields_json or [])]
    headers = ["Submitted at"] + [f.label for f in fields]
    rows: list[list[str]] = []
    for s in submissions:
        row = [s.submitted_at.isoformat()]
        for f in fields:
            value = s.answers_json.get(f.id)
            if isinstance(value, list):
                row.append(", ".join(str(v) for v in value))
            else:
                row.append("" if value is None else str(value))
        rows.append(row)
    return headers, rows


async def _owned_form_and_submissions(
    db: AsyncSession, coach: User, form_id: uuid.UUID
) -> tuple[Form, list[FormSubmission]]:
    form = await _get_owned_form(db, coach, form_id)
    result = await db.execute(
        select(FormSubmission)
        .where(FormSubmission.form_id == form_id)
        .order_by(FormSubmission.submitted_at.desc())
    )
    return form, list(result.scalars().all())


@router.get("/{form_id}/submissions/export/csv")
async def export_submissions_csv(
    form_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> Response:
    import csv
    import io

    form, submissions = await _owned_form_and_submissions(db, coach, form_id)
    headers, rows = _submission_rows(form, submissions)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    writer.writerows(rows)
    return Response(
        content=buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{form.slug}-submissions.csv"'},
    )


@router.get("/{form_id}/submissions/export/xlsx")
async def export_submissions_xlsx(
    form_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> Response:
    import io

    from openpyxl import Workbook

    form, submissions = await _owned_form_and_submissions(db, coach, form_id)
    headers, rows = _submission_rows(form, submissions)
    wb = Workbook()
    ws = wb.active
    ws.title = "Submissions"
    ws.append(headers)
    for row in rows:
        ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return Response(
        content=buf.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{form.slug}-submissions.xlsx"'},
    )


@router.get("/{form_id}/submissions/export/pdf")
async def export_submissions_pdf(
    form_id: uuid.UUID, coach: User = Depends(require_coach), db: AsyncSession = Depends(get_db)
) -> Response:
    import io

    from reportlab.lib import colors
    from reportlab.lib.pagesizes import landscape, letter
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.lib.units import inch
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    form, submissions = await _owned_form_and_submissions(db, coach, form_id)
    headers, rows = _submission_rows(form, submissions)
    profile = await db.get(CoachProfile, coach.id)
    brand_name = profile.business_name if profile and profile.business_name else coach.name
    try:
        accent = colors.HexColor(profile.brand_color) if profile and profile.brand_color else colors.HexColor("#1c1d1f")
    except ValueError:
        accent = colors.HexColor("#1c1d1f")

    margin = 0.5 * inch
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=landscape(letter),
        leftMargin=margin,
        rightMargin=margin,
        topMargin=margin,
        bottomMargin=margin,
    )
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(brand_name, styles["Normal"]),
        Paragraph(f"{form.title}: submissions", styles["Title"]),
        Spacer(1, 6),
    ]

    # Explicit colWidths, evenly split across the usable page width — the
    # previous unconstrained Table let reportlab auto-size columns from
    # content, which could overflow the page on forms with many/long fields.
    page_width = landscape(letter)[0] - doc.leftMargin - doc.rightMargin
    col_width = page_width / max(len(headers), 1)

    # Wrap cell text so long answers don't just get clipped by the table.
    cell_style = styles["BodyText"]
    table_data = [headers] + [[Paragraph(cell, cell_style) for cell in row] for row in rows]
    table = Table(table_data, repeatRows=1, colWidths=[col_width] * len(headers))
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), accent),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d4d4d4")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        )
    )
    elements.append(table)
    elements.append(Spacer(1, 18))
    elements.append(Paragraph("Powered by CoachevaOS", styles["Normal"]))
    doc.build(elements)

    return Response(
        content=buf.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{form.slug}-submissions.pdf"'},
    )


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
