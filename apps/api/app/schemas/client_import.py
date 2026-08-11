from pydantic import BaseModel


class ImportPreviewOut(BaseModel):
    headers: list[str]
    mapping: dict[str, str | None]
    rows: list[dict[str, str]]
    warnings: list[str] = []


class ImportCommitRequest(BaseModel):
    mapping: dict[str, str | None]
    rows: list[dict[str, str]]


class ImportSkip(BaseModel):
    row: dict[str, str]
    reason: str


class ImportCommitOut(BaseModel):
    created: int
    skipped: list[ImportSkip]
