import uuid
from datetime import date

from pydantic import BaseModel


class MetricDefinitionCreate(BaseModel):
    name: str
    unit: str | None = None
    category: str | None = None


class MetricDefinitionOut(BaseModel):
    id: uuid.UUID
    name: str
    unit: str | None
    category: str | None

    model_config = {"from_attributes": True}


class MetricEntryCreate(BaseModel):
    value: float
    recorded_at: date
    notes: str | None = None


class MetricEntryOut(BaseModel):
    id: uuid.UUID
    definition_id: uuid.UUID
    value: float
    recorded_at: date
    notes: str | None
    created_by: uuid.UUID

    model_config = {"from_attributes": True}
