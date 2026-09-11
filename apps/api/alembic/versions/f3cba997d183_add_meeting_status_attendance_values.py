"""add meeting status attendance values

Revision ID: f3cba997d183
Revises: f99322167a0d
Create Date: 2026-09-12 00:05:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f3cba997d183'
down_revision: Union[str, Sequence[str], None] = 'f99322167a0d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    New Postgres enum values only — kept in their own migration/transaction
    since a newly-added enum value can't be used in the same transaction it
    was created in (same lesson as cf6d022b2487 / 4de3d968d93c / 46247edf6f7f
    / a2c1aed332c2).
    """
    op.execute("ALTER TYPE meeting_status ADD VALUE IF NOT EXISTS 'attended'")
    op.execute("ALTER TYPE meeting_status ADD VALUE IF NOT EXISTS 'no_show'")
    op.execute("ALTER TYPE meeting_status ADD VALUE IF NOT EXISTS 'rescheduled'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct "remove enum value" op; leaving it in place on
    # downgrade is the standard tradeoff (same as prior enum-value migrations).
