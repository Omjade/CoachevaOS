"""add billing country code and region signal logs

Revision ID: a8dd981e70aa
Revises: 04f2c33918c8
Create Date: 2026-08-15 14:14:10.934634

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'a8dd981e70aa'
down_revision: Union[str, Sequence[str], None] = '04f2c33918c8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('coach_profiles', sa.Column('billing_country_code', sa.String(length=2), nullable=True))
    op.create_table(
        'region_signal_logs',
        sa.Column('coach_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('context', sa.String(length=32), nullable=False),
        sa.Column('declared_country_code', sa.String(length=2), nullable=True),
        sa.Column('ip_country_code', sa.String(length=2), nullable=True),
        sa.Column('mismatch', sa.Boolean(), server_default=sa.text('false'), nullable=False),
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['coach_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_region_signal_logs_coach_id'), 'region_signal_logs', ['coach_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_region_signal_logs_coach_id'), table_name='region_signal_logs')
    op.drop_table('region_signal_logs')
    op.drop_column('coach_profiles', 'billing_country_code')
