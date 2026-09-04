import csv
import io
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, status
from sqlalchemy import func, select
from sqlalchemy.exc import DBAPIError

from app.ai.import_mapping import TARGET_FIELDS, suggest_column_mapping
from app.db import get_db
from app.deps import require_active_coach
from app.models.custom_fields import CustomFieldDefinition, CustomFieldValue
from app.models.enums import CustomFieldType
from app.models.pending_imports import PendingImportRow
from app.models.users import User
from app.rate_limit import limiter
from app.routers.clients import create_client_with_user
from app.schemas.client_import import (
    ImportCommitOut,
    ImportCommitRequest,
    ImportPreviewOut,
    ImportSkip,
    PendingImportCountOut,
)
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/clients/import", tags=["clients"])

MAX_ROWS = 500
MAX_FILE_BYTES = 2 * 1024 * 1024


def _parse_csv(content: bytes) -> tuple[list[str], list[dict[str, str]]]:
    text = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text))
    headers = reader.fieldnames or []
    rows = [{h: (row.get(h) or "").strip() for h in headers} for row in reader]
    return headers, rows


def _parse_xlsx(content: bytes) -> tuple[list[str], list[dict[str, str]]]:
    from openpyxl import load_workbook

    wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
    sheet = wb.active
    rows_iter = sheet.iter_rows(values_only=True)
    try:
        header_row = next(rows_iter)
    except StopIteration:
        return [], []
    headers = [str(h).strip() if h is not None else "" for h in header_row]
    rows: list[dict[str, str]] = []
    for raw_row in rows_iter:
        row = {}
        for h, v in zip(headers, raw_row):
            if not h:
                continue
            row[h] = "" if v is None else str(v).strip()
        rows.append(row)
    return headers, rows


@router.post("/preview", response_model=ImportPreviewOut)
@limiter.limit("10/minute")
async def preview_import(
    request: Request,
    file: UploadFile,
    coach: User = Depends(require_active_coach),
) -> ImportPreviewOut:
    content = await file.read()
    if len(content) > MAX_FILE_BYTES:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "File is too large (max 2MB)")

    filename = (file.filename or "").lower()
    if filename.endswith(".csv"):
        headers, rows = _parse_csv(content)
    elif filename.endswith(".xlsx"):
        headers, rows = _parse_xlsx(content)
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only .csv or .xlsx files are supported")

    warnings: list[str] = []
    if len(rows) > MAX_ROWS:
        warnings.append(f"Only the first {MAX_ROWS} rows were loaded (file had {len(rows)}).")
        rows = rows[:MAX_ROWS]
    if not headers:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No columns found in file")

    mapping = await suggest_column_mapping(headers)
    return ImportPreviewOut(headers=headers, mapping=mapping, rows=rows, warnings=warnings)


@router.post("/commit", response_model=ImportCommitOut)
@limiter.limit("10/minute")
async def commit_import(
    request: Request,
    body: ImportCommitRequest,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ImportCommitOut:
    if len(body.rows) > MAX_ROWS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Too many rows (max {MAX_ROWS})")

    name_col = body.mapping.get("name")
    email_col = body.mapping.get("email")
    phone_col = body.mapping.get("phone")
    goals_col = body.mapping.get("goals")
    program_col = body.mapping.get("program")
    tags_col = body.mapping.get("tags")
    notes_col = body.mapping.get("notes")

    # Get-or-create a text-type custom field definition per unmapped column the
    # coach chose to keep, so values land in real per-client fields instead of
    # being silently dropped. Matched by name so re-running an import (or a
    # coach who's already added a field by hand) doesn't create duplicates.
    custom_field_defs: dict[str, uuid.UUID] = {}
    for column in body.custom_field_columns:
        column = column.strip()
        if not column:
            continue
        existing = await db.execute(
            select(CustomFieldDefinition).where(
                CustomFieldDefinition.coach_id == coach.id,
                CustomFieldDefinition.name == column,
            )
        )
        definition = existing.scalar_one_or_none()
        if definition is None:
            definition = CustomFieldDefinition(
                coach_id=coach.id, name=column, field_type=CustomFieldType.text
            )
            db.add(definition)
            await db.flush()
        custom_field_defs[column] = definition.id

    created = 0
    pending_saved = 0
    skipped: list[ImportSkip] = []
    seen_emails: set[str] = set()

    for row_index, row in enumerate(body.rows):
        name = row.get(name_col, "").strip() if name_col else ""
        email = row.get(email_col, "").strip().lower() if email_col else ""

        if not name or not email:
            skipped.append(ImportSkip(row=row, reason="Missing name or email"))
            continue
        if email in seen_emails:
            skipped.append(ImportSkip(row=row, reason="Duplicate email in this file"))
            continue

        tags_raw = row.get(tags_col, "") if tags_col else ""
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()] or None

        try:
            async with db.begin_nested():
                client = await create_client_with_user(
                    db,
                    coach,
                    name=name,
                    email=email,
                    phone=(row.get(phone_col, "").strip() or None) if phone_col else None,
                    program=(row.get(program_col, "").strip() or None) if program_col else None,
                    goals=(row.get(goals_col, "").strip() or None) if goals_col else None,
                    tags=tags,
                    notes=(row.get(notes_col, "").strip() or None) if notes_col else None,
                )
                for column, definition_id in custom_field_defs.items():
                    raw_value = (row.get(column) or "").strip()
                    if raw_value:
                        db.add(
                            CustomFieldValue(
                                definition_id=definition_id, client_id=client.id, value=raw_value
                            )
                        )
        except HTTPException as exc:
            skipped.append(ImportSkip(row=row, reason=str(exc.detail)))
            if exc.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                # The cap is full for the rest of this batch too, not just
                # this row — save every remaining not-yet-attempted row for
                # automatic retry instead of trying (and failing) each one
                # individually, then stop.
                remaining = body.rows[row_index:]
                for r in remaining:
                    db.add(
                        PendingImportRow(
                            coach_id=coach.id,
                            mapping_json=body.mapping,
                            row_json=r,
                            custom_field_columns_json=body.custom_field_columns,
                        )
                    )
                    pending_saved += 1
                await db.commit()
                break
            continue
        except DBAPIError:
            # The DB connection itself dropped mid-request (e.g. Neon's serverless
            # compute recycling a connection) — every row already committed below
            # stays, but retrying further rows against the same dead connection
            # would just fail identically. Stop here instead of 500ing the whole
            # response, and tell the coach exactly what to do.
            logger.exception("Database connection lost during client import commit")
            remaining = body.rows[row_index:]
            skipped.extend(
                ImportSkip(row=r, reason="Not attempted. Connection interrupted, please retry.")
                for r in remaining
            )
            break

        seen_emails.add(email)
        created += 1

    await db.commit()
    return ImportCommitOut(created=created, skipped=skipped, pending_saved=pending_saved)


