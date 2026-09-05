"""add external booking sync fields to meetings

Revision ID: 7c2e9f14a6d1
Revises: 9a1c2e4f7b3d
Create Date: 2026-09-05 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7c2e9f14a6d1'
down_revision: Union[str, Sequence[str], None] = '9a1c2e4f7b3d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # server_default so existing rows (all genuinely internal bookings, made
    # before this feature existed) backfill correctly instead of failing the
    # NOT NULL constraint.
    op.add_column(
        'meetings',
        sa.Column('booking_source', sa.String(length=16), nullable=False, server_default='internal'),
    )
    op.add_column('meetings', sa.Column('external_event_uri', sa.String(length=512), nullable=True))
    op.create_index(
        op.f('ix_meetings_external_event_uri'), 'meetings', ['external_event_uri'], unique=False
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_meetings_external_event_uri'), table_name='meetings')
    op.drop_column('meetings', 'external_event_uri')
    op.drop_column('meetings', 'booking_source')
