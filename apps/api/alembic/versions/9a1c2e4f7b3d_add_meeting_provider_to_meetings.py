"""add meeting_provider to meetings

Revision ID: 9a1c2e4f7b3d
Revises: 53e33f2a7eba
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9a1c2e4f7b3d'
down_revision: Union[str, Sequence[str], None] = '53e33f2a7eba'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('meetings', sa.Column('meeting_provider', sa.String(length=32), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('meetings', 'meeting_provider')
