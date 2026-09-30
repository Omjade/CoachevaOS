import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Cookie, Depends, Request, Response
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.analytics_admin import DailyPageView
from app.rate_limit import limiter

router = APIRouter(prefix="/track", tags=["track"])

VISITOR_COOKIE = "cv_vid"
# One year — long enough that a returning visitor's "unique" count stays
# accurate across sessions, short enough that it isn't effectively forever.
VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365


class VisitBody(BaseModel):
    path: str


@router.post("/visit", status_code=204)
@limiter.limit("60/minute")
async def track_visit(
    request: Request,
    body: VisitBody,
    response: Response,
    db: AsyncSession = Depends(get_db),
    cv_vid: str | None = Cookie(default=None),
) -> None:
    """Unauthenticated, first-party visit counter. Stores only an aggregate
    (date, path) -> counts row, never a per-visitor record — cv_vid is a
    random opaque id used purely to avoid double-counting the same browser's
    unique-visit within a day; it carries no personal data and is distinct
    from the consent-gated GA cookie in components/Analytics.tsx, so it
    doesn't need that same consent gate. See docs/PRD.md admin dashboard
    section and the privacy policy's "How we protect your data" section."""
    is_new_visitor = cv_vid is None
    if is_new_visitor:
        cv_vid = secrets.token_urlsafe(16)
        response.set_cookie(
            VISITOR_COOKIE,
            cv_vid,
            max_age=VISITOR_COOKIE_MAX_AGE,
            httponly=True,
            samesite="lax",
        )

    today = datetime.now(timezone.utc).date()
    path = body.path[:512]

    result = await db.execute(
        select(DailyPageView).where(DailyPageView.date == today, DailyPageView.path == path)
    )
    row = result.scalar_one_or_none()
    if row is None:
        row = DailyPageView(date=today, path=path, visit_count=0, unique_count=0)
        db.add(row)
        try:
            await db.flush()
        except IntegrityError:
            # Lost a race with a concurrent first hit on the same (date, path)
            # — fall back to the row the other request just created.
            await db.rollback()
            result = await db.execute(
                select(DailyPageView).where(DailyPageView.date == today, DailyPageView.path == path)
            )
            row = result.scalar_one()

    row.visit_count += 1
    if is_new_visitor:
        row.unique_count += 1
    await db.commit()
