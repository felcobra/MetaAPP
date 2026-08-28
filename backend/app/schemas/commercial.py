from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator


# ---------- Dimensões ----------

class DimBaseRead(BaseModel):
    id: int
    raw_value: str | None
    canonical_value: str | None
    source_field: str | None
    ativo: bool
    model_config = {"from_attributes": True}


class DimCreate(BaseModel):
    raw_value: str | None = Field(None, max_length=200)
    canonical_value: str | None = Field(None, max_length=200)
    source_field: str | None = Field(None, max_length=100)
    ativo: bool = True

    @field_validator("raw_value", "canonical_value", "source_field")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


# ---------- Leads ----------

class LeadBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=200)
    email: EmailStr | None = None
    telefone: str | None = Field(None, max_length=30)
    empresa: str | None = Field(None, max_length=200)
    cargo: str | None = Field(None, max_length=100)
    external_source: str | None = Field(None, max_length=50)
    external_id: str | None = Field(None, max_length=100)

    @field_validator("nome", "telefone", "empresa", "cargo")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=200)
    email: EmailStr | None = None
    telefone: str | None = Field(None, max_length=30)
    empresa: str | None = Field(None, max_length=200)
    cargo: str | None = Field(None, max_length=100)

    @field_validator("nome", "telefone", "empresa", "cargo")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class LeadRead(LeadBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Oportunidade ----------

class OportunidadeBase(BaseModel):
    lead_id: int | None = None
    cliente_id: int | None = None
    fase_atual_nome: str | None = Field(None, max_length=200)
    fase_atual_id: str | None = Field(None, max_length=100)
    responsaveis: str | None = Field(None, max_length=500)
    valor_fechado: Decimal | None = None
    origem_id: int | None = None
    coordenacao_id: int | None = None
    motivo_perda_id: int | None = None
    status_terminal: Literal["ativo", "fechado", "desistido", "recusado", "postergado"] = "ativo"
    external_source: str | None = Field(None, max_length=50)
    external_id: str | None = Field(None, max_length=100)

    @field_validator("fase_atual_nome", "responsaveis")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class OportunidadeCreate(OportunidadeBase):
    pass


class OportunidadeUpdate(BaseModel):
    cliente_id: int | None = None
    fase_atual_nome: str | None = Field(None, max_length=200)
    fase_atual_id: str | None = Field(None, max_length=100)
    responsaveis: str | None = Field(None, max_length=500)
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
    from_phase_id: str | None = Field(None, max_length=100)
    from_phase_nome: str | None = Field(None, max_length=200)
    to_phase_id: str | None = Field(None, max_length=100)
    to_phase_nome: str = Field(..., min_length=1, max_length=200)

    @field_validator("from_phase_nome", "to_phase_nome")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


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
