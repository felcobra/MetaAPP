"""add password_reset_token

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-07

Tabela nova, exclusiva do MetaApp, para o fluxo de "esqueci minha senha".
Nenhuma tabela existente do banco da empresa é tocada.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "password_reset_token",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        # SHA-256 em hex: 64 caracteres. Guardamos o hash, nunca o token.
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("used_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_password_reset_token_id", "password_reset_token", ["id"])
    op.create_index("ix_password_reset_token_user_id", "password_reset_token", ["user_id"])
    op.create_index(
        "ix_password_reset_token_token_hash", "password_reset_token", ["token_hash"], unique=True
    )


def downgrade() -> None:
    op.drop_table("password_reset_token")
