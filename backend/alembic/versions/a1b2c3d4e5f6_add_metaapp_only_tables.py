"""add metaapp-only tables

Revision ID: a1b2c3d4e5f6
Revises:
Create Date: 2026-07-31

Cria SOMENTE as tabelas que o MetaApp precisa e que não existem no banco de
produção real da empresa (banco_de_dados_bd): autenticação, organograma,
formulários e o perfil estendido de membro. Escrita manualmente (sem
autogenerate) porque o ambiente de desenvolvimento não tem acesso de rede ao
host do banco — cada CREATE TABLE abaixo foi conferido 1:1 contra os models
em app/models/{user,auth,hr,forms}.py.

Nenhuma tabela existente do banco real (as 27 tabelas de negócio: membro,
cliente, contrato, oportunidade, etc.) é criada, alterada ou removida por
esta migration.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ---------- Autenticação ----------
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column(
            "role", sa.Enum("admin", "director", "member", name="user_role"),
            nullable=False, server_default="member",
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    op.create_table(
        "revoked_tokens",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("jti", sa.String(64), nullable=False, unique=True, index=True),
        sa.Column("user_id", sa.Integer(), nullable=False, index=True),
        sa.Column("revoked_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("expired_at", sa.DateTime(), nullable=False),
    )

    # ---------- Perfil estendido de membro (exclusivo do MetaApp) ----------
    op.create_table(
        "membro_perfil_metaapp",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "membro_id", sa.Integer(),
            sa.ForeignKey("membro.id", ondelete="CASCADE"), nullable=False, unique=True,
        ),
        sa.Column(
            "user_id", sa.Integer(),
            sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True,
        ),
        sa.Column("telefone", sa.String(30), nullable=True),
        sa.Column("data_entrada", sa.Date(), nullable=True),
        sa.Column("data_nascimento", sa.Date(), nullable=True),
        sa.Column("foto_url", sa.String(500), nullable=True),
        sa.Column("destaque_texto", sa.Text(), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # ---------- Organograma (exclusivo do MetaApp) ----------
    op.create_table(
        "org_divisao",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("nome", sa.String(100), nullable=False, unique=True),
        sa.Column("slug", sa.String(50), nullable=False, unique=True),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "org_no",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "divisao_id", sa.Integer(),
            sa.ForeignKey("org_divisao.id", ondelete="CASCADE"), nullable=False,
        ),
        sa.Column(
            "parent_id", sa.Integer(),
            sa.ForeignKey("org_no.id", ondelete="CASCADE"), nullable=True,
        ),
        sa.Column(
            "membro_id", sa.Integer(),
            sa.ForeignKey("membro.id", ondelete="SET NULL"), nullable=True,
        ),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # ---------- Formulários dinâmicos (PAPE, exclusivo do MetaApp) ----------
    op.create_table(
        "form_template",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("subtitulo", sa.String(300), nullable=True),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column(
            "frequencia",
            sa.Enum("QUINZENAL", "MENSAL", "SEMANAL", name="form_frequencia"),
            nullable=False,
        ),
        sa.Column("duracao_estimada", sa.String(50), nullable=True),
        sa.Column("publico_alvo", sa.String(200), nullable=True),
        sa.Column("ativo", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "form_step",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "template_id", sa.Integer(),
            sa.ForeignKey("form_template.id", ondelete="CASCADE"), nullable=False, index=True,
        ),
        sa.Column("index", sa.Integer(), nullable=False),
        sa.Column("section_label", sa.String(100), nullable=True),
        sa.Column("titulo", sa.String(200), nullable=False),
        sa.Column("descricao", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "form_field",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "step_id", sa.Integer(),
            sa.ForeignKey("form_step.id", ondelete="CASCADE"), nullable=False, index=True,
        ),
        sa.Column(
            "tipo",
            sa.Enum("date", "text", "textarea", "radio", name="form_field_tipo"),
            nullable=False,
        ),
        sa.Column("label", sa.Text(), nullable=False),
        sa.Column("required", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("helper", sa.String(300), nullable=True),
        sa.Column("placeholder", sa.String(300), nullable=True),
        sa.Column("max_length", sa.Integer(), nullable=True),
        sa.Column("options", sa.JSON(), nullable=True),
        sa.Column("ordem", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "form_submission",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "template_id", sa.Integer(),
            sa.ForeignKey("form_template.id", ondelete="RESTRICT"), nullable=False, index=True,
        ),
        sa.Column(
            "membro_id", sa.Integer(),
            sa.ForeignKey("membro.id", ondelete="RESTRICT"), nullable=False, index=True,
        ),
        sa.Column(
            "projeto_externo_id", sa.Integer(),
            sa.ForeignKey("projeto_externo.id", ondelete="SET NULL"), nullable=True,
        ),
        sa.Column("ciclo", sa.String(20), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pendente", "em-andamento", "concluido", name="submission_status"),
            nullable=False, server_default="pendente",
        ),
        sa.Column("progresso", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("data_submissao", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint("template_id", "membro_id", "ciclo", name="uq_submission_ciclo"),
    )

    op.create_table(
        "form_answer",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "submission_id", sa.Integer(),
            sa.ForeignKey("form_submission.id", ondelete="CASCADE"), nullable=False, index=True,
        ),
        sa.Column(
            "field_id", sa.Integer(),
            sa.ForeignKey("form_field.id", ondelete="RESTRICT"), nullable=False,
        ),
        sa.Column("valor", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint("submission_id", "field_id", name="uq_answer_field"),
    )


def downgrade() -> None:
    op.drop_table("form_answer")
    op.drop_table("form_submission")
    op.drop_table("form_field")
    op.drop_table("form_step")
    op.drop_table("form_template")
    op.drop_table("org_no")
    op.drop_table("org_divisao")
    op.drop_table("membro_perfil_metaapp")
    op.drop_table("revoked_tokens")
    op.drop_table("users")
