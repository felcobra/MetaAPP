"""
Módulo Comercial (CRM e Leads)
Tabelas: dim_lead_origem, dim_motivo_perda, leads, oportunidade, oportunidade_phase_history

Espelha o schema real do banco de produção (banco_de_dados_bd), conferido
via information_schema em 2026-07-31.
"""
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    String, DateTime, ForeignKey, Numeric, BigInteger,
    Boolean, Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class DimLeadOrigem(Base):
    """Tabela de dimensão: origens padronizadas de leads (ex: Indicação, Pipefy)."""
    __tablename__ = "dim_lead_origem"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    raw_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    canonical_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_field: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class DimMotivoPerdida(Base):
    """Tabela de dimensão: motivos de perda de oportunidade."""
    __tablename__ = "dim_motivo_perda"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    raw_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    canonical_value: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_field: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class Lead(Base):
    """Contato comercial puro (pessoa/empresa)."""
    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    empresa: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cargo: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    oportunidades = relationship("Oportunidade", back_populates="lead")


class Oportunidade(Base):
    """Negociação com um lead — coração do CRM."""
    __tablename__ = "oportunidade"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lead_id: Mapped[int | None] = mapped_column(ForeignKey("leads.id"), nullable=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("cliente.id"), nullable=True)
    fase_atual_nome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    fase_atual_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    responsaveis: Mapped[str | None] = mapped_column(String(500), nullable=True)
    valor_fechado: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    origem_id: Mapped[int | None] = mapped_column(ForeignKey("dim_lead_origem.id"), nullable=True)
    motivo_perda_id: Mapped[int | None] = mapped_column(
        ForeignKey("dim_motivo_perda.id"), nullable=True
    )
    coordenacao_id: Mapped[int | None] = mapped_column(ForeignKey("coordenacao.id"), nullable=True)
    status_terminal: Mapped[str] = mapped_column(
        SAEnum("ativo", "fechado", "desistido", "recusado", "postergado",
               name="oportunidade_status_terminal"),
        default="ativo",
        nullable=False,
    )
    criado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finalizado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    lead = relationship("Lead", back_populates="oportunidades")
    cliente = relationship("Cliente")
    origem = relationship("DimLeadOrigem")
    coordenacao = relationship("Coordenacao")
    motivo_perda = relationship("DimMotivoPerdida")
    phase_history = relationship(
        "OportunidadePhaseHistory", back_populates="oportunidade",
        order_by="OportunidadePhaseHistory.moved_at",
    )


class OportunidadePhaseHistory(Base):
    """Log append-only de mudanças de fase de uma oportunidade.
    Útil para cálculo de SLA e tempo em cada etapa do funil.
    Nunca deve ser deletado/atualizado — apenas inserido.
    """
    __tablename__ = "oportunidade_phase_history"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    oportunidade_id: Mapped[int] = mapped_column(
        ForeignKey("oportunidade.id"), nullable=False
    )
    from_phase_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    from_phase_nome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    to_phase_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    to_phase_nome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    moved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    moved_by: Mapped[str | None] = mapped_column(String(200), nullable=True)
    duration_previous_phase_seconds: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    external_event_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    oportunidade = relationship("Oportunidade", back_populates="phase_history")
