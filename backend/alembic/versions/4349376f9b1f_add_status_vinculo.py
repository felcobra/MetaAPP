"""add_status_vinculo

Revision ID: 4349376f9b1f
Revises: d4e5f6a7b8c9
Create Date: 2026-08-28 16:47:42.368828

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '4349376f9b1f'
down_revision: Union[str, None] = 'd4e5f6a7b8c9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('membro_perfil_metaapp', sa.Column('status_vinculo', sa.String(length=20), server_default='ativo', nullable=False))


def downgrade() -> None:
    op.drop_column('membro_perfil_metaapp', 'status_vinculo')
