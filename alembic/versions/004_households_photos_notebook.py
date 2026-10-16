"""Landlord households, unit photo keys, notebook entries

Revision ID: 004_households_notebook
Revises: 003_money_numeric
Create Date: 2026-10-15 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "004_households_notebook"
down_revision: Union[str, None] = "003_money_numeric"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("users") as batch:
        batch.add_column(sa.Column("full_name", sa.String(length=255), nullable=True))
        batch.add_column(sa.Column("phone", sa.String(length=50), nullable=True))

    with op.batch_alter_table("units") as batch:
        batch.add_column(sa.Column("photo_key", sa.String(length=255), nullable=True))

    with op.batch_alter_table("properties") as batch:
        batch.add_column(sa.Column("owner_id", sa.Integer(), nullable=True))

    op.execute(
        "UPDATE properties SET owner_id = (SELECT MIN(id) FROM users WHERE role = 'ADMIN') WHERE owner_id IS NULL"
    )

    with op.batch_alter_table("properties") as batch:
        batch.alter_column("owner_id", existing_type=sa.Integer(), nullable=False)
        batch.create_foreign_key("fk_properties_owner_id_users", "users", ["owner_id"], ["id"], ondelete="RESTRICT")
        batch.create_index("ix_properties_owner_id", ["owner_id"], unique=False)

    op.create_table(
        "entries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("property_id", sa.Integer(), nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=True),
        sa.Column("kind", sa.String(length=10), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("category", sa.String(length=50), nullable=True),
        sa.Column("entry_date", sa.Date(), nullable=False),
        sa.Column("target_date", sa.Date(), nullable=True),
        sa.Column("done", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_entries_id"), "entries", ["id"], unique=False)
    op.create_index(op.f("ix_entries_property_id"), "entries", ["property_id"], unique=False)
    op.create_index(op.f("ix_entries_unit_id"), "entries", ["unit_id"], unique=False)


def downgrade() -> None:
    op.drop_table("entries")
    with op.batch_alter_table("properties") as batch:
        batch.drop_index("ix_properties_owner_id")
        batch.drop_constraint("fk_properties_owner_id_users", type_="foreignkey")
        batch.drop_column("owner_id")
    with op.batch_alter_table("units") as batch:
        batch.drop_column("photo_key")
    with op.batch_alter_table("users") as batch:
        batch.drop_column("phone")
        batch.drop_column("full_name")
