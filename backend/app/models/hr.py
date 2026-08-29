"""
Módulo de RH e Gestão Interna
Tabelas: celula, coordenacao, cargo, membro,
         membro_cargo, membro_celula, membro_coordenacao, membro_projeto

Espelha o schema real do banco de produção (banco_de_dados_bd). O banco só
guarda `membro.id/nome/email` — nenhum outro campo de perfil existe lá, então
os campos que o frontend precisa (telefone, foto, data de nascimento etc.)
vivem em `MembroPerfilMetaapp`, uma tabela nova, exclusiva do MetaApp, sem
tocar no banco da empresa.

org_divisao e org_no também são tabelas novas do MetaApp (organograma).
"""
from datetime import datetime, date

from sqlalchemy import (
    String, Text, DateTime, Date, ForeignKey, Integer,
    UniqueConstraint, Boolean,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Celula(Base):
    """Célula organizacional (ex: Gestão de Pessoas, Projetos)."""
    __tablename__ = "celula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    sigla: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Relationships
    membros = relationship("MembroCelula", back_populates="celula")


class Coordenacao(Base):
    """Coordenação (ex: Tecnologia e Desenvolvimento, Comercial), vinculada a uma célula."""
    __tablename__ = "coordenacao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    celula_id: Mapped[int | None] = mapped_column(ForeignKey("celula.id"), nullable=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    sigla: Mapped[str | None] = mapped_column(String(10), nullable=True)

    # Relationships
    celula = relationship("Celula")
    membros = relationship("MembroCoordenacao", back_populates="coordenacao")


class Cargo(Base):
    """Cargo na empresa júnior (ex: Diretor, Assessor, Gerente de Projetos)."""
    __tablename__ = "cargo"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)

    # Relationships
    membros = relationship("MembroCargo", back_populates="cargo")


class Membro(Base):
    """Cadastro único de pessoas da empresa júnior.
    No banco real só existem id/nome/email — ver MembroPerfilMetaapp para os
    campos de perfil estendido usados pelo frontend (Profile, OrgChart, Home).
    """
    __tablename__ = "membro"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)

    # Relationships
    cargos = relationship("MembroCargo", back_populates="membro")
    celulas = relationship("MembroCelula", back_populates="membro")
    coordenacoes = relationship("MembroCoordenacao", back_populates="membro")
    projetos = relationship("MembroProjeto", back_populates="membro")
    perfil = relationship("MembroPerfilMetaapp", back_populates="membro", uselist=False)


class MembroCargo(Base):
    """Associação N:N — membro ↔ cargo."""
    __tablename__ = "membro_cargo"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    cargo_id: Mapped[int] = mapped_column(ForeignKey("cargo.id"), nullable=False)

    # Relationships
    membro = relationship("Membro", back_populates="cargos")
    cargo = relationship("Cargo", back_populates="membros")


class MembroCelula(Base):
    """Associação N:N — membro ↔ célula."""
    __tablename__ = "membro_celula"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    celula_id: Mapped[int] = mapped_column(ForeignKey("celula.id"), nullable=False)

    # Relationships
    membro = relationship("Membro", back_populates="celulas")
    celula = relationship("Celula", back_populates="membros")


class MembroCoordenacao(Base):
    """Associação N:N — membro ↔ coordenação."""
    __tablename__ = "membro_coordenacao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    coordenacao_id: Mapped[int] = mapped_column(ForeignKey("coordenacao.id"), nullable=False)

    # Relationships
    membro = relationship("Membro", back_populates="coordenacoes")
    coordenacao = relationship("Coordenacao", back_populates="membros")


class MembroProjeto(Base):
    """Associação N:N — membro ↔ projeto_externo, com papel e vigência."""
    __tablename__ = "membro_projeto"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(ForeignKey("membro.id"), nullable=False)
    projeto_externo_id: Mapped[int] = mapped_column(ForeignKey("projeto_externo.id"), nullable=False)
    coordenacao_id: Mapped[int | None] = mapped_column(ForeignKey("coordenacao.id"), nullable=True)
    cargo_id: Mapped[int | None] = mapped_column(ForeignKey("cargo.id"), nullable=True)
    data_entrada: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_saida: Mapped[date | None] = mapped_column(Date, nullable=True)

    # Relationships
    membro = relationship("Membro", back_populates="projetos")
    projeto_externo = relationship("ProjetoExterno")
    coordenacao = relationship("Coordenacao")
    cargo = relationship("Cargo")


