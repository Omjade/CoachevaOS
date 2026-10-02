import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.enums import MessageType
from app.models.mixins import TimestampMixin, UUIDPk


class Thread(Base, UUIDPk):
    __tablename__ = "threads"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    messages: Mapped[list["Message"]] = relationship(back_populates="thread")


class Message(Base, UUIDPk, TimestampMixin):
    __tablename__ = "messages"

    thread_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("threads.id"), index=True
    )
    sender_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    type: Mapped[MessageType] = mapped_column(Enum(MessageType, name="message_type"))
    body: Mapped[str | None] = mapped_column(Text)
    media_url: Mapped[str | None] = mapped_column(Text)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    # True for a message sent through an approved AgentAction (Drift Detector
    # nudge, Companion send, etc.) even though sender_id is still the coach —
    # lets the client's Companion feed visually distinguish "your AI team,
    # approved by your coach" from the coach's own typed messages, without
    # a second sender identity or a fake system user.
    is_agent_sent: Mapped[bool] = mapped_column(Boolean, default=False)

    thread: Mapped["Thread"] = relationship(back_populates="messages")
