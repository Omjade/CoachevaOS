import uuid
from datetime import date, datetime

from sqlalchemy import ARRAY, Date, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import ClientStatus
from app.models.mixins import UUIDPk


class Client(Base, UUIDPk):
    __tablename__ = "clients"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), unique=True
    )
    goals: Mapped[str | None] = mapped_column(Text)
    program: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[ClientStatus] = mapped_column(
        Enum(ClientStatus, name="client_status"), default=ClientStatus.active
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    subscription_valid_until: Mapped[date | None] = mapped_column(Date)
    tags: Mapped[list[str] | None] = mapped_column(ARRAY(String))
    notes: Mapped[str | None] = mapped_column(Text)

    intake_response: Mapped["IntakeResponse | None"] = relationship(
        back_populates="client", uselist=False
    )


class IntakeResponse(Base, UUIDPk):
    __tablename__ = "intake_responses"

    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), unique=True
    )
    goals: Mapped[str | None] = mapped_column(Text)
    experience: Mapped[str | None] = mapped_column(String(64))
    availability: Mapped[str | None] = mapped_column(Text)
    notes: Mapped[str | None] = mapped_column(Text)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))

    client: Mapped["Client"] = relationship(back_populates="intake_response")
