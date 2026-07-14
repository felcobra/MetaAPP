from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, EmailStr


# ---------- Dimensões ----------

class DimBaseRead(BaseModel):
    id: int
    nome: str
    descricao: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class DimCreate(BaseModel):
    nome: str
    descricao: str | None = None


# ---------- Leads ----------

class LeadBase(BaseModel):
    nome: str
    email: EmailStr | None = None
    telefone: str | None = None
    empresa: str | None = None
    origem_id: int | None = None
    external_source: str | None = None
    external_id: str | None = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    telefone: str | None = None
    empresa: str | None = None
    origem_id: int | None = None
    external_source: str | None = None
    external_id: str | None = None


class LeadRead(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Oportunidade ----------

class OportunidadeBase(BaseModel):
    lead_id: int
    valor: Decimal | None = None
    status: Literal["ativo", "fechado", "desistido", "postergado"] = "ativo"
    fase_atual: str | None = None
    origem_id: int | None = None
    motivo_perda_id: int | None = None
    external_source: str | None = None
    external_id: str | None = None


class OportunidadeCreate(OportunidadeBase):
    pass


class OportunidadeUpdate(BaseModel):
    valor: Decimal | None = None
    status: Literal["ativo", "fechado", "desistido", "postergado"] | None = None
    fase_atual: str | None = None
    origem_id: int | None = None
    motivo_perda_id: int | None = None


class OportunidadeRead(OportunidadeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Phase History ----------

class PhaseHistoryCreate(BaseModel):
    fase_anterior: str | None = None
    fase_nova: str


class PhaseHistoryRead(BaseModel):
    id: int
    oportunidade_id: int
    fase_anterior: str | None
    fase_nova: str
    mudado_em: datetime
    model_config = {"from_attributes": True}
