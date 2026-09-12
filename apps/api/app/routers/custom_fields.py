import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.client import generate_json
from app.ai.prompts import custom_fields_ai_prompt
from app.custom_field_templates import metric_template_for_niche, template_for_niche
from app.db import get_db
from app.deps import get_current_client, require_active_coach
from app.models.clients import Client
from app.models.custom_fields import CustomFieldDefinition, CustomFieldGroup, CustomFieldValue
from app.models.enums import CustomFieldType
from app.models.metrics import MetricDefinition
from app.models.users import CoachProfile, User
from app.routers.clients import _get_owned_client
from app.schemas.custom_fields import (
    ApplyTemplateResult,
    ClientCustomFieldsOut,
    ClientFieldValueOut,
    DefinitionCreate,
    DefinitionOut,
    DefinitionUpdate,
    GenerateFieldsRequest,
    GenerateFieldsResult,
    GroupCreate,
    GroupOut,
    GroupUpdate,
    ValueUpsert,
)

router = APIRouter(tags=["custom-fields"])


async def _get_owned_group(db: AsyncSession, coach: User, group_id: uuid.UUID) -> CustomFieldGroup:
    group = await db.get(CustomFieldGroup, group_id)
    if group is None or group.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Group not found")
    return group


async def _get_owned_definition(
    db: AsyncSession, coach: User, definition_id: uuid.UUID
) -> CustomFieldDefinition:
    definition = await db.get(CustomFieldDefinition, definition_id)
    if definition is None or definition.coach_id != coach.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Field not found")
    return definition


