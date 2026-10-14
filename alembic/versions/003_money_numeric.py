"""Store money as exact decimals

Revision ID: 003_money_numeric
Revises: 002_invite_codes
Create Date: 2026-10-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003_money_numeric"
down_revision: Union[str, None] = "002_invite_codes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("units") as batch:
        batch.alter_column("rent_amount", existing_type=sa.Float(), type_=sa.Numeric(12, 2), existing_nullable=False)
    with op.batch_alter_table("payments") as batch:
        batch.alter_column("amount", existing_type=sa.Float(), type_=sa.Numeric(12, 2), existing_nullable=False)


def downgrade() -> None:
    with op.batch_alter_table("payments") as batch:
        batch.alter_column("amount", existing_type=sa.Numeric(12, 2), type_=sa.Float(), existing_nullable=False)
    with op.batch_alter_table("units") as batch:
        batch.alter_column("rent_amount", existing_type=sa.Numeric(12, 2), type_=sa.Float(), existing_nullable=False)
