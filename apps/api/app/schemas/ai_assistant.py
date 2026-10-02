import uuid
from datetime import datetime, time

from pydantic import BaseModel


class AssistantSettingsOut(BaseModel):
    enabled: bool
    tone: str | None
    style_notes: str | None
    custom_instructions: str | None
    daily_query_limit: int
    platform_query_ceiling: int

    # --- Your Voice & Rules (shared by Briefing/Client Agent/Companion) ---
    languages: str | None
    sample_messages: list[str] | None
    sign_off: str | None
    say_phrases: list[str] | None
    never_say_phrases: list[str] | None
    checkin_questions_json: list[dict] | None
    quiet_hours_start: time | None
    quiet_hours_end: time | None
    agents_paused: bool
    briefing_freedom: str
    client_agent_freedom: str
    companion_freedom: str
    drift_sensitivity: str

    model_config = {"from_attributes": True}


class AssistantSettingsUpdate(BaseModel):
    enabled: bool | None = None
    tone: str | None = None
    style_notes: str | None = None
    custom_instructions: str | None = None
    daily_query_limit: int | None = None
    languages: str | None = None
    sample_messages: list[str] | None = None
    sign_off: str | None = None
    say_phrases: list[str] | None = None
    never_say_phrases: list[str] | None = None
    checkin_questions_json: list[dict] | None = None
    quiet_hours_start: time | None = None
    quiet_hours_end: time | None = None
    agents_paused: bool | None = None
    briefing_freedom: str | None = None
    client_agent_freedom: str | None = None
    companion_freedom: str | None = None
    drift_sensitivity: str | None = None


class AssistantMessageOut(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    escalated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AssistantMessageCreate(BaseModel):
    content: str


class AssistantMessageSendOut(BaseModel):
    reply: AssistantMessageOut
    remaining_today: int
