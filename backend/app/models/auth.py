"""
Módulo de Autenticação — Tokens Revogados
Tabela: revoked_tokens

Arquitetura:
- Armazena JTIs (JWT ID) de refresh tokens invalidados via logout
- Limpeza automática pode ser feita via cron job filtrando expired_at < now()
- ON DELETE não aplicável — tabela de log append-only
"""
from datetime import datetime

from sqlalchemy import String, DateTime, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.core.database import Base


class RevokedToken(Base):
    """JTI de refresh tokens invalidados (logout explícito).
    Entries são consultadas em cada requisição de refresh para garantir
    que tokens revogados não sejam reutilizados.
    """
    __tablename__ = "revoked_tokens"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    jti: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(nullable=False, index=True)
    revoked_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    expired_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # para limpeza futura
