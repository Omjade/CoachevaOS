from datetime import date as date_type

from sqlalchemy import Date, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.mixins import UUIDPk


class DailyPageView(Base, UUIDPk):
    """One row per (date, path) — an aggregate counter, never a per-visitor
    log. unique_count is incremented at most once per browser per day (see
    the cv_vid cookie in routers/track.py), so it approximates unique
    visitors without ever storing an identifying record."""

    __tablename__ = "daily_page_views"
    __table_args__ = (UniqueConstraint("date", "path", name="uq_daily_page_views_date_path"),)

    date: Mapped[date_type] = mapped_column(Date, index=True)
    path: Mapped[str] = mapped_column(String(512))
    visit_count: Mapped[int] = mapped_column(Integer, default=0)
    unique_count: Mapped[int] = mapped_column(Integer, default=0)
