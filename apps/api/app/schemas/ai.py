import uuid
from datetime import datetime

from pydantic import BaseModel


class BriefingOut(BaseModel):
    bullets: list[str]
    generated_at: datetime


class RiskFlagOut(BaseModel):
    client_id: uuid.UUID
    client_name: str
    level: str
    reason: str


class SessionNoteRequest(BaseModel):
    client_id: uuid.UUID
    text: str


class SessionNoteOut(BaseModel):
    summary: str
    action_items: list[str]
    draft_message: str


class SendFollowupRequest(BaseModel):
    client_id: uuid.UUID
    draft_message: str


class SuggestReplyRequest(BaseModel):
    thread_id: uuid.UUID


class SuggestReplyOut(BaseModel):
    draft: str


class ProgressInsightOut(BaseModel):
    insight: str
    tasks_done: int
    tasks_total: int
