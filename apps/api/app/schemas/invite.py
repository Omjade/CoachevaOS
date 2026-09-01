from pydantic import BaseModel


class InvitePreviewOut(BaseModel):
    name: str
    email: str
    coach_name: str
    portal_slug: str | None
    # True when this email already has an active account (a password already
    # set — from another coach's relationship, or otherwise) — the accept
    # page asks them to confirm that existing password instead of creating a
    # new one, per Phase 48's shared-identity-across-coaches design.
    existing_account: bool = False


class InviteAcceptRequest(BaseModel):
    password: str
