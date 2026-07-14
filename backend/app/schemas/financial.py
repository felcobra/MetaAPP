from datetime import datetime, date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel


# ---------- Auxiliares ----------

class AuxCreate(BaseModel):
    nome: str
    descricao: str | None = None


class FormaPagamentoRead(BaseModel):
    id: int
    nome: str
    descricao: str | None
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class ContaBancariaRead(BaseModel):
    id: int
    nome: str
    banco: str | None
    agencia: str | None
    numero_conta: str | None
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class CategoriaTransacaoCreate(BaseModel):
    nome: str
    tipo: Literal["entrada", "saida"]
    descricao: str | None = None


class CategoriaTransacaoRead(BaseModel):
    id: int
    nome: str
    tipo: Literal["entrada", "saida"]
    descricao: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


# ---------- Cliente ----------

class ClienteBase(BaseModel):
    nome: str
    cpf_cnpj: str | None = None
    email: str | None = None
    telefone: str | None = None
    endereco: str | None = None
    external_source: str | None = None
    external_id: str | None = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = None
    cpf_cnpj: str | None = None
    email: str | None = None
    telefone: str | None = None
    endereco: str | None = None


class ClienteRead(ClienteBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Contrato ----------

class ContratoBase(BaseModel):
    cliente_id: int
    projeto_externo_id: int
    valor_total: Decimal
    data_inicio: date | None = None
    data_fim: date | None = None
    fase_atual: str | None = None
    descricao: str | None = None
    external_source: str | None = None
    external_id: str | None = None


class ContratoCreate(ContratoBase):
    pass


class ContratoUpdate(BaseModel):
    valor_total: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    fase_atual: str | None = None
    descricao: str | None = None


class ContratoRead(ContratoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Contrato Pagamento ----------

class ContratoPagamentoBase(BaseModel):
    contrato_id: int
    valor: Decimal
    data_vencimento: date
    data_pagamento: date | None = None
    status: Literal["pendente", "pago", "atrasado", "cancelado"] = "pendente"
    forma_pagamento_id: int | None = None
    conta_bancaria_id: int | None = None
    categoria_id: int | None = None
    observacao: str | None = None


class ContratoPagamentoCreate(ContratoPagamentoBase):
    pass


class ContratoPagamentoUpdate(BaseModel):
    valor: Decimal | None = None
    data_vencimento: date | None = None
    data_pagamento: date | None = None
    status: Literal["pendente", "pago", "atrasado", "cancelado"] | None = None
    forma_pagamento_id: int | None = None
    conta_bancaria_id: int | None = None
    categoria_id: int | None = None
    observacao: str | None = None


class ContratoPagamentoRead(ContratoPagamentoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Resumo financeiro ----------

class FinanceiroPorStatus(BaseModel):
    pendente: Decimal = Decimal("0")
    pago: Decimal = Decimal("0")
    atrasado: Decimal = Decimal("0")
    cancelado: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
