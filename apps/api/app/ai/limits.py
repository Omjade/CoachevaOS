import uuid
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ai import AIUsageLog


def _today_start() -> datetime:
    return datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)


async def check_daily_quota(
    db: AsyncSession, coach_id: uuid.UUID, feature: str, limit: int
) -> bool:
    """True if the coach is still under today's quota for this feature. Callers
    should check this before spending a request on anything scheduled/bulk (program
    drafts, onboarding drafts) so a single feature can't run away through a coach's
    OpenAI budget."""
    count = await db.scalar(
        select(func.count())
        .select_from(AIUsageLog)
        .where(
            AIUsageLog.coach_id == coach_id,
            AIUsageLog.feature == feature,
            AIUsageLog.created_at >= _today_start(),
        )
    )
    return (count or 0) < limit
