import uuid
from datetime import datetime

from pydantic import BaseModel


class AgentActionOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    kind: str
    draft_message: str
    status: str
    created_at: datetime
    sent_at: datetime | None

    model_config = {"from_attributes": True}


class AgentActionApproveRequest(BaseModel):
    # None means "send as drafted" — set only when the coach edited the text
    # in the approval inbox before approving.
    edited_message: str | None = None
