"""add portal code to clients

Revision ID: 0fb56e94d096
Revises: 4f2c53ca58d2
Create Date: 2026-08-15 14:45:45.788178

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0fb56e94d096'
down_revision: Union[str, Sequence[str], None] = '4f2c53ca58d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('clients', sa.Column('portal_code', sa.String(length=16), nullable=True))
    op.create_index(op.f('ix_clients_portal_code'), 'clients', ['portal_code'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_clients_portal_code'), table_name='clients')
    op.drop_column('clients', 'portal_code')
