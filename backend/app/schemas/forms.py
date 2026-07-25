from datetime import datetime
from typing import Any, Literal
from pydantic import BaseModel


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
    titulo: str
    subtitulo: str | None = None
    descricao: str | None = None
    frequencia: Literal["QUINZENAL", "MENSAL", "SEMANAL"]
    duracao_estimada: str | None = None
    publico_alvo: str | None = None
    ativo: bool = True


class FormStepCreate(BaseModel):
    index: int
    section_label: str | None = None
    titulo: str
    descricao: str | None = None


class FormFieldCreate(BaseModel):
    tipo: Literal["date", "text", "textarea", "radio"]
    label: str
    required: bool = False
    helper: str | None = None
    placeholder: str | None = None
    max_length: int | None = None
    options: list[str] | None = None
    ordem: int = 0


# ---------- FormSubmission ----------

class FormSubmissionCreate(BaseModel):
    template_id: int
    projeto_externo_id: int | None = None
    ciclo: str


class FormSubmissionUpdate(BaseModel):
    status: Literal["pendente", "em-andamento", "concluido"] | None = None
    progresso: int | None = None
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
    valor: str | None = None


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