@router.get("/custom-field-groups", response_model=list[GroupOut])
async def list_groups(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> list[CustomFieldGroup]:
    result = await db.execute(
        select(CustomFieldGroup).where(CustomFieldGroup.coach_id == coach.id).order_by(CustomFieldGroup.order)
    )
    return list(result.scalars().all())


@router.post("/custom-field-groups", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: GroupCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CustomFieldGroup:
    group = CustomFieldGroup(coach_id=coach.id, name=body.name, order=body.order)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


@router.patch("/custom-field-groups/{group_id}", response_model=GroupOut)
async def update_group(
    group_id: uuid.UUID,
    body: GroupUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CustomFieldGroup:
    group = await _get_owned_group(db, coach, group_id)
    if body.name is not None:
        group.name = body.name
    if body.order is not None:
        group.order = body.order
    await db.commit()
    await db.refresh(group)
    return group


@router.delete("/custom-field-groups/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(
    group_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    group = await _get_owned_group(db, coach, group_id)
    await db.delete(group)
    await db.commit()


@router.get("/custom-field-definitions", response_model=list[DefinitionOut])
async def list_definitions(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> list[CustomFieldDefinition]:
    result = await db.execute(
        select(CustomFieldDefinition)
        .where(CustomFieldDefinition.coach_id == coach.id)
        .order_by(CustomFieldDefinition.order)
    )
    return list(result.scalars().all())


@router.post(
    "/custom-field-definitions", response_model=DefinitionOut, status_code=status.HTTP_201_CREATED
)
async def create_definition(
    body: DefinitionCreate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CustomFieldDefinition:
    if body.group_id is not None:
        await _get_owned_group(db, coach, body.group_id)
    definition = CustomFieldDefinition(coach_id=coach.id, **body.model_dump())
    db.add(definition)
    await db.commit()
    await db.refresh(definition)
    return definition


@router.patch("/custom-field-definitions/{definition_id}", response_model=DefinitionOut)
async def update_definition(
    definition_id: uuid.UUID,
    body: DefinitionUpdate,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> CustomFieldDefinition:
    definition = await _get_owned_definition(db, coach, definition_id)
    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(definition, key, value)
    await db.commit()
    await db.refresh(definition)
    return definition


@router.delete("/custom-field-definitions/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_definition(
    definition_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    definition = await _get_owned_definition(db, coach, definition_id)
    await db.delete(definition)
    await db.commit()


@router.post("/custom-field-definitions/apply-template", response_model=ApplyTemplateResult)
async def apply_template(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> ApplyTemplateResult:
    profile = await db.get(CoachProfile, coach.id)
    template = template_for_niche(profile.niche if profile else None)

    existing_result = await db.execute(
        select(CustomFieldDefinition.name).where(CustomFieldDefinition.coach_id == coach.id)
    )
    existing_names = {row[0] for row in existing_result.all()}

    groups_created = 0
    fields_created = 0
    for group_index, group_template in enumerate(template):
        group = CustomFieldGroup(coach_id=coach.id, name=group_template.name, order=group_index)
        db.add(group)
        await db.flush()
        groups_created += 1

        for field_index, field_template in enumerate(group_template.fields):
            if field_template.name in existing_names:
                continue
            db.add(
                CustomFieldDefinition(
                    coach_id=coach.id,
                    group_id=group.id,
                    name=field_template.name,
                    field_type=field_template.field_type,
                    options=field_template.options,
                    unit=field_template.unit,
                    order=field_index,
                )
            )
            fields_created += 1

    existing_metric_names_result = await db.execute(
        select(MetricDefinition.name).where(MetricDefinition.coach_id == coach.id)
    )
    existing_metric_names = {row[0] for row in existing_metric_names_result.all()}
    metrics_created = 0
    for metric_template in metric_template_for_niche(profile.niche if profile else None):
        if metric_template.name in existing_metric_names:
            continue
        db.add(
            MetricDefinition(
                coach_id=coach.id,
                name=metric_template.name,
                unit=metric_template.unit,
                category=metric_template.category,
            )
        )
        metrics_created += 1

    await db.commit()
    return ApplyTemplateResult(
        groups_created=groups_created, fields_created=fields_created, metrics_created=metrics_created
    )


@router.post("/custom-field-definitions/generate", response_model=GenerateFieldsResult)
async def generate_fields(
    body: GenerateFieldsRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> GenerateFieldsResult:
    """Real AI generation (not the static per-niche template above) — the
    coach describes what they want to track in their own words, an LLM
    proposes a named group of fields, and it's created as a normal
    CustomFieldGroup/Definition set the coach can then edit, remove fields
    from, or call this again on for a fresh regenerate. Never silently
    replaces an existing group — each call always creates a new one."""
    profile = await db.get(CoachProfile, coach.id)
    niche = profile.niche if profile else None
    system, user_prompt = custom_fields_ai_prompt(niche, body.prompt)
    fallback = {"group_name": "AI-generated fields", "fields": []}
    payload = await generate_json(
        system, user_prompt, fallback, max_tokens=700, db=db, coach_id=coach.id, feature="custom_fields_ai"
    )

    valid_types = {t.value for t in CustomFieldType}
    group_name = str(payload.get("group_name") or fallback["group_name"]).strip()[:255]
    group = CustomFieldGroup(coach_id=coach.id, name=group_name or "AI-generated fields", order=0)
    db.add(group)
    await db.flush()

    created: list[CustomFieldDefinition] = []
    for order, f in enumerate(payload.get("fields", [])):
        if not isinstance(f, dict):
            continue
        field_type = f.get("field_type")
        if field_type not in valid_types:
            field_type = "text"
        name = str(f.get("name", "")).strip()
        if not name:
            continue
        options = f.get("options") if field_type in ("dropdown", "multi_select") else None
        definition = CustomFieldDefinition(
            coach_id=coach.id,
            group_id=group.id,
            name=name[:255],
            field_type=CustomFieldType(field_type),
            options=options if isinstance(options, list) else None,
            unit=(str(f["unit"]) if f.get("unit") else None),
            visible_to_client=bool(f.get("visible_to_client", False)),
            order=order,
        )
        db.add(definition)
        created.append(definition)

    await db.commit()
    for d in created:
        await db.refresh(d)
    await db.refresh(group)
    return GenerateFieldsResult(group=group, fields=created)


async def _build_client_fields_out(
    db: AsyncSession, coach_id: uuid.UUID, client_id: uuid.UUID, visible_only: bool
) -> ClientCustomFieldsOut:
    groups_result = await db.execute(
        select(CustomFieldGroup).where(CustomFieldGroup.coach_id == coach_id).order_by(CustomFieldGroup.order)
    )
    groups = list(groups_result.scalars().all())

    definitions_query = select(CustomFieldDefinition).where(CustomFieldDefinition.coach_id == coach_id)
    if visible_only:
        definitions_query = definitions_query.where(CustomFieldDefinition.visible_to_client.is_(True))
    definitions_result = await db.execute(definitions_query.order_by(CustomFieldDefinition.order))
    definitions = list(definitions_result.scalars().all())

    values_by_definition: dict[uuid.UUID, object] = {}
    if definitions:
        values_result = await db.execute(
            select(CustomFieldValue).where(
                CustomFieldValue.client_id == client_id,
                CustomFieldValue.definition_id.in_([d.id for d in definitions]),
            )
        )
        values_by_definition = {v.definition_id: v.value for v in values_result.scalars().all()}

    fields = [
        ClientFieldValueOut(definition=d, value=values_by_definition.get(d.id))
        for d in definitions
    ]
    return ClientCustomFieldsOut(groups=groups, fields=fields)


# NOTE: /clients/me/custom-fields must be declared before /clients/{client_id}/custom-fields —
# same route-ordering reason documented in goals.py.


@router.get("/clients/me/custom-fields", response_model=ClientCustomFieldsOut)
async def get_my_custom_fields(
    client: Client = Depends(get_current_client), db: AsyncSession = Depends(get_db)
) -> ClientCustomFieldsOut:
    return await _build_client_fields_out(db, client.coach_id, client.id, visible_only=True)


@router.put("/clients/me/custom-fields/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def upsert_my_field_value(
    definition_id: uuid.UUID,
    body: ValueUpsert,
    client: Client = Depends(get_current_client),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Client self-service value write — deliberately narrower than the coach's
    endpoint: only definitions this client's own coach has explicitly marked
    visible_to_client are writable here, so a client can never see or set a
    coach-internal field via this route."""
    definition = await db.get(CustomFieldDefinition, definition_id)
    if (
        definition is None
        or definition.coach_id != client.coach_id
        or not definition.visible_to_client
    ):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Field not found")

    result = await db.execute(
        select(CustomFieldValue).where(
            CustomFieldValue.definition_id == definition.id, CustomFieldValue.client_id == client.id
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        existing.value = body.value
    else:
        db.add(CustomFieldValue(definition_id=definition.id, client_id=client.id, value=body.value))
    await db.commit()


@router.get("/clients/{client_id}/custom-fields", response_model=ClientCustomFieldsOut)
async def get_client_custom_fields(
    client_id: uuid.UUID,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ClientCustomFieldsOut:
    await _get_owned_client(db, coach, client_id)
    return await _build_client_fields_out(db, coach.id, client_id, visible_only=False)


@router.put("/clients/{client_id}/custom-fields/{definition_id}", status_code=status.HTTP_204_NO_CONTENT)
async def upsert_client_field_value(
    client_id: uuid.UUID,
    definition_id: uuid.UUID,
    body: ValueUpsert,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_owned_client(db, coach, client_id)
    definition = await _get_owned_definition(db, coach, definition_id)

    result = await db.execute(
        select(CustomFieldValue).where(
            CustomFieldValue.definition_id == definition.id, CustomFieldValue.client_id == client_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        existing.value = body.value
    else:
        db.add(CustomFieldValue(definition_id=definition.id, client_id=client_id, value=body.value))
    await db.commit()
