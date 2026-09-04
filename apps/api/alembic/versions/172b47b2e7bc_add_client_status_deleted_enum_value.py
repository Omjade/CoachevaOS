"""add client status deleted enum value

Revision ID: 172b47b2e7bc
Revises: 1adb4bf6a84c
Create Date: 2026-09-04 21:38:10.931844

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '172b47b2e7bc'
down_revision: Union[str, Sequence[str], None] = '1adb4bf6a84c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # A newly-added Postgres enum value can't be used in the same
    # transaction it was created in — this migration only adds the value,
    # nothing else touches it, matching the established two-migration
    # discipline already used for LeadStage.lost.
    op.execute("ALTER TYPE client_status ADD VALUE IF NOT EXISTS 'deleted'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres has no DROP VALUE for enums — matches the same accepted
    # limitation already documented for the LeadStage.lost migration.
    pass
