"""add cargo_id/coordenacao_id to org_no (nós de time no organograma)

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-08-09

Nós que representam um time inteiro (ex: "Consultores", "Analistas") em vez
de uma posição de 1 pessoa passam a apontar para um cargo (e opcionalmente
uma coordenação, para refinar). A lista de pessoas do nó é derivada de quem
já tem esse cargo/coordenação no RH — não precisa ser recadastrada nó a nó.
membro_id (posição de 1 pessoa) e cargo_id (time) são mutuamente exclusivos.
Nenhuma tabela existente do banco da empresa é tocada.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "org_no",
        sa.Column("cargo_id", sa.Integer(), nullable=True),
    )
    op.add_column(
        "org_no",
        sa.Column("coordenacao_id", sa.Integer(), nullable=True),
    )
    op.create_foreign_key(
        "fk_org_no_cargo_id", "org_no", "cargo", ["cargo_id"], ["id"], ondelete="SET NULL"
    )
    op.create_foreign_key(
        "fk_org_no_coordenacao_id", "org_no", "coordenacao", ["coordenacao_id"], ["id"], ondelete="SET NULL"
    )


def downgrade() -> None:
    op.drop_constraint("fk_org_no_coordenacao_id", "org_no", type_="foreignkey")
    op.drop_constraint("fk_org_no_cargo_id", "org_no", type_="foreignkey")
    op.drop_column("org_no", "coordenacao_id")
    op.drop_column("org_no", "cargo_id")
