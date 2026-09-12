"""add todos table

Revision ID: 9d4e1f6a2c8b
Revises: 6ab282264f9e
Create Date: 2026-09-13 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9d4e1f6a2c8b'
down_revision: Union[str, Sequence[str], None] = '6ab282264f9e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        'todos',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('coach_id', sa.UUID(), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('text', sa.String(length=500), nullable=False),
        sa.Column('is_complete', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        # task_priority already exists (created by the tasks table) — reuse it.
        sa.Column('priority', postgresql.ENUM('low', 'medium', 'high', name='task_priority', create_type=False), nullable=True),
        sa.Column('time', sa.Time(), nullable=True),
        sa.Column(
            'created_via',
            sa.Enum('manual', 'voice_ai', name='todo_created_via'),
            nullable=False,
            server_default='manual',
        ),
        sa.Column('carried_forward_from', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_todos_coach_id'), 'todos', ['coach_id'], unique=False)
    op.create_index(op.f('ix_todos_date'), 'todos', ['date'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_todos_date'), table_name='todos')
    op.drop_index(op.f('ix_todos_coach_id'), table_name='todos')
    op.drop_table('todos')
    postgresql.ENUM(name='todo_created_via').drop(op.get_bind(), checkfirst=True)
