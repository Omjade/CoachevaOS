import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentOut(BaseModel):
    id: uuid.UUID
    name: str
    type: str
    uploaded_by_name: str
    created_at: datetime
    download_url: str
    # True for a coach's own client-agnostic reference document (client_id is
    # null) — never visible to any client, distinct from a per-client upload.
    is_library: bool = False

    model_config = {"from_attributes": True}


class DocumentShareRequest(BaseModel):
    client_ids: list[uuid.UUID]


class DocumentShareOut(BaseModel):
    sent: int
