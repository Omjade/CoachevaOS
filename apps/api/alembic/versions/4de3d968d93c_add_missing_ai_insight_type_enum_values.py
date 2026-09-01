"""add missing ai_insight_type enum values

Revision ID: 4de3d968d93c
Revises: 4dfc31da2055
Create Date: 2026-08-13 01:30:48.325366

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4de3d968d93c'
down_revision: Union[str, Sequence[str], None] = '4dfc31da2055'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    These five AIInsightType members were added to the Python enum back in
    Phase 22 but the matching Postgres ALTER TYPE statements were never
    written — Alembic autogenerate does not detect enum-value additions on
    an existing type, so this has to be done by hand (same as the
    client_snapshot fix in cf6d022b2487).
    """
    for value in ("churn_score", "prep_my_day", "onboarding_draft", "weekly_digest", "invoice_reminder"):
        op.execute(f"ALTER TYPE ai_insight_type ADD VALUE IF NOT EXISTS '{value}'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct "remove enum value" op; leaving these in place
    # on downgrade is the standard tradeoff (same as cf6d022b2487).
