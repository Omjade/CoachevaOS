"""add phone to clients

Revision ID: 87540a221439
Revises: 0fb56e94d096
Create Date: 2026-08-16 22:00:19.964871

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '87540a221439'
down_revision: Union[str, Sequence[str], None] = '0fb56e94d096'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('clients', sa.Column('phone', sa.String(length=32), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('clients', 'phone')
