from pydantic import BaseModel


class AnalyticsSummary(BaseModel):
    active_clients: int
    at_risk_clients: int
    paused_clients: int
    churned_clients: int
    lead_conversion_rate: float
    task_completion_rate: float
    leads_total: int
    leads_converted: int
    tasks_total: int
    tasks_done: int


class WeekPoint(BaseModel):
    week: str
    count: int


class CheckinWeekPoint(BaseModel):
    week: str
    checkins: int
    active_clients: int
    rate: float


class FunnelPoint(BaseModel):
    stage: str
    count: int


class AnalyticsTimeseries(BaseModel):
    client_growth: list[WeekPoint]
    lead_funnel: list[FunnelPoint]
    checkin_rate: list[CheckinWeekPoint]
