"""
Módulo Financeiro e Contratos
Tabelas: forma_pagamento, conta_bancaria, categoria_transacao,
         cliente, contrato, contrato_pagamento, transacao

Os campos abaixo espelham exatamente o schema real do banco de produção
(banco_de_dados_bd no EasyPanel), conferido via information_schema em 2026-07-31.
Não alterar nomes/tipos sem antes conferir o banco real — ele é gerenciado
por outro sistema (MetaConsultoria-DeV/Backend) e não pode ser migrado.
"""
from datetime import datetime, date
from decimal import Decimal

from sqlalchemy import (
    String, Text, Date, DateTime, Numeric, Boolean, Integer,
    ForeignKey, Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FormaPagamento(Base):
    """Dicionário de formas de pagamento (PIX, Boleto, Transferência, etc.)."""
    __tablename__ = "forma_pagamento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)


class ContaBancaria(Base):
    """Conta bancária/meio de recebimento da empresa."""
    __tablename__ = "conta_bancaria"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo: Mapped[str] = mapped_column(
        SAEnum("banco", "pix", "dinheiro", "outro", name="conta_bancaria_tipo"),
        nullable=False,
    )
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class CategoriaTransacao(Base):
    """Categorias financeiras para entradas e saídas, por célula."""
    __tablename__ = "categoria_transacao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    tipo: Mapped[str] = mapped_column(
        SAEnum("entrada", "saida", "ambos", name="categoria_transacao_tipo"),
        nullable=False,
    )
    celula_id: Mapped[int | None] = mapped_column(ForeignKey("celula.id"), nullable=True)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    celula = relationship("Celula")


class Cliente(Base):
    """Cadastro oficial de quem fechou negócio (contratante)."""
    __tablename__ = "cliente"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    nome: Mapped[str] = mapped_column(String(150), nullable=False)
    cpf_cnpj: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(150), nullable=True)
    telefone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    contratos = relationship("Contrato", back_populates="cliente")


class Contrato(Base):
    """Faturamento do projeto. Um projeto_externo = um contrato."""
    __tablename__ = "contrato"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("cliente.id"), nullable=True)
    projeto_externo_id: Mapped[int | None] = mapped_column(
        ForeignKey("projeto_externo.id"), nullable=True
    )
    numero: Mapped[str | None] = mapped_column(String(50), nullable=True)
    valor_total: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    data_inicio: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_fim: Mapped[date | None] = mapped_column(Date, nullable=True)
    quantidade_parcelas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    forma_pagamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("forma_pagamento.id"), nullable=True
    )
    estimativa_gastos_ppp: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    fase_atual: Mapped[str | None] = mapped_column(String(100), nullable=True)
    data_vencimento_base: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_inicio_pagamento: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    finalizado_em: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    cliente = relationship("Cliente", back_populates="contratos")
    projeto_externo = relationship("ProjetoExterno")
    forma_pagamento = relationship("FormaPagamento")
    pagamentos = relationship(
        "ContratoPagamento", back_populates="contrato",
        order_by="ContratoPagamento.data_vencimento",
    )


class ContratoPagamento(Base):
    """Parcela de um contrato (tabela 1:N)."""
    __tablename__ = "contrato_pagamento"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    contrato_id: Mapped[int | None] = mapped_column(ForeignKey("contrato.id"), nullable=True)
    cliente_id: Mapped[int | None] = mapped_column(ForeignKey("cliente.id"), nullable=True)
    projeto_externo_id: Mapped[int | None] = mapped_column(
        ForeignKey("projeto_externo.id"), nullable=True
    )
    forma_pagamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("forma_pagamento.id"), nullable=True
    )
    valor: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    data_vencimento: Mapped[date | None] = mapped_column(Date, nullable=True)
    data_pagamento: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    numero_parcela: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_parcelas: Mapped[int | None] = mapped_column(Integer, nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    contrato = relationship("Contrato", back_populates="pagamentos")
    cliente = relationship("Cliente")
    projeto_externo = relationship("ProjetoExterno")
    forma_pagamento = relationship("FormaPagamento")


class Transacao(Base):
    """Lançamento financeiro (entrada/saída) do fluxo de caixa."""
    __tablename__ = "transacao"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    data: Mapped[date | None] = mapped_column(Date, nullable=True)
    conta_id: Mapped[int | None] = mapped_column(ForeignKey("conta_bancaria.id"), nullable=True)
    tipo: Mapped[str] = mapped_column(
        SAEnum("entrada", "saida", name="transacao_tipo"), nullable=False
    )
    categoria_id: Mapped[int | None] = mapped_column(
        ForeignKey("categoria_transacao.id"), nullable=True
    )
    celula_id: Mapped[int | None] = mapped_column(ForeignKey("celula.id"), nullable=True)
    valor: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    projeto_externo_id: Mapped[int | None] = mapped_column(
        ForeignKey("projeto_externo.id"), nullable=True
    )
    contrato_pagamento_id: Mapped[int | None] = mapped_column(
        ForeignKey("contrato_pagamento.id"), nullable=True
    )
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    external_source: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Relationships
    conta = relationship("ContaBancaria")
    categoria = relationship("CategoriaTransacao")
    celula = relationship("Celula")
    projeto_externo = relationship("ProjetoExterno")
    contrato_pagamento = relationship("ContratoPagamento")