@router.get("/pending-count", response_model=PendingImportCountOut)
async def get_pending_import_count(
    coach: User = Depends(require_active_coach), db: AsyncSession = Depends(get_db)
) -> PendingImportCountOut:
    count = await db.scalar(
        select(func.count()).select_from(PendingImportRow).where(PendingImportRow.coach_id == coach.id)
    )
    return PendingImportCountOut(count=count or 0)


async def retry_pending_rows_for_coach(db: AsyncSession, coach: User) -> ImportCommitOut:
    """Re-attempts every row this coach has pending (saved earlier for
    hitting their plan's client cap) -- called from the retry-pending
    endpoint (manual, from a banner) and from the nightly cap-sweep job
    (automatic, once a coach is no longer over-limit). Each row still goes
    through the exact same cap check, so if the coach is STILL over limit
    (added more clients since, or the cap dropped), it's left pending
    rather than lost."""
    result = await db.execute(
        select(PendingImportRow).where(PendingImportRow.coach_id == coach.id).order_by(PendingImportRow.created_at)
    )
    pending_rows = list(result.scalars().all())

    created = 0
    skipped: list[ImportSkip] = []
    seen_emails: set[str] = set()

    for pending in pending_rows:
        mapping = pending.mapping_json
        row = pending.row_json
        name_col = mapping.get("name")
        email_col = mapping.get("email")
        phone_col = mapping.get("phone")
        goals_col = mapping.get("goals")
        program_col = mapping.get("program")
        tags_col = mapping.get("tags")
        notes_col = mapping.get("notes")

        name = row.get(name_col, "").strip() if name_col else ""
        email = row.get(email_col, "").strip().lower() if email_col else ""
        if not name or not email or email in seen_emails:
            await db.delete(pending)
            continue

        tags_raw = row.get(tags_col, "") if tags_col else ""
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()] or None

        try:
            async with db.begin_nested():
                client = await create_client_with_user(
                    db,
                    coach,
                    name=name,
                    email=email,
                    phone=(row.get(phone_col, "").strip() or None) if phone_col else None,
                    program=(row.get(program_col, "").strip() or None) if program_col else None,
                    goals=(row.get(goals_col, "").strip() or None) if goals_col else None,
                    tags=tags,
                    notes=(row.get(notes_col, "").strip() or None) if notes_col else None,
                )
                for column in pending.custom_field_columns_json:
                    raw_value = (row.get(column) or "").strip()
                    if not raw_value:
                        continue
                    existing = await db.execute(
                        select(CustomFieldDefinition).where(
                            CustomFieldDefinition.coach_id == coach.id,
                            CustomFieldDefinition.name == column,
                        )
                    )
                    definition = existing.scalar_one_or_none()
                    if definition is None:
                        definition = CustomFieldDefinition(
                            coach_id=coach.id, name=column, field_type=CustomFieldType.text
                        )
                        db.add(definition)
                        await db.flush()
                    db.add(
                        CustomFieldValue(
                            definition_id=definition.id, client_id=client.id, value=raw_value
                        )
                    )
        except HTTPException as exc:
            skipped.append(ImportSkip(row=row, reason=str(exc.detail)))
            if exc.status_code == status.HTTP_402_PAYMENT_REQUIRED:
                # Still over the cap -- leave this row (and the rest) pending
                # rather than losing it, and stop trying further rows this pass.
                break
            await db.delete(pending)
            continue

        seen_emails.add(email)
        created += 1
        await db.delete(pending)

    await db.commit()
    return ImportCommitOut(created=created, skipped=skipped, pending_saved=0)


@router.post("/retry-pending", response_model=ImportCommitOut)
@limiter.limit("10/minute")
async def retry_pending_import(
    request: Request,
    coach: User = Depends(require_active_coach),
    db: AsyncSession = Depends(get_db),
) -> ImportCommitOut:
    return await retry_pending_rows_for_coach(db, coach)
