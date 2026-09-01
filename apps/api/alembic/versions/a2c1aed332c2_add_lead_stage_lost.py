"""add lead stage lost

Revision ID: a2c1aed332c2
Revises: 844101fe2943
Create Date: 2026-08-18 23:39:58.499119

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2c1aed332c2'
down_revision: Union[str, Sequence[str], None] = '844101fe2943'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    New Postgres enum value only — kept in its own migration/transaction
    since a newly-added enum value can't be used in the same transaction it
    was created in (same lesson as cf6d022b2487 / 4de3d968d93c / 46247edf6f7f).
    """
    op.execute("ALTER TYPE lead_stage ADD VALUE IF NOT EXISTS 'lost'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct "remove enum value" op; leaving it in place on
    # downgrade is the standard tradeoff (same as prior enum-value migrations).
