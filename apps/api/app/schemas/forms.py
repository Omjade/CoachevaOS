import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.enums import FormFieldType


class FormFieldSchema(BaseModel):
    id: str
    type: FormFieldType
    label: str
    required: bool = False
    options: list[str] | None = None
    placeholder: str | None = None


class FormCreate(BaseModel):
    title: str
    description: str | None = None
    fields: list[FormFieldSchema] = []


class FormUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    fields: list[FormFieldSchema] | None = None
    is_active: bool | None = None


class FormOut(BaseModel):
    id: uuid.UUID
    title: str
    slug: str
    description: str | None
    fields: list[FormFieldSchema]
    is_active: bool
    created_at: datetime
    submission_count: int = 0


class PublicFormOut(BaseModel):
    title: str
    description: str | None
    fields: list[FormFieldSchema]
    coach_name: str
    business_name: str | None


class FormSubmitRequest(BaseModel):
    answers: dict[str, str | list[str]]


class FormSubmissionOut(BaseModel):
    id: uuid.UUID
    form_id: uuid.UUID
    answers: dict[str, str | list[str]]
    submitted_at: datetime
