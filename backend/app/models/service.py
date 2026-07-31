"""
Módulo de Portfólio — Serviços por Coordenação
Tabelas: servico, projeto_servico

Espelha o schema real do banco de produção (banco_de_dados_bd), conferido
via information_schema em 2026-07-31.
"""
from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Servico(Base):
    """Serviço técnico oferecido por uma coordenação.
    Exemplos: 'Autovistoria Predial' (CE), 'Análise de Mercado' (GN).
    """
    __tablename__ = "servico"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    coordenacao_id: Mapped[int | None] = mapped_column(
        ForeignKey("coordenacao.id"), nullable=True, index=True
    )
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    sigla: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Relationships
    coordenacao = relationship("Coordenacao")


class ProjetoServico(Base):
    """Associação N:N — projeto_externo ↔ servico."""
    __tablename__ = "projeto_servico"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    projeto_externo_id: Mapped[int] = mapped_column(
        ForeignKey("projeto_externo.id"), nullable=False
    )
    servico_id: Mapped[int] = mapped_column(ForeignKey("servico.id"), nullable=False)

    # Relationships
    projeto_externo = relationship("ProjetoExterno")
    servico = relationship("Servico")
