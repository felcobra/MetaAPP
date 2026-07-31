from datetime import datetime, date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel


# ---------- Auxiliares ----------

class FormaPagamentoCreate(BaseModel):
    nome: str
    descricao: str | None = None


class FormaPagamentoRead(BaseModel):
    id: int
    nome: str
    descricao: str | None
    model_config = {"from_attributes": True}


class ContaBancariaCreate(BaseModel):
    nome: str
    tipo: Literal["banco", "pix", "dinheiro", "outro"]
    ativo: bool = True


class ContaBancariaRead(BaseModel):
    id: int
    nome: str
    tipo: Literal["banco", "pix", "dinheiro", "outro"]
    ativo: bool
    model_config = {"from_attributes": True}


class CategoriaTransacaoCreate(BaseModel):
    nome: str
    tipo: Literal["entrada", "saida", "ambos"]
    celula_id: int | None = None
    ativo: bool = True


class CategoriaTransacaoRead(BaseModel):
    id: int
    nome: str
    tipo: Literal["entrada", "saida", "ambos"]
    celula_id: int | None
    ativo: bool
    model_config = {"from_attributes": True}


# ---------- Cliente ----------

class ClienteBase(BaseModel):
    nome: str
    cpf_cnpj: str | None = None
    email: str | None = None
    telefone: str | None = None
    external_source: str | None = None
    external_id: str | None = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = None
    cpf_cnpj: str | None = None
    email: str | None = None
    telefone: str | None = None


class ClienteRead(ClienteBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Contrato ----------

class ContratoBase(BaseModel):
    cliente_id: int | None = None
    projeto_externo_id: int | None = None
    numero: str | None = None
    valor_total: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    quantidade_parcelas: int | None = None
    forma_pagamento_id: int | None = None
    estimativa_gastos_ppp: Decimal | None = None
    fase_atual: str | None = None
    data_vencimento_base: date | None = None
    data_inicio_pagamento: datetime | None = None
    finalizado_em: datetime | None = None
    external_source: str | None = None
    external_id: str | None = None


class ContratoCreate(ContratoBase):
    pass


class ContratoUpdate(BaseModel):
    numero: str | None = None
    valor_total: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    quantidade_parcelas: int | None = None
    forma_pagamento_id: int | None = None
    estimativa_gastos_ppp: Decimal | None = None
    fase_atual: str | None = None
    data_vencimento_base: date | None = None
    data_inicio_pagamento: datetime | None = None
    finalizado_em: datetime | None = None


class ContratoRead(ContratoBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Contrato Pagamento ----------

class ContratoPagamentoBase(BaseModel):
    contrato_id: int | None = None
    cliente_id: int | None = None
    projeto_externo_id: int | None = None
    forma_pagamento_id: int | None = None
    valor: Decimal | None = None
    data_vencimento: date | None = None
    data_pagamento: date | None = None
    status: str | None = "pendente"
    numero_parcela: int | None = None
    total_parcelas: int | None = None
    external_id: str | None = None
    external_source: str | None = None


class ContratoPagamentoCreate(ContratoPagamentoBase):
    pass


class ContratoPagamentoUpdate(BaseModel):
    valor: Decimal | None = None
    data_vencimento: date | None = None
    data_pagamento: date | None = None
    status: str | None = None
    forma_pagamento_id: int | None = None
    numero_parcela: int | None = None
    total_parcelas: int | None = None


class ContratoPagamentoRead(ContratoPagamentoBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Transação ----------

class TransacaoCreate(BaseModel):
    data: date | None = None
    conta_id: int | None = None
    tipo: Literal["entrada", "saida"]
    categoria_id: int | None = None
    celula_id: int | None = None
    valor: Decimal | None = None
    projeto_externo_id: int | None = None
    contrato_pagamento_id: int | None = None


class TransacaoRead(TransacaoCreate):
    id: int
    external_id: str | None = None
    external_source: str | None = None
    model_config = {"from_attributes": True}


# ---------- Resumo financeiro ----------

class FinanceiroPorStatus(BaseModel):
    pendente: Decimal = Decimal("0")
    pago: Decimal = Decimal("0")
    atrasado: Decimal = Decimal("0")
    cancelado: Decimal = Decimal("0")
    total: Decimal = Decimal("0")
