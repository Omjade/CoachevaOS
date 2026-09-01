"""add short invite code to clients

Revision ID: 4f2c53ca58d2
Revises: a8dd981e70aa
Create Date: 2026-08-15 14:40:24.161105

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '4f2c53ca58d2'
down_revision: Union[str, Sequence[str], None] = 'a8dd981e70aa'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('clients', sa.Column('invite_code', sa.String(length=16), nullable=True))
    op.add_column('clients', sa.Column('invite_expires_at', sa.DateTime(timezone=True), nullable=True))
    op.create_index(op.f('ix_clients_invite_code'), 'clients', ['invite_code'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_clients_invite_code'), table_name='clients')
    op.drop_column('clients', 'invite_expires_at')
    op.drop_column('clients', 'invite_code')
