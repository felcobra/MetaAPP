"""
Módulo de Autenticação — Tokens Revogados
Tabela: revoked_tokens

Arquitetura:
- Armazena JTIs (JWT ID) de refresh tokens invalidados via logout
- Limpeza automática pode ser feita via cron job filtrando expired_at < now()
- ON DELETE não aplicável — tabela de log append-only
"""
from datetime import datetime

from sqlalchemy import String, DateTime, ForeignKey, Index
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


class PasswordResetToken(Base):
    """Token de redefinição de senha enviado por e-mail.

    Guarda o SHA-256 do token, nunca o token em si: quem obtiver uma cópia do
    banco não consegue redefinir senha de ninguém, porque o hash não volta.
    Mesmo raciocínio de nunca guardar senha em claro.
    """
    __tablename__ = "password_reset_token"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    # Preenchido no momento do uso: garante que o link valha uma vez só.
    used_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
