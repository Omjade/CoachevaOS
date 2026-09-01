import uuid
from typing import Any

from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import CustomFieldType
from app.models.mixins import UUIDPk


class CustomFieldGroup(Base, UUIDPk):
    __tablename__ = "custom_field_groups"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    order: Mapped[int] = mapped_column(Integer, default=0)


class CustomFieldDefinition(Base, UUIDPk):
    __tablename__ = "custom_field_definitions"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    group_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("custom_field_groups.id"), index=True
    )
    name: Mapped[str] = mapped_column(String(255))
    field_type: Mapped[CustomFieldType] = mapped_column(
        Enum(CustomFieldType, name="custom_field_type")
    )
    options: Mapped[list | None] = mapped_column(JSONB)
    unit: Mapped[str | None] = mapped_column(String(32))
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    visible_to_client: Mapped[bool] = mapped_column(Boolean, default=False)
    order: Mapped[int] = mapped_column(Integer, default=0)


class CustomFieldValue(Base, UUIDPk):
    __tablename__ = "custom_field_values"
    __table_args__ = (
        UniqueConstraint("definition_id", "client_id", name="uq_custom_field_value_def_client"),
    )

    definition_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("custom_field_definitions.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    # One JSONB column serves every field type (string/number/bool/string-array)
    # rather than a sparse column per type.
    value: Mapped[Any] = mapped_column(JSONB)
