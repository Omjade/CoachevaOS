import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.enums import MeetingStatus
from app.models.mixins import UUIDPk


class Meeting(Base, UUIDPk):
    __tablename__ = "meetings"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    client_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id"), index=True
    )
    calcom_booking_id: Mapped[str | None] = mapped_column(String(255))
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[MeetingStatus] = mapped_column(
        Enum(MeetingStatus, name="meeting_status"), default=MeetingStatus.scheduled
    )
    meeting_url: Mapped[str | None] = mapped_column(String(1024))
    # Which connected provider actually generated meeting_url ("google"/"zoom"),
    # so both coach and client can see what they'll be joining before it starts.
    meeting_provider: Mapped[str | None] = mapped_column(String(32))
    # Where the booking itself was created: "internal" (CoachevaOS's own
    # slot-picker/coach-scheduled flow) vs "calendly"/"cal_com" (booked on
    # the provider's own page, synced in here via their webhook). Distinct
    # from meeting_provider, which is about the join link, not the booking.
    booking_source: Mapped[str] = mapped_column(String(16), default="internal")
    # The external booking's stable identifier (Calendly's scheduled-event
    # URI, Cal.com's booking uid) — used to find/update/cancel the matching
    # row on a later webhook delivery. Never set for internal bookings.
    external_event_uri: Mapped[str | None] = mapped_column(String(512), index=True)
