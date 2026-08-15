from datetime import datetime, date
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, field_validator, Field
import re


# ── Helpers ────────────────────────────────────────────────────────────────────

def _validate_cpf_cnpj(v: str | None) -> str | None:
    """Remove formatação (pontos/traços/barras) e valida comprimento.
    CPF: 11 dígitos. CNPJ: 14 dígitos.
    """
    if v is None:
        return v
    digits = re.sub(r"\D", "", v.strip())
    if digits and len(digits) not in (11, 14):
        raise ValueError("cpf_cnpj deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).")
    return digits if digits else None


# ---------- Auxiliares ----------

class FormaPagamentoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    descricao: str | None = Field(None, max_length=300)

    @field_validator("nome", "descricao")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class FormaPagamentoRead(BaseModel):
    id: int
    nome: str
    descricao: str | None
    model_config = {"from_attributes": True}


class ContaBancariaCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    tipo: Literal["banco", "pix", "dinheiro", "outro"]
    ativo: bool = True

    @field_validator("nome")
    @classmethod
    def strip_nome(cls, v: str) -> str:
        return v.strip()


class ContaBancariaRead(BaseModel):
    id: int
    nome: str
    tipo: Literal["banco", "pix", "dinheiro", "outro"]
    ativo: bool
    model_config = {"from_attributes": True}


class CategoriaTransacaoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    tipo: Literal["entrada", "saida", "ambos"]
    celula_id: int | None = None
    ativo: bool = True

    @field_validator("nome")
    @classmethod
    def strip_nome(cls, v: str) -> str:
        return v.strip()


class CategoriaTransacaoRead(BaseModel):
    id: int
    nome: str
    tipo: Literal["entrada", "saida", "ambos"]
    celula_id: int | None
    ativo: bool
    model_config = {"from_attributes": True}


# ---------- Cliente ----------

class ClienteBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    cpf_cnpj: str | None = Field(None, max_length=14)
    email: str | None = Field(None, max_length=150)
    telefone: str | None = Field(None, max_length=30)
    external_source: str | None = Field(None, max_length=50)
    external_id: str | None = Field(None, max_length=100)

    @field_validator("nome", "email", "telefone")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("cpf_cnpj")
    @classmethod
    def validate_cpf_cnpj(cls, v: str | None) -> str | None:
        return _validate_cpf_cnpj(v)


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=200)
    cpf_cnpj: str | None = Field(None, max_length=14)
    email: str | None = Field(None, max_length=150)
    telefone: str | None = Field(None, max_length=30)

    @field_validator("nome", "email", "telefone")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("cpf_cnpj")
    @classmethod
    def validate_cpf_cnpj(cls, v: str | None) -> str | None:
        return _validate_cpf_cnpj(v)


class ClienteRead(ClienteBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Contrato ----------

class ContratoBase(BaseModel):
    cliente_id: int | None = None
    projeto_externo_id: int | None = None
    numero: str | None = Field(None, max_length=50)
    valor_total: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    quantidade_parcelas: int | None = Field(None, ge=1, le=999)
    forma_pagamento_id: int | None = None
    estimativa_gastos_ppp: Decimal | None = None
    fase_atual: str | None = Field(None, max_length=100)
    data_vencimento_base: date | None = None
    data_inicio_pagamento: datetime | None = None
    finalizado_em: datetime | None = None
    external_source: str | None = Field(None, max_length=50)
    external_id: str | None = Field(None, max_length=100)

    @field_validator("numero", "fase_atual")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class ContratoCreate(ContratoBase):
    pass


class ContratoUpdate(BaseModel):
    numero: str | None = Field(None, max_length=50)
    valor_total: Decimal | None = None
    data_inicio: date | None = None
    data_fim: date | None = None
    quantidade_parcelas: int | None = Field(None, ge=1, le=999)
    forma_pagamento_id: int | None = None
    estimativa_gastos_ppp: Decimal | None = None
    fase_atual: str | None = Field(None, max_length=100)
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
    status: Literal["pendente", "pago", "atrasado", "cancelado"] | None = "pendente"
    numero_parcela: int | None = Field(None, ge=1, le=999)
    total_parcelas: int | None = Field(None, ge=1, le=999)
    external_id: str | None = Field(None, max_length=100)
    external_source: str | None = Field(None, max_length=50)


class ContratoPagamentoCreate(ContratoPagamentoBase):
    pass


class ContratoPagamentoUpdate(BaseModel):
    valor: Decimal | None = None
    data_vencimento: date | None = None
    data_pagamento: date | None = None
    status: Literal["pendente", "pago", "atrasado", "cancelado"] | None = None
    forma_pagamento_id: int | None = None
    numero_parcela: int | None = Field(None, ge=1, le=999)
    total_parcelas: int | None = Field(None, ge=1, le=999)


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
