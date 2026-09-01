import uuid
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.custom_field_templates import resolve_niche
from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.clients import Client
from app.models.enums import MessageType
from app.models.forms import Form
from app.models.goals import ClientGoal
from app.models.messaging import Thread
from app.models.notifications import Notification
from app.notifications import broadcast_notification
from app.models.programs import Program, ProgramItem
from app.models.tasks import Task
from app.models.users import CoachProfile, User
from app.routers.clients import _get_owned_client
from app.routers.threads import _create_and_broadcast
from app.schemas.programs import (
    ProgramCreate,
    ProgramDatesUpdate,
    ProgramOut,
    ProgramTemplateCreate,
    ProgramTemplateOut,
    ProgramTemplateUpdate,
)
from app.utils.time import utcnow

router = APIRouter(tags=["programs"])


def _program_out_kwargs(program: Program) -> dict:
    return dict(
        id=program.id,
        client_id=program.client_id,
        title=program.title,
        niche=program.niche,
        created_at=program.created_at,
        assigned_from_template_id=program.assigned_from_template_id,
        duration_weeks=program.duration_weeks,
        started_at=program.started_at,
        description=program.description,
        checkin_cadence=program.checkin_cadence,
        price_amount=float(program.price_amount) if program.price_amount is not None else None,
        price_currency=program.price_currency,
        billing_cadence=program.billing_cadence,
    )


async def _to_out(db: AsyncSession, program: Program) -> ProgramOut:
    items_result = await db.execute(
        select(ProgramItem).where(ProgramItem.program_id == program.id).order_by(ProgramItem.order)
    )
    return ProgramOut(**_program_out_kwargs(program), items=list(items_result.scalars().all()))


async def _to_template_out(db: AsyncSession, template: Program) -> ProgramTemplateOut:
    items_result = await db.execute(
        select(ProgramItem).where(ProgramItem.program_id == template.id).order_by(ProgramItem.order)
    )
    assigned_count = await db.scalar(
        select(func.count()).select_from(Program).where(Program.assigned_from_template_id == template.id)
    )
    return ProgramTemplateOut(
        id=template.id,
        title=template.title,
        niche=template.niche,
        duration_weeks=template.duration_weeks,
        description=template.description,
        checkin_cadence=template.checkin_cadence,
        price_amount=float(template.price_amount) if template.price_amount is not None else None,
        price_currency=template.price_currency,
        billing_cadence=template.billing_cadence,
        client_selectable=template.client_selectable,
        created_at=template.created_at,
        items=list(items_result.scalars().all()),
        assigned_count=assigned_count or 0,
    )


async def _get_owned_template(db: AsyncSession, coach: User, template_id: uuid.UUID) -> Program:
    template = await db.get(Program, template_id)
    if template is None or template.coach_id != coach.id or not template.is_template:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Template not found")
    return template


async def _assign_template_to_client(
    db: AsyncSession, template: Program, client: Client, assigned_by: uuid.UUID
) -> Program:
    """Clones a template into a real per-client Program, then — per item —
    always copies the descriptive ProgramItem, and additionally creates a
    real Task/ClientGoal or shares a linked Form depending on item_kind.
    "milestone" (the default) has no side effect, exactly like every program
    item before this feature existed. Shared by both the coach-assign
    endpoint (this module) and the client-self-select endpoint (Phase 43)."""
    program = Program(
        coach_id=template.coach_id,
        client_id=client.id,
        title=template.title,
        niche=template.niche,
        created_by=assigned_by,
        is_template=False,
        duration_weeks=template.duration_weeks,
        started_at=utcnow().date(),
        description=template.description,
        checkin_cadence=template.checkin_cadence,
        price_amount=template.price_amount,
        price_currency=template.price_currency,
        billing_cadence=template.billing_cadence,
        assigned_from_template_id=template.id,
    )
    db.add(program)
    await db.flush()

    items_result = await db.execute(
        select(ProgramItem).where(ProgramItem.program_id == template.id).order_by(ProgramItem.order)
    )
    template_items = list(items_result.scalars().all())
    now = utcnow()

    for item in template_items:
        db.add(
            ProgramItem(
                program_id=program.id,
                order=item.order,
                title=item.title,
                description=item.description,
                target_metric=item.target_metric,
                week_number=item.week_number,
                item_kind=item.item_kind,
                linked_form_id=item.linked_form_id,
            )
        )

        due_date = (now + timedelta(weeks=item.week_number)).date() if item.week_number is not None else None

        if item.item_kind == "task":
            db.add(
                Task(
                    coach_id=template.coach_id,
                    client_id=client.id,
                    title=item.title,
                    due_date=due_date,
                    added_by_user_id=assigned_by,
                )
            )
        elif item.item_kind == "goal":
            db.add(
                ClientGoal(
                    client_id=client.id, created_by=assigned_by, title=item.title, target_date=due_date
                )
            )
        elif item.item_kind == "form" and item.linked_form_id:
            thread_result = await db.execute(
                select(Thread).where(Thread.client_id == client.id, Thread.coach_id == template.coach_id)
            )
            thread = thread_result.scalar_one_or_none()
            form = await db.get(Form, item.linked_form_id)
            coach_user = await db.get(User, template.coach_id)
            if thread is not None and form is not None and coach_user is not None:
                profile = await db.get(CoachProfile, template.coach_id)
                slug = profile.portal_slug if profile else ""
                link = f"{form.slug}" if not slug else f"{slug}/{form.slug}"
                message_body = f'{coach_user.name} shared a form with you: "{form.title}"\n/{link}'
                await _create_and_broadcast(
                    db, thread, coach_user, type_=MessageType.text, body=message_body, media_url=None
                )
        # "milestone" (default) — descriptive only, no side effect.

    # First-assignment convenience only — never overwrites a niche the client
    # (or a coach editing them directly) already set explicitly.
    if client.niche is None and template.niche is not None:
        client.niche = template.niche

    await db.commit()
    await db.refresh(program)
    return program


