import enum


class UserRole(str, enum.Enum):
    coach = "coach"
    client = "client"


class ClientStatus(str, enum.Enum):
    active = "active"
    at_risk = "at_risk"
    paused = "paused"
    churned = "churned"


class LeadStage(str, enum.Enum):
    new = "new"
    contacted = "contacted"
    follow_up = "follow_up"
    booked = "booked"
    converted = "converted"


class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    pdf = "pdf"
    video = "video"
    voice = "voice"


class TaskPriority(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"


class MeetingStatus(str, enum.Enum):
    scheduled = "scheduled"
    completed = "completed"
    canceled = "canceled"


class CheckinType(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"


class AIInsightType(str, enum.Enum):
    briefing = "briefing"
    risk = "risk"
    renewal = "renewal"
    follow_up = "follow_up"
    progress = "progress"
    session_summary = "session_summary"


class SubscriptionTier(str, enum.Enum):
    trial = "trial"
    starter = "starter"
    growth = "growth"
    scale = "scale"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    trialing = "trialing"
    active = "active"
    trial_expired = "trial_expired"
    past_due = "past_due"
    canceled = "canceled"


class CalendarProvider(str, enum.Enum):
    google = "google"
    zoom = "zoom"
    calendly = "calendly"
    cal_com = "cal_com"


class FormFieldType(str, enum.Enum):
    text = "text"
    textarea = "textarea"
    email = "email"
    phone = "phone"
    number = "number"
    date = "date"
    select = "select"
    radio = "radio"
    checkbox = "checkbox"
    consent = "consent"
