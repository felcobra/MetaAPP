from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel, Field, field_validator


# ---------- FormTemplate ----------

class FormFieldRead(BaseModel):
    id: int
    step_id: int
    tipo: Literal["date", "text", "textarea", "radio"]
    label: str
    required: bool
    helper: str | None
    placeholder: str | None
    max_length: int | None
    options: Any | None
    ordem: int
    model_config = {"from_attributes": True}


class FormStepRead(BaseModel):
    id: int
    template_id: int
    index: int
    section_label: str | None
    titulo: str
    descricao: str | None
    fields: list[FormFieldRead] = []
    model_config = {"from_attributes": True}


class FormTemplateRead(BaseModel):
    id: int
    titulo: str
    subtitulo: str | None
    descricao: str | None
    frequencia: Literal["QUINZENAL", "MENSAL", "SEMANAL"]
    duracao_estimada: str | None
    publico_alvo: str | None
    ativo: bool
    total_steps: int
    created_at: datetime
    model_config = {"from_attributes": True}


class FormTemplateWithSteps(FormTemplateRead):
    steps: list[FormStepRead] = []


class FormTemplateCreate(BaseModel):
    titulo: str = Field(..., min_length=1, max_length=200)
    subtitulo: str | None = Field(None, max_length=300)
    descricao: str | None = Field(None, max_length=2000)
    frequencia: Literal["QUINZENAL", "MENSAL", "SEMANAL"]
    duracao_estimada: str | None = Field(None, max_length=50)
    publico_alvo: str | None = Field(None, max_length=200)
    ativo: bool = True

    @field_validator("titulo", "subtitulo", "descricao", "duracao_estimada", "publico_alvo")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class FormStepCreate(BaseModel):
    index: int = Field(..., ge=0, le=99)
    section_label: str | None = Field(None, max_length=100)
    titulo: str = Field(..., min_length=1, max_length=200)
    descricao: str | None = Field(None, max_length=1000)

    @field_validator("titulo", "section_label", "descricao")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class FormFieldCreate(BaseModel):
    tipo: Literal["date", "text", "textarea", "radio"]
    label: str = Field(..., min_length=1, max_length=300)
    required: bool = False
    helper: str | None = Field(None, max_length=500)
    placeholder: str | None = Field(None, max_length=200)
    max_length: int | None = Field(None, ge=1, le=10000)
    options: list[str] | None = None
    ordem: int = Field(0, ge=0, le=999)

    @field_validator("label", "helper", "placeholder")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v

    @field_validator("options")
    @classmethod
    def validate_options(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        if len(v) > 50:
            raise ValueError("Uma questão pode ter no máximo 50 opções.")
        return [opt.strip() for opt in v if opt.strip()]


# ---------- FormSubmission ----------

class FormSubmissionCreate(BaseModel):
    template_id: int
    projeto_externo_id: int | None = None
    ciclo: str = Field(..., min_length=1, max_length=50)

    @field_validator("ciclo")
    @classmethod
    def strip_ciclo(cls, v: str) -> str:
        return v.strip()


class FormSubmissionUpdate(BaseModel):
    status: Literal["pendente", "em-andamento", "concluido"] | None = None
    progresso: int | None = Field(None, ge=0, le=100)
    data_submissao: datetime | None = None


class FormSubmissionRead(BaseModel):
    id: int
    template_id: int
    membro_id: int
    projeto_externo_id: int | None
    ciclo: str
    status: str
    progresso: int
    data_submissao: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- FormAnswer ----------

class FormAnswerUpsert(BaseModel):
    field_id: int
    # Limite de 5000 chars — suficiente para textarea mas bloqueia payloads gigantes
    valor: str | None = Field(None, max_length=5000)

    @field_validator("valor")
    @classmethod
    def strip_valor(cls, v: str | None) -> str | None:
        # Strip apenas espaços no início/fim; conteúdo interno é preservado
        return v.strip() if v else v


class FormAnswerRead(BaseModel):
    id: int
    submission_id: int
    field_id: int
    valor: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


# ---------- Task-like view (front-end FormTask) ----------

class FormTaskRead(BaseModel):
    """Visão resumida de um template + status da submissão do usuário atual."""
    id: int
    frequency: str
    due_label: str | None   # calculado no endpoint
    title: str
    subtitle: str | None
    description: str | None
    steps: int
    duration: str | None
    audience: str | None
    progress: int
    status: str
    cta_label: str
    model_config = {"from_attributes": True}


# ---------- History item ----------

class FormHistoryItemRead(BaseModel):
    id: int
    title: str
    client: str | None
    date: str
    model_config = {"from_attributes": True}