# NOTE: /clients/me/programs must be declared before /clients/{client_id}/programs —
# same route-ordering reason documented in goals.py. /programs/templates is a
# distinct top-level path and has no such ordering concern.


@router.get("/clients/me/programs", response_model=list[ProgramOut])
async def list_my_programs(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[ProgramOut]:
    result = await db.execute(
        select(Program)
        .where(Program.client_id == client.id, Program.is_template.is_(False))
        .order_by(Program.created_at.desc())
    )
    return [await _to_out(db, p) for p in result.scalars().all()]


@router.get("/clients/me/available-packages", response_model=list[ProgramTemplateOut])
async def list_my_available_packages(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> list[ProgramTemplateOut]:
    result = await db.execute(
        select(Program).where(
            Program.coach_id == client.coach_id,
            Program.is_template.is_(True),
            Program.client_selectable.is_(True),
        )
    )
    templates = list(result.scalars().all())
    profile = await db.get(CoachProfile, client.coach_id)
    my_niche = resolve_niche(client.niche, profile.niche if profile else None)
    # Niche-matching templates first, but every client-selectable template is
    # still offered — a fitness coach's nutrition package should still be
    # visible to a client tagged "fitness", just not first in line.
    templates.sort(key=lambda t: 0 if t.niche == my_niche else 1)
    return [await _to_template_out(db, t) for t in templates]


@router.post(
    "/clients/me/select-package/{template_id}", response_model=ProgramOut, status_code=status.HTTP_201_CREATED
)
async def select_my_package(
    template_id: uuid.UUID,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> ProgramOut:
    template = await db.get(Program, template_id)
    if (
        template is None
        or template.coach_id != client.coach_id
        or not template.is_template
        or not template.client_selectable
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Package not found")

    client_user = await db.get(User, client.user_id)
    program = await _assign_template_to_client(db, template, client, assigned_by=client.user_id)

    notification = Notification(
        user_id=client.coach_id,
        type="package_selected",
        payload_json={
            "message": f'{client_user.name if client_user else "A client"} selected the "{template.title}" package',
            "client_id": str(client.id),
        },
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    await broadcast_notification(notification)
    return await _to_out(db, program)


@router.get("/clients/{client_id}/programs", response_model=list[ProgramOut])
async def list_client_programs(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> list[ProgramOut]:
    await _get_owned_client(db, coach, client_id)
    result = await db.execute(
        select(Program)
        .where(Program.client_id == client_id, Program.is_template.is_(False))
        .order_by(Program.created_at.desc())
    )
    return [await _to_out(db, p) for p in result.scalars().all()]


@router.post(
    "/clients/{client_id}/programs", response_model=ProgramOut, status_code=status.HTTP_201_CREATED
)
async def create_client_program(
    client_id: uuid.UUID,
    body: ProgramCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramOut:
    client, _user = await _get_owned_client(db, coach, client_id)
    profile = await db.get(CoachProfile, coach.id)

    program = Program(
        coach_id=coach.id,
        client_id=client_id,
        title=body.title,
        niche=resolve_niche(client.niche, profile.niche if profile else None),
        created_by=coach.id,
        started_at=utcnow().date(),
    )
    db.add(program)
    await db.flush()

    for i, item in enumerate(body.items):
        db.add(
            ProgramItem(
                program_id=program.id,
                order=i,
                title=item.title,
                description=item.description,
                target_metric=item.target_metric,
                week_number=item.week_number,
                item_kind=item.item_kind,
                linked_form_id=item.linked_form_id,
            )
        )
    await db.commit()
    await db.refresh(program)
    return await _to_out(db, program)


@router.patch("/clients/{client_id}/programs/{program_id}/dates", response_model=ProgramOut)
async def update_client_program_dates(
    client_id: uuid.UUID,
    program_id: uuid.UUID,
    body: ProgramDatesUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramOut:
    await _get_owned_client(db, coach, client_id)
    program = await db.get(Program, program_id)
    if program is None or program.client_id != client_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Program not found")
    if body.started_at is not None:
        program.started_at = body.started_at
    if body.duration_weeks is not None:
        program.duration_weeks = body.duration_weeks
    await db.commit()
    await db.refresh(program)
    return await _to_out(db, program)


@router.delete("/clients/{client_id}/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client_program(
    client_id: uuid.UUID,
    program_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_owned_client(db, coach, client_id)
    program = await db.get(Program, program_id)
    if program is None or program.client_id != client_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Program not found")
    items_result = await db.execute(select(ProgramItem).where(ProgramItem.program_id == program.id))
    for item in items_result.scalars().all():
        await db.delete(item)
    await db.delete(program)
    await db.commit()


@router.post(
    "/clients/{client_id}/programs/assign-template/{template_id}",
    response_model=ProgramOut,
    status_code=status.HTTP_201_CREATED,
)
async def assign_template_to_client(
    client_id: uuid.UUID,
    template_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramOut:
    client, _user = await _get_owned_client(db, coach, client_id)
    template = await _get_owned_template(db, coach, template_id)
    program = await _assign_template_to_client(db, template, client, assigned_by=coach.id)
    return await _to_out(db, program)


# --- Coach-level reusable templates ---


@router.get("/programs/templates", response_model=list[ProgramTemplateOut])
async def list_templates(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> list[ProgramTemplateOut]:
    result = await db.execute(
        select(Program)
        .where(Program.coach_id == coach.id, Program.is_template.is_(True))
        .order_by(Program.created_at.desc())
    )
    return [await _to_template_out(db, t) for t in result.scalars().all()]


@router.post("/programs/templates", response_model=ProgramTemplateOut, status_code=status.HTTP_201_CREATED)
async def create_template(
    body: ProgramTemplateCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramTemplateOut:
    template = Program(
        coach_id=coach.id,
        client_id=None,
        title=body.title,
        niche=body.niche,
        created_by=coach.id,
        is_template=True,
        client_selectable=body.client_selectable,
        duration_weeks=body.duration_weeks,
        description=body.description,
        checkin_cadence=body.checkin_cadence,
        price_amount=body.price_amount,
        price_currency=body.price_currency,
        billing_cadence=body.billing_cadence,
    )
    db.add(template)
    await db.flush()

    for i, item in enumerate(body.items):
        db.add(
            ProgramItem(
                program_id=template.id,
                order=i,
                title=item.title,
                description=item.description,
                target_metric=item.target_metric,
                week_number=item.week_number,
                item_kind=item.item_kind,
                linked_form_id=item.linked_form_id,
            )
        )
    await db.commit()
    await db.refresh(template)
    return await _to_template_out(db, template)


@router.patch("/programs/templates/{template_id}", response_model=ProgramTemplateOut)
async def update_template(
    template_id: uuid.UUID,
    body: ProgramTemplateUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ProgramTemplateOut:
    template = await _get_owned_template(db, coach, template_id)
    for field in (
        "title",
        "niche",
        "duration_weeks",
        "description",
        "checkin_cadence",
        "price_amount",
        "price_currency",
        "billing_cadence",
        "client_selectable",
    ):
        value = getattr(body, field)
        if value is not None:
            setattr(template, field, value)

    if body.items is not None:
        existing_result = await db.execute(select(ProgramItem).where(ProgramItem.program_id == template.id))
        for existing in existing_result.scalars().all():
            await db.delete(existing)
        await db.flush()
        for i, item in enumerate(body.items):
            db.add(
                ProgramItem(
                    program_id=template.id,
                    order=i,
                    title=item.title,
                    description=item.description,
                    target_metric=item.target_metric,
                    week_number=item.week_number,
                    item_kind=item.item_kind,
                    linked_form_id=item.linked_form_id,
                )
            )

    await db.commit()
    await db.refresh(template)
    return await _to_template_out(db, template)


@router.delete("/programs/templates/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    template = await _get_owned_template(db, coach, template_id)
    items_result = await db.execute(select(ProgramItem).where(ProgramItem.program_id == template.id))
    for item in items_result.scalars().all():
        await db.delete(item)
    # Programs already assigned from this template keep their own copy of
    # everything (title/items/etc were cloned, not referenced) — only their
    # assigned_from_template_id FK is cleared, via ondelete="SET NULL".
    await db.delete(template)
    await db.commit()
