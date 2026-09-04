"""add currency to coach profiles

Revision ID: 1adb4bf6a84c
Revises: 76949cc64a08
Create Date: 2026-09-04 21:18:49.184321

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1adb4bf6a84c'
down_revision: Union[str, Sequence[str], None] = '76949cc64a08'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'coach_profiles',
        sa.Column('currency', sa.String(length=3), nullable=False, server_default='usd'),
    )
    # Backfill existing rows from their already-declared billing country
    # (same logic used at onboarding for new rows) instead of leaving every
    # existing coach on the bare 'usd' default regardless of where they are.
    op.execute("UPDATE coach_profiles SET currency = 'inr' WHERE billing_country_code = 'IN'")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('coach_profiles', 'currency')
