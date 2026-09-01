import uuid
from typing import Any

from pydantic import BaseModel

from app.models.enums import CustomFieldType


class GroupCreate(BaseModel):
    name: str
    order: int = 0


class GroupUpdate(BaseModel):
    name: str | None = None
    order: int | None = None


class GroupOut(BaseModel):
    id: uuid.UUID
    name: str
    order: int

    model_config = {"from_attributes": True}


class DefinitionCreate(BaseModel):
    group_id: uuid.UUID | None = None
    name: str
    field_type: CustomFieldType
    options: list[str] | None = None
    unit: str | None = None
    required: bool = False
    visible_to_client: bool = False
    order: int = 0


class DefinitionUpdate(BaseModel):
    group_id: uuid.UUID | None = None
    name: str | None = None
    field_type: CustomFieldType | None = None
    options: list[str] | None = None
    unit: str | None = None
    required: bool | None = None
    visible_to_client: bool | None = None
    order: int | None = None


class DefinitionOut(BaseModel):
    id: uuid.UUID
    group_id: uuid.UUID | None
    name: str
    field_type: CustomFieldType
    options: list[str] | None
    unit: str | None
    required: bool
    visible_to_client: bool
    order: int

    model_config = {"from_attributes": True}


class ClientFieldValueOut(BaseModel):
    definition: DefinitionOut
    value: Any | None


class ClientCustomFieldsOut(BaseModel):
    groups: list[GroupOut]
    fields: list[ClientFieldValueOut]


class ValueUpsert(BaseModel):
    value: Any


class ApplyTemplateResult(BaseModel):
    groups_created: int
    fields_created: int
    metrics_created: int
