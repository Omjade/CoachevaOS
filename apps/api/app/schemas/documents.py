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

    model_config = {"from_attributes": True}
