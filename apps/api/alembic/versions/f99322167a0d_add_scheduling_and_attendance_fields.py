"""add scheduling and attendance fields

Revision ID: f99322167a0d
Revises: 7c2e9f14a6d1
Create Date: 2026-09-12 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f99322167a0d'
down_revision: Union[str, Sequence[str], None] = '7c2e9f14a6d1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    postgresql.ENUM('online', 'in_person', 'hybrid', name='coaching_mode').create(
        op.get_bind(), checkfirst=True
    )
    postgresql.ENUM('remote', 'in_person', 'hybrid', name='client_type').create(
        op.get_bind(), checkfirst=True
    )
    postgresql.ENUM('video', 'in_person', 'phone', name='session_type').create(
        op.get_bind(), checkfirst=True
    )

    op.add_column(
        'coach_profiles',
        sa.Column(
            'coaching_mode',
            sa.Enum('online', 'in_person', 'hybrid', name='coaching_mode'),
            nullable=False,
            server_default='online',
        ),
    )
    op.add_column(
        'coach_profiles',
        sa.Column(
            'default_video_provider',
            # calendar_provider already exists (created by the calendar_connections
            # table) — create_type=False so this reuses it instead of re-creating it.
            postgresql.ENUM('google', 'zoom', 'calendly', 'cal_com', name='calendar_provider', create_type=False),
            nullable=True,
        ),
    )
    op.add_column(
        'clients',
        sa.Column(
            'client_type',
            sa.Enum('remote', 'in_person', 'hybrid', name='client_type'),
            nullable=False,
            server_default='remote',
        ),
    )
    op.add_column('clients', sa.Column('timezone', sa.String(length=64), nullable=True))

    op.add_column(
        'meetings',
        sa.Column(
            'session_type',
            sa.Enum('video', 'in_person', 'phone', name='session_type'),
            nullable=False,
            server_default='video',
        ),
    )
    op.add_column('meetings', sa.Column('location', sa.String(length=255), nullable=True))
    op.add_column('meetings', sa.Column('recurrence_group_id', sa.UUID(), nullable=True))
    op.create_index(
        op.f('ix_meetings_recurrence_group_id'), 'meetings', ['recurrence_group_id'], unique=False
    )
    op.add_column('meetings', sa.Column('marked_by', sa.UUID(), nullable=True))
    op.add_column('meetings', sa.Column('marked_at', sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(
        'fk_meetings_marked_by_users', 'meetings', 'users', ['marked_by'], ['id']
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_meetings_marked_by_users', 'meetings', type_='foreignkey')
    op.drop_column('meetings', 'marked_at')
    op.drop_column('meetings', 'marked_by')
    op.drop_index(op.f('ix_meetings_recurrence_group_id'), table_name='meetings')
    op.drop_column('meetings', 'recurrence_group_id')
    op.drop_column('meetings', 'location')
    op.drop_column('meetings', 'session_type')

    op.drop_column('clients', 'timezone')
    op.drop_column('clients', 'client_type')
    op.drop_column('coach_profiles', 'default_video_provider')
    op.drop_column('coach_profiles', 'coaching_mode')

    postgresql.ENUM(name='session_type').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='client_type').drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name='coaching_mode').drop(op.get_bind(), checkfirst=True)
