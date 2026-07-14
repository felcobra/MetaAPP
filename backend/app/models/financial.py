"""
Módulo Financeiro e Contratos
Tabelas: forma_pagamento, conta_bancaria, categoria_transacao,
         cliente, contrato, contrato_pagamento

Arquitetura:
- ON DELETE RESTRICT em todas as FK para garantir integridade financeira
- cliente.cpf_cnpj é único
- 1 projeto_externo → 1 contrato (relacionamento 1:1 via unique constraint)
- contrato → N contrato_pagamento (parcelas)
"""
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import (
    String, Text, Date, DateTime, Numeric, Boolean,
    ForeignKey, UniqueConstraint, Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class FormaPagamento(Base):
    """Dicionário de formas de pagamento (PIX, Boleto, Transferência, etc.)."""
    __tablename__ = "forma_pagamento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class ContaBancaria(Base):
    """Conta bancária da empresa (ex: Cora, Asaas, Banco do Brasil)."""
    __tablename__ = "conta_bancaria"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    banco: Mapped[str | None] = mapped_column(String(100), nullable=True)
    agencia: Mapped[str | None] = mapped_column(String(20), nullable=True)
    numero_conta: Mapped[str | None] = mapped_column(String(30), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class CategoriaTransacao(Base):
    """Categorias financeiras para entradas e saídas."""
    __tablename__ = "categoria_transacao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    tipo: Mapped[str] = mapped_column(
        SAEnum("entrada", "saida", name="categoria_transacao_tipo"),
        nullable=False,
    )
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Cliente(Base):
    """Cadastro oficial de quem fechou negócio (contratante)."""
    __tablename__ = "cliente"
    __table_args__ = (
        UniqueConstraint("external_source", "external_id", name="uq_cliente_external"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    cpf_cnpj: Mapped[str | None] = mapped_column(String(18), unique=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    endereco: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    contratos = relationship("Contrato", back_populates="cliente")


class Contrato(Base):
    """Faturamento do projeto. Um projeto_externo = um contrato."""
    __tablename__ = "contrato"
    __table_args__ = (
        UniqueConstraint("projeto_externo_id", name="uq_contrato_projeto_externo"),
        UniqueConstraint("external_source", "external_id", name="uq_contrato_external"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int] = mapped_column(
        ForeignKey("cliente.id", ondelete="RESTRICT"), nullable=False
    )
    projeto_externo_id: Mapped[int] = mapped_column(
        ForeignKey("projeto_externo.id", ondelete="RESTRICT"), nullable=False
    )
    valor_total: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    fase_atual: Mapped[str | None] = mapped_column(String(100), nullable=True)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    cliente = relationship("Cliente", back_populates="contratos")
    projeto_externo = relationship("ProjetoExterno")
    pagamentos = relationship(
        "ContratoPagamento", back_populates="contrato",
        order_by="ContratoPagamento.data_vencimento"
    )


class ContratoPagamento(Base):
    """Parcela de um contrato (tabela 1:N).
    ON DELETE RESTRICT: não pode deletar contrato com parcelas associadas.
    """
    __tablename__ = "contrato_pagamento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contrato_id: Mapped[int] = mapped_column(
        ForeignKey("contrato.id", ondelete="RESTRICT"), nullable=False
    )
    valor: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False)
    data_vencimento: Mapped[date] = mapped_column(Date, nullable=False)
    data_pagamento: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("pendente", "pago", "atrasado", "cancelado", name="pagamento_status"),
        default="pendente",
        nullable=False,
    )
    forma_pagamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("forma_pagamento.id", ondelete="RESTRICT"), nullable=True
    )
    conta_bancaria_id: Mapped[int | None] = mapped_column(
        ForeignKey("conta_bancaria.id", ondelete="RESTRICT"), nullable=True
    )
    categoria_id: Mapped[int | None] = mapped_column(
        ForeignKey("categoria_transacao.id", ondelete="RESTRICT"), nullable=True
    )
    observacao: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    contrato = relationship("Contrato", back_populates="pagamentos")
    forma_pagamento = relationship("FormaPagamento")
    conta_bancaria = relationship("ContaBancaria")
    categoria = relationship("CategoriaTransacao")