class MembroPerfilMetaapp(Base):
    """Campos de perfil estendido, exclusivos do MetaApp (não existem no banco
    da empresa). Editáveis pelo próprio membro dentro do app — usados por
    Profile, OrgChart e widgets de Home (aniversariantes, reconhecimentos).
    """
    __tablename__ = "membro_perfil_metaapp"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    membro_id: Mapped[int] = mapped_column(
        ForeignKey("membro.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, unique=True
    )
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    data_entrada: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_nascimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    destaque_texto: Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    status_vinculo: Mapped[str] = mapped_column(String(20), default="ativo", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    membro = relationship("Membro", back_populates="perfil")


class OrgDivisao(Base):
    """Divisão do organograma (ex: Presidência, Diretoria de Projetos).
    Exclusiva do MetaApp. Cada divisão tem sua própria árvore hierárquica de nós.
    """
    __tablename__ = "org_divisao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    nos = relationship("OrgNo", back_populates="divisao",
                       primaryjoin="OrgNo.divisao_id == OrgDivisao.id")


class OrgNo(Base):
    """Nó da árvore hierárquica do organograma. Exclusiva do MetaApp.
    Self-referencing via parent_id. A raiz de cada divisão tem parent_id=None.
    membro_id opcional: nós sem pessoa representam posições/cargos vazios.
    """
    __tablename__ = "org_no"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    divisao_id: Mapped[int] = mapped_column(
        ForeignKey("org_divisao.id", ondelete="CASCADE"), nullable=False
    )
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("org_no.id", ondelete="CASCADE"), nullable=True
    )
    membro_id: Mapped[int | None] = mapped_column(
        ForeignKey("membro.id", ondelete="SET NULL"), nullable=True
    )
    # cargo_id/coordenacao_id: nó de "time" em vez de posição de 1 pessoa.
    # Quando preenchido (em vez de membro_id), a lista de pessoas do nó não é
    # cadastrada aqui — é derivada de quem já tem esse cargo (e essa
    # coordenação, se informada) no RH. Evita recadastro manual e acompanha
    # o RH automaticamente. membro_id e cargo_id são mutuamente exclusivos.
    cargo_id: Mapped[int | None] = mapped_column(
        ForeignKey("cargo.id", ondelete="SET NULL"), nullable=True
    )
    coordenacao_id: Mapped[int | None] = mapped_column(
        ForeignKey("coordenacao.id", ondelete="SET NULL"), nullable=True
    )
    titulo: Mapped[str] = mapped_column(String(200), nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    divisao = relationship("OrgDivisao", back_populates="nos")
    membro = relationship("Membro")
    filhos = relationship(
        "OrgNo",
        back_populates="pai",
        foreign_keys="OrgNo.parent_id",
        cascade="all, delete-orphan",
        order_by="OrgNo.ordem",
    )
    pai = relationship("OrgNo", back_populates="filhos", foreign_keys=[parent_id], remote_side=[id])


class OrgNoMembro(Base):
    """Pessoas adicionadas manualmente a um nó de time. Complementa (não
    substitui) a derivação automática por cargo/coordenação em OrgNo — existe
    para times ad-hoc que não correspondem a nenhum cargo do RH (ex: "Equipe
    de Conteúdo"), onde não tem como derivar a lista automaticamente."""
    __tablename__ = "org_no_membro"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    org_no_id: Mapped[int] = mapped_column(
        ForeignKey("org_no.id", ondelete="CASCADE"), nullable=False
    )
    membro_id: Mapped[int] = mapped_column(
        ForeignKey("membro.id", ondelete="CASCADE"), nullable=False
    )

    __table_args__ = (
        UniqueConstraint("org_no_id", "membro_id", name="uq_org_no_membro"),
    )
