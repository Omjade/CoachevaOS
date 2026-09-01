import uuid

from pydantic import BaseModel


class AutomationSettingsOut(BaseModel):
    auto_onboarding_enabled: bool
    auto_assign_template_id: uuid.UUID | None

    model_config = {"from_attributes": True}


class AutomationSettingsUpdate(BaseModel):
    auto_onboarding_enabled: bool | None = None
    # Sentinel-free: the frontend always sends this key when the toggle is on
    # (null clears it, an id sets it) since Pydantic can't distinguish
    # "omitted" from "explicitly null" without extra machinery this doesn't need.
    auto_assign_template_id: uuid.UUID | None = None
    clear_template: bool = False
