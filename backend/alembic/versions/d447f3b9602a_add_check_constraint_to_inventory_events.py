"""add_check_constraint_to_inventory_events

Revision ID: d447f3b9602a
Revises: 92f49cdb385f
Create Date: 2026-06-12 07:02:09.034228

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd447f3b9602a'
down_revision: Union[str, Sequence[str], None] = '92f49cdb385f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_check_constraint(
        "check_after_value_non_negative",
        "inventory_events",
        "after_value >= 0"
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "check_after_value_non_negative",
        "inventory_events",
        type_="check"
    )
