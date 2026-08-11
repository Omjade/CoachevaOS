from pydantic import BaseModel


class InvitePreviewOut(BaseModel):
    name: str
    email: str
    coach_name: str
    portal_slug: str | None


class InviteAcceptRequest(BaseModel):
    password: str
