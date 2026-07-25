"""
Módulo de Portfólio — Serviços por Coordenação
Tabela: servico

Arquitetura:
- Cada serviço pertence a uma Coordenação (CE, GN, OP, DM, TD)
- Campo `icone` armazena o nome do ícone Lucide (string) para o frontend renderizar
"""
from datetime import datetime

from sqlalchemy import String, Text, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Servico(Base):
    """Serviço técnico oferecido por uma coordenação.
    Exemplos: 'Autovistoria Predial' (CE), 'Análise de Mercado' (GN).
    """
    __tablename__ = "servico"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    coordenacao_id: Mapped[int] = mapped_column(
        ForeignKey("coordenacao.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nome: Mapped[str] = mapped_column(String(200), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    icone: Mapped[str | None] = mapped_column(String(100), nullable=True)  # nome do ícone Lucide
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    coordenacao = relationship("Coordenacao")
