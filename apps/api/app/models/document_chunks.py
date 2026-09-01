import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import UUIDPk

EMBEDDING_DIM = 1536  # text-embedding-3-small


class DocumentChunk(Base, UUIDPk):
    """RAG index over a coach's own uploaded documents. `coach_id` is queried on
    every retrieval — never fetched without it, since a missed filter here would
    leak one coach's document content into another coach's AI answers."""

    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), index=True
    )
    coach_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    content: Mapped[str] = mapped_column(Text)
    embedding: Mapped[list[float]] = mapped_column(Vector(EMBEDDING_DIM))
    chunk_index: Mapped[int] = mapped_column(Integer)
