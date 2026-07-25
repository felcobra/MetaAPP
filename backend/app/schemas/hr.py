from datetime import datetime, date
from pydantic import BaseModel, EmailStr


# ---------- Estrutura Organizacional ----------

class OrgCreate(BaseModel):
    nome: str
    descricao: str | None = None


class OrgRead(BaseModel):
    id: int
    nome: str
    descricao: str | None
    created_at: datetime
    model_config = {"from_attributes": True}


# ---------- Membro ----------

class MembroBase(BaseModel):
    nome: str
    email: EmailStr
    telefone: str | None = None
    data_entrada: date | None = None
    data_nascimento: date | None = None
    foto_url: str | None = None
    destaque_texto: str | None = None
    user_id: int | None = None


class MembroCreate(MembroBase):
    pass


class MembroUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
    telefone: str | None = None
    data_entrada: date | None = None
    data_nascimento: date | None = None
    foto_url: str | None = None
    destaque_texto: str | None = None
    user_id: int | None = None


class MembroRead(MembroBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ---------- Associações N:N ----------

class MembroCargoCreate(BaseModel):
    membro_id: int
    cargo_id: int
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativo: bool = True


class MembroCargoRead(BaseModel):
    id: int
    membro_id: int
    cargo_id: int
    data_inicio: datetime | None
    data_fim: datetime | None
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class MembroCelulaCreate(BaseModel):
    membro_id: int
    celula_id: int
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativo: bool = True


class MembroCelulaRead(BaseModel):
    id: int
    membro_id: int
    celula_id: int
    data_inicio: datetime | None
    data_fim: datetime | None
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class MembroCoordenacaoCreate(BaseModel):
    membro_id: int
    coordenacao_id: int
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativo: bool = True


class MembroCoordenacaoRead(BaseModel):
    id: int
    membro_id: int
    coordenacao_id: int
    data_inicio: datetime | None
    data_fim: datetime | None
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class MembroProjetoCreate(BaseModel):
    membro_id: int
    projeto_externo_id: int
    papel: str | None = None
    data_inicio: datetime | None = None
    data_fim: datetime | None = None
    ativo: bool = True


class MembroProjetoRead(BaseModel):
    id: int
    membro_id: int
    projeto_externo_id: int
    papel: str | None
    data_inicio: datetime | None
    data_fim: datetime | None
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ---------- OrgChart hierárquico ----------

class MembroSummary(BaseModel):
    """Resumo de membro para exibição no OrgChart."""
    id: int
    nome: str
    email: str
    telefone: str | None
    foto_url: str | None
    model_config = {"from_attributes": True}


class OrgNoRead(BaseModel):
    """Nó do organograma — com filhos recursivos."""
    id: int
    titulo: str
    membro: MembroSummary | None
    filhos: list["OrgNoRead"] = []
    model_config = {"from_attributes": True}


OrgNoRead.model_rebuild()  # necessário para recursão Pydantic v2


class OrgDivisaoRead(BaseModel):
    """Divisão do organograma com árvore completa."""
    id: str
    label: str
    root: OrgNoRead | None = None
    model_config = {"from_attributes": True}


class OrgNoCreate(BaseModel):
    divisao_id: int
    parent_id: int | None = None
    membro_id: int | None = None
    titulo: str
    ordem: int = 0


class OrgDivisaoCreate(BaseModel):
    nome: str
    slug: str
    ordem: int = 0
