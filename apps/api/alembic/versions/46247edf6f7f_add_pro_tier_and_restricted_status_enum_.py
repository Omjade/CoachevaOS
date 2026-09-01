"""add pro tier and restricted status enum values

Revision ID: 46247edf6f7f
Revises: 4de3d968d93c
Create Date: 2026-08-15 00:27:41.951400

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '46247edf6f7f'
down_revision: Union[str, Sequence[str], None] = '4de3d968d93c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    New Postgres enum values only — kept in their own migration/transaction
    since a newly-added enum value can't be used in the same transaction it
    was created in (same lesson as cf6d022b2487 / 4de3d968d93c).
    """
    op.execute("ALTER TYPE subscription_tier ADD VALUE IF NOT EXISTS 'pro'")
    op.execute("ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'restricted'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct "remove enum value" op; leaving these in place
    # on downgrade is the standard tradeoff (same as prior enum-value migrations).
