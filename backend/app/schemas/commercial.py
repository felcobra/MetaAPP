from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, EmailStr


# ---------- Dimensões ----------

class DimBaseRead(BaseModel):
    id: int
    raw_value: str | None
    canonical_value: str | None
    source_field: str | None
    ativo: bool
    model_config = {"from_attributes": True}


class DimCreate(BaseModel):
    raw_value: str | None = None
    canonical_value: str | None = None
    source_field: str | None = None
    ativo: bool = True


# ---------- Leads ----------

class LeadBase(BaseModel):
    nome: str
    email: EmailStr | None = None
    telefone: str | None = None
    empresa: str | None = None
    cargo: str | None = None
    external_source: str | None = None
    external_id: str | None = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    telefone: str | None = None
    empresa: str | None = None
    cargo: str | None = None


class LeadRead(LeadBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Oportunidade ----------

class OportunidadeBase(BaseModel):
    lead_id: int | None = None
    cliente_id: int | None = None
    fase_atual_nome: str | None = None
    fase_atual_id: str | None = None
    responsaveis: str | None = None
    valor_fechado: Decimal | None = None
    origem_id: int | None = None
    coordenacao_id: int | None = None
    motivo_perda_id: int | None = None
    status_terminal: Literal["ativo", "fechado", "desistido", "recusado", "postergado"] = "ativo"
    external_source: str | None = None
    external_id: str | None = None


class OportunidadeCreate(OportunidadeBase):
    pass


class OportunidadeUpdate(BaseModel):
    cliente_id: int | None = None
    fase_atual_nome: str | None = None
    fase_atual_id: str | None = None
    responsaveis: str | None = None
    valor_fechado: Decimal | None = None
    coordenacao_id: int | None = None
    motivo_perda_id: int | None = None
    status_terminal: Literal["ativo", "fechado", "desistido", "recusado", "postergado"] | None = None
    finalizado_em: datetime | None = None


class OportunidadeRead(OportunidadeBase):
    id: int
    criado_em: datetime | None
    finalizado_em: datetime | None
    model_config = {"from_attributes": True}


class PaginatedOportunidades(BaseModel):
    """Response paginado para a tabela de oportunidades do frontend."""
    items: list[OportunidadeRead]
    total: int
    total_pages: int
    current_page: int
    page_from: int
    page_to: int


# ---------- Phase History ----------

class PhaseHistoryCreate(BaseModel):
    from_phase_id: str | None = None
    from_phase_nome: str | None = None
    to_phase_id: str | None = None
    to_phase_nome: str


class PhaseHistoryRead(BaseModel):
    id: int
    oportunidade_id: int
    from_phase_id: str | None
    from_phase_nome: str | None
    to_phase_id: str | None
    to_phase_nome: str | None
    moved_at: datetime | None
    moved_by: str | None
    model_config = {"from_attributes": True}
