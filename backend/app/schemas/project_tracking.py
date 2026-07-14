from datetime import datetime
from typing import Any
from pydantic import BaseModel, field_validator


# ---------- Projeto Externo ----------

class ProjetoExternoBase(BaseModel):
    nome: str
    descricao: str | None = None
    status: str | None = None
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    external_source: str | None = None
    external_id: str | None = None


class ProjetoExternoCreate(ProjetoExternoBase):
    pass


class ProjetoExternoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    status: str | None = None
    data_inicio: datetime | None = None
    data_fim: datetime | None = None


class ProjetoExternoRead(ProjetoExternoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Acompanhamento Projeto ----------

def _validate_nota(v: int | None, field_name: str) -> int | None:
    if v is not None and not (1 <= v <= 5):
        raise ValueError(f"{field_name} deve estar entre 1 e 5")
    return v


class AcompanhamentoBase(BaseModel):
    projeto_externo_id: int
    data_avaliacao: datetime
    capacitacao_equipe: int | None = None
    nivel_retrabalho: int | None = None
    comunicacao_cliente: int | None = None
    gestao_riscos: int | None = None
    qualidade_entrega: int | None = None
    satisfacao_geral: int | None = None
    dados_iniciais_adicionais: Any | None = None
    external_source: str | None = None
    external_id: str | None = None

    @field_validator(
        "capacitacao_equipe", "nivel_retrabalho", "comunicacao_cliente",
        "gestao_riscos", "qualidade_entrega", "satisfacao_geral",
        mode="before",
    )
    @classmethod
    def validate_nota_range(cls, v):
        if v is not None and not (1 <= int(v) <= 5):
            raise ValueError("Nota deve estar entre 1 e 5")
        return v


class AcompanhamentoCreate(AcompanhamentoBase):
    pass


class AcompanhamentoUpdate(BaseModel):
    data_avaliacao: datetime | None = None
    capacitacao_equipe: int | None = None
    nivel_retrabalho: int | None = None
    comunicacao_cliente: int | None = None
    gestao_riscos: int | None = None
    qualidade_entrega: int | None = None
    satisfacao_geral: int | None = None
    dados_iniciais_adicionais: Any | None = None


class AcompanhamentoRead(AcompanhamentoBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Satélites ----------

class ImpedimentoCreate(BaseModel):
    descricao: str
    tipo: str | None = None
    resolvido: bool = False


class ImpedimentoUpdate(BaseModel):
    descricao: str | None = None
    tipo: str | None = None
    resolvido: bool | None = None


class ImpedimentoRead(BaseModel):
    id: int
    acompanhamento_id: int
    descricao: str
    tipo: str | None
    resolvido: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class OrientadorCreate(BaseModel):
    nome_orientador: str | None = None
    nota: int | None = None
    comentario: str | None = None

    @field_validator("nota", mode="before")
    @classmethod
    def validate_nota(cls, v):
        if v is not None and not (1 <= int(v) <= 5):
            raise ValueError("Nota deve estar entre 1 e 5")
        return v


class OrientadorRead(BaseModel):
    id: int
    acompanhamento_id: int
    nome_orientador: str | None
    nota: int | None
    comentario: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


class SprintCreate(BaseModel):
    numero_sprint: int | None = None
    status: str | None = None
    objetivo: str | None = None
    concluido: bool = False


class SprintUpdate(BaseModel):
    numero_sprint: int | None = None
    status: str | None = None
    objetivo: str | None = None
    concluido: bool | None = None


class SprintRead(BaseModel):
    id: int
    acompanhamento_id: int
    numero_sprint: int | None
    status: str | None
    objetivo: str | None
    concluido: bool
    created_at: datetime
    model_config = {"from_attributes": True}
