"""
Módulo de RH e Gestão Interna
Tabelas: celula, coordenacao, cargo, membro,
         membro_cargo, membro_celula, membro_coordenacao, membro_projeto

Arquitetura:
- membro é o cadastro único de pessoas da empresa (pode ser vinculado a users para login)
- Tabelas associativas N:N possuem UNIQUE KEY composta para evitar duplicidade
- membro_projeto referencia projeto_externo (módulo de acompanhamento)
"""
from datetime import datetime

from sqlalchemy import (
    String, Text, DateTime, ForeignKey,
    UniqueConstraint, Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Celula(Base):
    """Célula organizacional (ex: Gestão de Pessoas, Projetos)."""
    __tablename__ = "celula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membros = relationship("MembroCelula", back_populates="celula")


class Coordenacao(Base):
    """Coordenação (ex: Tecnologia e Desenvolvimento, Comercial)."""
    __tablename__ = "coordenacao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membros = relationship("MembroCoordenacao", back_populates="coordenacao")


class Cargo(Base):
    """Cargo na empresa júnior (ex: Diretor, Assessor, Gerente de Projetos)."""
    __tablename__ = "cargo"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membros = relationship("MembroCargo", back_populates="cargo")


class Membro(Base):
    """Cadastro único de pessoas da empresa júnior.
    Pode ser opcionalmente vinculado a um User (para acesso ao sistema).
    """
    __tablename__ = "membro"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    # Vínculo opcional com o usuário de autenticação
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    cargos = relationship("MembroCargo", back_populates="membro")
    celulas = relationship("MembroCelula", back_populates="membro")
    coordenacoes = relationship("MembroCoordenacao", back_populates="membro")
    projetos = relationship("MembroProjeto", back_populates="membro")


class MembroCargo(Base):
    """Associação N:N — membro ↔ cargo.
    UNIQUE(membro_id, cargo_id): um membro não pode ter o mesmo cargo duplicado.
    """
    __tablename__ = "membro_cargo"
    __table_args__ = (
        UniqueConstraint("membro_id", "cargo_id", name="uq_membro_cargo"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    cargo_id: Mapped[int] = mapped_column(ForeignKey("cargo.id"), nullable=False)
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membro = relationship("Membro", back_populates="cargos")
    cargo = relationship("Cargo", back_populates="membros")


class MembroCelula(Base):
    """Associação N:N — membro ↔ célula.
    UNIQUE(membro_id, celula_id): evita alocação duplicada.
    """
    __tablename__ = "membro_celula"
    __table_args__ = (
        UniqueConstraint("membro_id", "celula_id", name="uq_membro_celula"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    celula_id: Mapped[int] = mapped_column(ForeignKey("celula.id"), nullable=False)
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membro = relationship("Membro", back_populates="celulas")
    celula = relationship("Celula", back_populates="membros")


class MembroCoordenacao(Base):
    """Associação N:N — membro ↔ coordenação.
    UNIQUE(membro_id, coordenacao_id): evita alocação duplicada.
    """
    __tablename__ = "membro_coordenacao"
    __table_args__ = (
        UniqueConstraint("membro_id", "coordenacao_id", name="uq_membro_coordenacao"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    coordenacao_id: Mapped[int] = mapped_column(ForeignKey("coordenacao.id"), nullable=False)
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membro = relationship("Membro", back_populates="coordenacoes")
    coordenacao = relationship("Coordenacao", back_populates="membros")


class MembroProjeto(Base):
    """Associação N:N — membro ↔ projeto_externo.
    UNIQUE(membro_id, projeto_externo_id): evita alocação duplicada no mesmo projeto.
    """
    __tablename__ = "membro_projeto"
    __table_args__ = (
        UniqueConstraint("membro_id", "projeto_externo_id", name="uq_membro_projeto"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    projeto_externo_id: Mapped[int] = mapped_column(ForeignKey("projeto_externo.id"), nullable=False)
    papel: Mapped[str | None] = mapped_column(String(100), nullable=True)  # ex: "Gerente de Projetos"
    data_inicio: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    data_fim: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    membro = relationship("Membro", back_populates="projetos")
    projeto_externo = relationship("ProjetoExterno")
