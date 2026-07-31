from datetime import datetime, date
from typing import Any, Literal
from pydantic import BaseModel, field_validator


# ---------- Projeto Externo ----------

class ProjetoExternoBase(BaseModel):
    nome: str
    descricao: str | None = None
    descricao_projeto: str | None = None
    data_inicio: date | None = None
    possui_orientador: bool | None = None
    nome_orientador: str | None = None
    status: Literal["ativo", "finalizado", "pausado"] | None = None
    external_source: str | None = None
    external_id: str | None = None


class ProjetoExternoCreate(ProjetoExternoBase):
    pass


class ProjetoExternoUpdate(BaseModel):
    nome: str | None = None
    descricao: str | None = None
    descricao_projeto: str | None = None
    data_inicio: date | None = None
    possui_orientador: bool | None = None
    nome_orientador: str | None = None
    status: Literal["ativo", "finalizado", "pausado"] | None = None


class ProjetoExternoRead(ProjetoExternoBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Acompanhamento Projeto ----------

def _validate_nota_1_5(v):
    if v is not None and not (1 <= int(v) <= 5):
        raise ValueError("Nota deve estar entre 1 e 5")
    return v


PctFaixa = Literal["0-20%", "21-40%", "41-60%", "61-80%", "81-100%"]
ModeloGerenciamento = Literal["Tradicional", "Agil", "Hibrido"]
StatusCronograma = Literal["Dentro do prazo", "Com risco de atraso", "Atrasado", "Concluido"]

_NOTAS_1_5 = (
    "capacitacao_equipe", "eficacia_metodologia", "nivel_retrabalho",
    "comunicacao_cliente", "suficiencia_orcamento", "cliente_percebeu_valor",
    "variacao_escopo", "abertura_cliente", "satisfacao_cliente",
    "suficiencia_orcamento_nota",
)


class AcompanhamentoBase(BaseModel):
    projeto_externo_id: int | None = None
    contrato_id: int | None = None
    data_resposta: date | None = None
    modelo_gerenciamento: ModeloGerenciamento | None = None
    pct_conclusao: PctFaixa | None = None
    status_cronograma: StatusCronograma | None = None
    motivos_atraso: str | None = None
    capacitacao_equipe: int | None = None
    eficacia_metodologia: int | None = None
    nivel_retrabalho: int | None = None
    comunicacao_cliente: int | None = None
    suficiencia_orcamento: int | None = None
    orcamento_nao_necessario: bool | None = None
    primeira_resposta: bool | None = None
    cliente_percebeu_valor: int | None = None
    pct_marcos_prazo: str | None = None
    variacao_escopo: int | None = None
    impacto_cliente: str | None = None
    abertura_cliente: int | None = None
    satisfacao_cliente: int | None = None
    suficiencia_orcamento_nota: int | None = None
    dados_iniciais_adicionais: Any | None = None
    external_source: str | None = None
    external_id: str | None = None

    @field_validator(*_NOTAS_1_5, mode="before")
    @classmethod
    def validate_nota_range(cls, v):
        return _validate_nota_1_5(v)


class AcompanhamentoCreate(AcompanhamentoBase):
    pass


class AcompanhamentoUpdate(BaseModel):
    data_resposta: date | None = None
    modelo_gerenciamento: ModeloGerenciamento | None = None
    pct_conclusao: PctFaixa | None = None
    status_cronograma: StatusCronograma | None = None
    motivos_atraso: str | None = None
    capacitacao_equipe: int | None = None
    eficacia_metodologia: int | None = None
    nivel_retrabalho: int | None = None
    comunicacao_cliente: int | None = None
    suficiencia_orcamento: int | None = None
    orcamento_nao_necessario: bool | None = None
    cliente_percebeu_valor: int | None = None
    pct_marcos_prazo: str | None = None
    variacao_escopo: int | None = None
    impacto_cliente: str | None = None
    abertura_cliente: int | None = None
    satisfacao_cliente: int | None = None
    suficiencia_orcamento_nota: int | None = None
    dados_iniciais_adicionais: Any | None = None


class AcompanhamentoRead(AcompanhamentoBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Satélites ----------

class ImpedimentoCreate(BaseModel):
    houve_impedimentos: bool
    tipo_impedimento: str | None = None


class ImpedimentoUpdate(BaseModel):
    houve_impedimentos: bool | None = None
    tipo_impedimento: str | None = None


class ImpedimentoRead(BaseModel):
    id: int
    acompanhamento_id: int
    houve_impedimentos: bool
    tipo_impedimento: str | None
    model_config = {"from_attributes": True}


class OrientadorCreate(BaseModel):
    possui_orientador: bool
    nome_orientador: str | None = None
    efetividade_orientador: int | None = None
    disponibilidade_orientador: int | None = None

    @field_validator("efetividade_orientador", "disponibilidade_orientador", mode="before")
    @classmethod
    def validate_nota(cls, v):
        return _validate_nota_1_5(v)


class OrientadorRead(BaseModel):
    id: int
    acompanhamento_id: int
    possui_orientador: bool
    nome_orientador: str | None
    efetividade_orientador: int | None
    disponibilidade_orientador: int | None
    model_config = {"from_attributes": True}


class SprintCreate(BaseModel):
    pct_story_points: PctFaixa | None = None


class SprintUpdate(BaseModel):
    pct_story_points: PctFaixa | None = None


class SprintRead(BaseModel):
    id: int
    acompanhamento_id: int
    pct_story_points: PctFaixa | None
    model_config = {"from_attributes": True}
