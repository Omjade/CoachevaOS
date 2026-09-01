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
    # A deliberate holding stage for a cold/dead-looking lead — distinct from
    # "converted", which is a one-way real outcome. A lead can move here and
    # back out via the same unrestricted PATCH /leads/{id}/stage every other
    # transition already uses, no separate restore endpoint needed.
    lost = "lost"


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
    churn_score = "churn_score"
    prep_my_day = "prep_my_day"
    onboarding_draft = "onboarding_draft"
    weekly_digest = "weekly_digest"
    invoice_reminder = "invoice_reminder"
    client_snapshot = "client_snapshot"


class SubscriptionTier(str, enum.Enum):
    trial = "trial"
    starter = "starter"
    growth = "growth"
    scale = "scale"
    pro = "pro"
    enterprise = "enterprise"


class SubscriptionStatus(str, enum.Enum):
    trialing = "trialing"
    active = "active"
    trial_expired = "trial_expired"
    past_due = "past_due"
    restricted = "restricted"
    canceled = "canceled"


class PaymentProvider(str, enum.Enum):
    paddle = "paddle"
    razorpay = "razorpay"


class BillingCycle(str, enum.Enum):
    monthly = "monthly"
    annual = "annual"


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


class CustomFieldType(str, enum.Enum):
    text = "text"
    textarea = "textarea"
    number = "number"
    currency = "currency"
    percentage = "percentage"
    date = "date"
    dropdown = "dropdown"
    multi_select = "multi_select"
    checkbox = "checkbox"
    rating = "rating"
    url = "url"
    email = "email"
    phone = "phone"
