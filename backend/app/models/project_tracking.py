"""
Módulo de Acompanhamento de Projetos (Health Check)
Tabelas: projeto_externo, acompanhamento_projeto,
         acomp_impedimento, acomp_orientador, acomp_sprint

Espelha o schema real do banco de produção (banco_de_dados_bd), conferido
via information_schema em 2026-07-31.
"""
from datetime import datetime, date
from typing import Any

from sqlalchemy import (
    String, Text, DateTime, Date, ForeignKey, Integer, JSON, Boolean,
    Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProjetoExterno(Base):
    """Entidade central: projeto captado externamente (via Pipefy ou contrato).
    Conecta: contrato, acompanhamento_projeto, membro_projeto.
    """
    __tablename__ = "projeto_externo"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    descricao_projeto: Mapped[str | None] = mapped_column(String(500), nullable=True)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    possui_orientador: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    nome_orientador: Mapped[str | None] = mapped_column(String(150), nullable=True)
    status: Mapped[str | None] = mapped_column(
        SAEnum("ativo", "finalizado", "pausado", name="projeto_externo_status"),
        nullable=True,
    )
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    acompanhamentos = relationship("AcompanhamentoProjeto", back_populates="projeto_externo")


class AcompanhamentoProjeto(Base):
    """Avaliação de saúde do projeto (health check periódico)."""
    __tablename__ = "acompanhamento_projeto"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    projeto_externo_id: Mapped[int | None] = mapped_column(
        ForeignKey("projeto_externo.id"), nullable=True, index=True
    )
    contrato_id: Mapped[int | None] = mapped_column(ForeignKey("contrato.id"), nullable=True)
    data_resposta: Mapped[date | None] = mapped_column(Date, nullable=True)
    modelo_gerenciamento: Mapped[str | None] = mapped_column(
        SAEnum("Tradicional", "Agil", "Hibrido", name="acomp_modelo_gerenciamento"),
        nullable=True,
    )
    pct_conclusao: Mapped[str | None] = mapped_column(
        SAEnum("0-20%", "21-40%", "41-60%", "61-80%", "81-100%", name="acomp_pct_conclusao"),
        nullable=True,
    )
    status_cronograma: Mapped[str | None] = mapped_column(
        SAEnum("Dentro do prazo", "Com risco de atraso", "Atrasado", "Concluido",
               name="acomp_status_cronograma"),
        nullable=True,
    )
    motivos_atraso: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Notas 1–5
    capacitacao_equipe: Mapped[int | None] = mapped_column(Integer, nullable=True)
    eficacia_metodologia: Mapped[int | None] = mapped_column(Integer, nullable=True)
    nivel_retrabalho: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comunicacao_cliente: Mapped[int | None] = mapped_column(Integer, nullable=True)
    suficiencia_orcamento: Mapped[int | None] = mapped_column(Integer, nullable=True)
    orcamento_nao_necessario: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    primeira_resposta: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    cliente_percebeu_valor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pct_marcos_prazo: Mapped[str | None] = mapped_column(String(20), nullable=True)
    variacao_escopo: Mapped[int | None] = mapped_column(Integer, nullable=True)
    impacto_cliente: Mapped[str | None] = mapped_column(String(50), nullable=True)
    abertura_cliente: Mapped[int | None] = mapped_column(Integer, nullable=True)
    satisfacao_cliente: Mapped[int | None] = mapped_column(Integer, nullable=True)
    suficiencia_orcamento_nota: Mapped[int | None] = mapped_column(Integer, nullable=True)

    dados_iniciais_adicionais: Mapped[Any | None] = mapped_column(JSON, nullable=True)

    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships (satélites com CASCADE)
    projeto_externo = relationship("ProjetoExterno", back_populates="acompanhamentos")
    contrato = relationship("Contrato")
    impedimentos = relationship(
        "AcompImpedimento", back_populates="acompanhamento",
        cascade="all, delete-orphan",
    )
    orientador = relationship(
        "AcompOrientador", back_populates="acompanhamento",
        cascade="all, delete-orphan", uselist=False,
    )
    sprints = relationship(
        "AcompSprint", back_populates="acompanhamento",
        cascade="all, delete-orphan",
    )


class AcompImpedimento(Base):
    """Impedimentos relatados no acompanhamento (1:1 hoje, CASCADE)."""
    __tablename__ = "acomp_impedimento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acompanhamento_id: Mapped[int] = mapped_column(
        ForeignKey("acompanhamento_projeto.id", ondelete="CASCADE"), nullable=False
    )
    houve_impedimentos: Mapped[bool] = mapped_column(Boolean, nullable=False)
    tipo_impedimento: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Relationships
    acompanhamento = relationship("AcompanhamentoProjeto", back_populates="impedimentos")


class AcompOrientador(Base):
    """Avaliação do orientador do projeto (1:1, CASCADE)."""
    __tablename__ = "acomp_orientador"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acompanhamento_id: Mapped[int] = mapped_column(
        ForeignKey("acompanhamento_projeto.id", ondelete="CASCADE"), nullable=False
    )
    possui_orientador: Mapped[bool] = mapped_column(Boolean, nullable=False)
    nome_orientador: Mapped[str | None] = mapped_column(String(150), nullable=True)
    efetividade_orientador: Mapped[int | None] = mapped_column(Integer, nullable=True)
    disponibilidade_orientador: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Relationships
    acompanhamento = relationship("AcompanhamentoProjeto", back_populates="orientador")


class AcompSprint(Base):
    """Percentual de story points concluídos na sprint atual (1:1, CASCADE)."""
    __tablename__ = "acomp_sprint"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    acompanhamento_id: Mapped[int] = mapped_column(
        ForeignKey("acompanhamento_projeto.id", ondelete="CASCADE"), nullable=False
    )
    pct_story_points: Mapped[str | None] = mapped_column(
        SAEnum("0-20%", "21-40%", "41-60%", "61-80%", "81-100%", name="acomp_pct_story_points"),
        nullable=True,
    )

    # Relationships
    acompanhamento = relationship("AcompanhamentoProjeto", back_populates="sprints")
