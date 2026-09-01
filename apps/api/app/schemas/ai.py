import uuid
from datetime import datetime

from pydantic import BaseModel


class BriefingOut(BaseModel):
    bullets: list[str]
    generated_at: datetime


class SessionNoteRequest(BaseModel):
    client_id: uuid.UUID
    text: str


class SuggestedGoalUpdate(BaseModel):
    title: str
    target_date: str | None = None


class SuggestedTask(BaseModel):
    title: str
    due_date: str | None = None


class SessionNoteOut(BaseModel):
    summary: str
    action_items: list[str]
    draft_message: str
    suggested_goal_updates: list[SuggestedGoalUpdate] = []
    suggested_tasks: list[SuggestedTask] = []


class SendFollowupRequest(BaseModel):
    client_id: uuid.UUID
    draft_message: str
    session_summary: str | None = None
    accepted_goal_updates: list[SuggestedGoalUpdate] = []
    accepted_tasks: list[SuggestedTask] = []


class SuggestReplyRequest(BaseModel):
    thread_id: uuid.UUID


class SuggestReplyOut(BaseModel):
    draft: str


class ProgressInsightOut(BaseModel):
    insight: str
    tasks_done: int
    tasks_total: int


class ChurnScorePoint(BaseModel):
    date: datetime
    score: int
    explanation: str | None = None


class ChurnTrendOut(BaseModel):
    client_id: uuid.UUID
    points: list[ChurnScorePoint]


class ClientSnapshotOut(BaseModel):
    narrative: str
    generated_at: datetime


class PrepMyDayItem(BaseModel):
    client_name: str
    meeting_time: str
    reminder: str


class PrepMyDayOut(BaseModel):
    items: list[PrepMyDayItem]
    generated_at: datetime


class OnboardingGoalSuggestion(BaseModel):
    title: str
    target_date: str | None = None


class OnboardingDraftOut(BaseModel):
    welcome_message: str
    suggested_goals: list[OnboardingGoalSuggestion]
    suggested_cadence: str


class WeeklyDigestOut(BaseModel):
    bullets: list[str]
    generated_at: datetime


class InvoiceReminderOut(BaseModel):
    draft_message: str


class ProgramItemDraft(BaseModel):
    title: str
    description: str
    target_metric: str | None = None


class ProgramDraftRequest(BaseModel):
    constraints: str | None = None


class ProgramDraftOut(BaseModel):
    title: str
    items: list[ProgramItemDraft]


class ProgramTemplateItemDraft(BaseModel):
    title: str
    description: str | None = None
    target_metric: str | None = None
    week_number: int | None = None
    item_kind: str = "milestone"


class ProgramTemplateDraftRequest(BaseModel):
    niche: str
    duration_weeks: int | None = None
    hint: str | None = None


class ProgramTemplateDraftOut(BaseModel):
    title: str
    description: str | None = None
    items: list[ProgramTemplateItemDraft]


class FormFieldDraft(BaseModel):
    type: str
    label: str
    required: bool
    options: list[str] | None = None


class FormAiDraftRequest(BaseModel):
    description: str


class FormAiDraftOut(BaseModel):
    title: str
    description: str
    fields: list[FormFieldDraft]


class AskRequest(BaseModel):
    question: str


class AskSource(BaseModel):
    document_id: uuid.UUID
    document_name: str
    snippet: str


class AskOut(BaseModel):
    answer: str
    sources: list[AskSource]
