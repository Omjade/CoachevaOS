from pydantic import BaseModel


class ImportPreviewOut(BaseModel):
    headers: list[str]
    mapping: dict[str, str | None]
    rows: list[dict[str, str]]
    warnings: list[str] = []


class ImportCommitRequest(BaseModel):
    mapping: dict[str, str | None]
    rows: list[dict[str, str]]
    # Source columns the coach chose to keep, unmapped to any known target
    # field — each becomes a real (get-or-create, text-type) custom field
    # definition instead of being silently dropped.
    custom_field_columns: list[str] = []


class ImportSkip(BaseModel):
    row: dict[str, str]
    reason: str


class ImportCommitOut(BaseModel):
    created: int
    skipped: list[ImportSkip]
