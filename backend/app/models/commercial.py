"""
Módulo Comercial (CRM e Leads)
Tabelas: dim_lead_origem, dim_motivo_perda, leads, oportunidade, oportunidade_phase_history

Arquitetura:
- Todas as entidades principais possuem external_source + external_id (integração Pipefy/ETL)
- ON DELETE RESTRICT nas FK comerciais para integridade
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Numeric,
    UniqueConstraint, Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class DimLeadOrigem(Base):
    """Tabela de dimensão: origens padronizadas de leads (ex: Indicação, Pipefy)."""
    __tablename__ = "dim_lead_origem"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class DimMotivoPerdida(Base):
    """Tabela de dimensão: motivos de perda de oportunidade."""
    __tablename__ = "dim_motivo_perda"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Lead(Base):
    """Contato comercial puro (pessoa/empresa)."""
    __tablename__ = "leads"
    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_lead_external"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    empresa: Mapped[str | None] = mapped_column(String(255), nullable=True)
    origem_id: Mapped[int | None] = mapped_column(
        ForeignKey("dim_lead_origem.id", ondelete="RESTRICT"), nullable=True
    )
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)  # ex: "pipefy"
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    origem = relationship("DimLeadOrigem")
    oportunidades = relationship("Oportunidade", back_populates="lead")


class Oportunidade(Base):
    """Negociação com um lead — coração do CRM."""
    __tablename__ = "oportunidade"
    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_oportunidade_external"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lead_id: Mapped[int] = mapped_column(
        ForeignKey("leads.id", ondelete="RESTRICT"), nullable=False
    )
    valor: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("ativo", "fechado", "desistido", "postergado", name="oportunidade_status"),
        default="ativo",
        nullable=False,
    )
    fase_atual: Mapped[str | None] = mapped_column(String(100), nullable=True)
    origem_id: Mapped[int | None] = mapped_column(
        ForeignKey("dim_lead_origem.id", ondelete="RESTRICT"), nullable=True
    )
    motivo_perda_id: Mapped[int | None] = mapped_column(
        ForeignKey("dim_motivo_perda.id", ondelete="RESTRICT"), nullable=True
    )
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    lead = relationship("Lead", back_populates="oportunidades")
    origem = relationship("DimLeadOrigem")
    motivo_perda = relationship("DimMotivoPerdida")
    phase_history = relationship(
        "OportunidadePhaseHistory", back_populates="oportunidade",
        order_by="OportunidadePhaseHistory.mudado_em"
    )


class OportunidadePhaseHistory(Base):
    """Log append-only de mudanças de fase de uma oportunidade.
    Útil para cálculo de SLA e tempo em cada etapa do funil.
    Nunca deve ser deletado/atualizado — apenas inserido.
    """
    __tablename__ = "oportunidade_phase_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    oportunidade_id: Mapped[int] = mapped_column(
        ForeignKey("oportunidade.id", ondelete="RESTRICT"), nullable=False
    )
    fase_anterior: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fase_nova: Mapped[str] = mapped_column(String(100), nullable=False)
    mudado_em: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)

    # Relationships
    oportunidade = relationship("Oportunidade", back_populates="phase_history")
