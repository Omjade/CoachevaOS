import io
import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embeddings import chunk_text, embed_text
from app.models.document_chunks import DocumentChunk
from app.models.documents import Document
from app.storage import read_file

logger = logging.getLogger(__name__)

MAX_CHUNKS_PER_COACH = 500
TEXT_EXTENSIONS = {"txt", "md"}


def _extract_text(document: Document, content: bytes) -> str | None:
    """Only PDFs and plain text are indexed — no OCR, so images/video/audio are
    deliberately skipped. Keeps ingestion reliable and cheap."""
    if document.type == "pdf":
        try:
            from pypdf import PdfReader

            reader = PdfReader(io.BytesIO(content))
            return "\n\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception:
            logger.exception("PDF text extraction failed for document %s", document.id)
            return None

    ext = document.name.rsplit(".", 1)[-1].lower() if "." in document.name else ""
    if ext in TEXT_EXTENSIONS:
        try:
            return content.decode("utf-8", errors="ignore")
        except Exception:
            return None

    return None


async def ingest_document_for_rag(db: AsyncSession, document: Document) -> None:
    """Best-effort: never raises, so a failed extraction/embedding never blocks the
    upload response that already succeeded. Skips entirely if no OPENAI_API_KEY is
    set (embed_text returns None) or the coach has hit their chunk ceiling."""
    try:
        chunk_count = await db.scalar(
            select(func.count())
            .select_from(DocumentChunk)
            .where(DocumentChunk.coach_id == document.coach_id)
        )
        if (chunk_count or 0) >= MAX_CHUNKS_PER_COACH:
            return

        content = await read_file(document.s3_key)
        if content is None:
            return
        text = _extract_text(document, content)
        if not text or not text.strip():
            return

        chunks = chunk_text(text)
        budget = MAX_CHUNKS_PER_COACH - (chunk_count or 0)
        for i, chunk in enumerate(chunks[:budget]):
            embedding = await embed_text(chunk)
            if embedding is None:
                return  # no API key — stop rather than write chunks with no vector
            db.add(
                DocumentChunk(
                    document_id=document.id,
                    coach_id=document.coach_id,
                    content=chunk,
                    embedding=embedding,
                    chunk_index=i,
                )
            )
        await db.commit()
    except Exception:
        logger.exception("Document ingestion failed for document %s", document.id)
