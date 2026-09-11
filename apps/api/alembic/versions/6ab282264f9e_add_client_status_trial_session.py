"""add client status trial_session

Revision ID: 6ab282264f9e
Revises: f3cba997d183
Create Date: 2026-09-12 00:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6ab282264f9e'
down_revision: Union[str, Sequence[str], None] = 'f3cba997d183'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema.

    New Postgres enum value only — its own migration/transaction, same
    reasoning as f3cba997d183. trial_session is deliberately excluded from
    every existing ClientStatus.active-gated query (coach-scoping dep,
    billing sweep, at-risk nightly sweep) — see app/models/enums.py's
    ClientStatus docstring comment.
    """
    op.execute("ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'trial_session'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no direct "remove enum value" op; leaving it in place on
    # downgrade is the standard tradeoff (same as prior enum-value migrations).
