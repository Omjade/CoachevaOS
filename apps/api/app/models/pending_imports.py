import uuid

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import TimestampMixin, UUIDPk


class PendingImportRow(Base, UUIDPk, TimestampMixin):
    """A CSV/XLSX import row skipped specifically for exceeding the coach's
    plan client-cap (never for other validation reasons — those are truly
    invalid data, not just untimely). Retried via POST /clients/import/
    retry-pending once the coach is no longer over-limit, so a coach never
    has to re-upload the same file after upgrading."""

    __tablename__ = "pending_import_rows"

    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    mapping_json: Mapped[dict] = mapped_column(JSONB)
    row_json: Mapped[dict] = mapped_column(JSONB)
    custom_field_columns_json: Mapped[list] = mapped_column(JSONB, default=list)
    source_filename: Mapped[str | None] = mapped_column(String(255))
