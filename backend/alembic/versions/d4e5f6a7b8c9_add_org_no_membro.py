"""add org_no_membro (pessoas manuais de um nó de time)

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-08-10

Times ad-hoc (ex: "Equipe de Conteúdo") não correspondem a nenhum cargo do
RH, então a derivação automática por cargo/coordenação (org_no.cargo_id) não
tem como capturá-los. Essa tabela deixa adicionar pessoas manualmente a um
nó de time — complementa, não substitui, a derivação automática.
Nenhuma tabela existente do banco da empresa é tocada.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "org_no_membro",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "org_no_id", sa.Integer(),
            sa.ForeignKey("org_no.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "membro_id", sa.Integer(),
            sa.ForeignKey("membro.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.UniqueConstraint("org_no_id", "membro_id", name="uq_org_no_membro"),
    )
    op.create_index("ix_org_no_membro_org_no_id", "org_no_membro", ["org_no_id"])


def downgrade() -> None:
    op.drop_index("ix_org_no_membro_org_no_id", table_name="org_no_membro")
    op.drop_table("org_no_membro")
