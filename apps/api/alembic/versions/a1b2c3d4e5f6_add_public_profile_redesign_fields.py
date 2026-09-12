"""add public profile redesign fields

Revision ID: a1b2c3d4e5f6
Revises: 9d4e1f6a2c8b
Create Date: 2026-09-13 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9d4e1f6a2c8b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('coach_profiles', sa.Column('tagline', sa.String(length=200), nullable=True))
    op.add_column('coach_profiles', sa.Column('banner_url', sa.String(length=1024), nullable=True))
    op.add_column(
        'coach_profiles',
        sa.Column('custom_links', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )
    op.add_column(
        'coach_profiles',
        sa.Column('testimonials', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('coach_profiles', 'testimonials')
    op.drop_column('coach_profiles', 'custom_links')
    op.drop_column('coach_profiles', 'banner_url')
    op.drop_column('coach_profiles', 'tagline')
