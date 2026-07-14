"""
Módulo de Acompanhamento de Projetos (Health Check)
Tabelas: projeto_externo, acompanhamento_projeto,
         acomp_impedimento, acomp_orientador, acomp_sprint

Arquitetura:
- projeto_externo é a entidade central para contratos, acompanhamentos e membros
- CHECK constraints garantem notas entre 1 e 5
- Tabelas satélites usam ON DELETE CASCADE (deletar acompanhamento limpa filhas)
- Campo JSON dados_iniciais_adicionais para comentários estruturados
"""
from datetime import datetime
from typing import Any

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Integer, JSON,
    CheckConstraint, UniqueConstraint, Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ProjetoExterno(Base):
    """Entidade central: projeto captado externamente (via Pipefy ou contrato).
    Conecta: contrato, acompanhamento_projeto, membro_projeto.
    """
    __tablename__ = "projeto_externo"
    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_projeto_externo_external"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    acompanhamentos = relationship("AcompanhamentoProjeto", back_populates="projeto_externo")


class AcompanhamentoProjeto(Base):
    """Avaliação de saúde do projeto (health check periódico).
    Notas de 1 a 5 protegidas por CHECK constraints.
    """
    __tablename__ = "acompanhamento_projeto"
    __table_args__ = (
        CheckConstraint("capacitacao_equipe BETWEEN 1 AND 5",  name="ck_capacitacao_equipe"),
        CheckConstraint("nivel_retrabalho BETWEEN 1 AND 5",    name="ck_nivel_retrabalho"),
        CheckConstraint("comunicacao_cliente BETWEEN 1 AND 5", name="ck_comunicacao_cliente"),
        CheckConstraint("gestao_riscos BETWEEN 1 AND 5",       name="ck_gestao_riscos"),
        CheckConstraint("qualidade_entrega BETWEEN 1 AND 5",   name="ck_qualidade_entrega"),
        CheckConstraint("satisfacao_geral BETWEEN 1 AND 5",    name="ck_satisfacao_geral"),
        UniqueConstraint("external_source", "external_id",     name="uq_acomp_external"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    projeto_externo_id: Mapped[int] = mapped_column(
        ForeignKey("projeto_externo.id"), nullable=False, index=True
    )
    data_avaliacao: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    # Notas 1–5 (CHECK constraints acima)
    capacitacao_equipe: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nivel_retrabalho: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comunicacao_cliente: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gestao_riscos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    qualidade_entrega: Mapped[int | None] = mapped_column(Integer, nullable=True)
    satisfacao_geral: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Comentários e dados extras em JSON estruturado
    dados_iniciais_adicionais: Mapped[Any | None] = mapped_column(JSON, nullable=True)

    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships (satélites com CASCADE)
    projeto_externo = relationship("ProjetoExterno", back_populates="acompanhamentos")
    impedimentos = relationship(
        "AcompImpedimento", back_populates="acompanhamento",
        cascade="all, delete-orphan"
    )
    orientador = relationship(
        "AcompOrientador", back_populates="acompanhamento",
        cascade="all, delete-orphan", uselist=False
    )
    sprints = relationship(
        "AcompSprint", back_populates="acompanhamento",
        cascade="all, delete-orphan",
        order_by="AcompSprint.numero_sprint"
    )


class AcompImpedimento(Base):
    """Lista de impedimentos vinculados a um acompanhamento (1:N, CASCADE)."""
    __tablename__ = "acomp_impedimento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acompanhamento_id: Mapped[int] = mapped_column(
        ForeignKey("acompanhamento_projeto.id", ondelete="CASCADE"), nullable=False
    )
    descricao: Mapped[str] = mapped_column(Text, nullable=False)
    tipo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resolvido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    acompanhamento = relationship("AcompanhamentoProjeto", back_populates="impedimentos")


class AcompOrientador(Base):
    """Avaliação do professor/orientador do projeto (1:1, CASCADE).
    unique=True no FK garante o relacionamento 1:1 com acompanhamento.
    """
    __tablename__ = "acomp_orientador"
    __table_args__ = (
        CheckConstraint("nota BETWEEN 1 AND 5", name="ck_orientador_nota"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acompanhamento_id: Mapped[int] = mapped_column(
        ForeignKey("acompanhamento_projeto.id", ondelete="CASCADE"),
        nullable=False, unique=True
    )
    nome_orientador: Mapped[str | None] = mapped_column(String(255), nullable=True)
    nota: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comentario: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    acompanhamento = relationship("AcompanhamentoProjeto", back_populates="orientador")


class AcompSprint(Base):
    """Status da sprint atual do projeto (1:N, CASCADE)."""
    __tablename__ = "acomp_sprint"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acompanhamento_id: Mapped[int] = mapped_column(
        ForeignKey("acompanhamento_projeto.id", ondelete="CASCADE"), nullable=False
    )
    numero_sprint: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str | None] = mapped_column(String(100), nullable=True)
    objetivo: Mapped[str | None] = mapped_column(Text, nullable=True)
    concluido: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    acompanhamento = relationship("AcompanhamentoProjeto", back_populates="sprints")
