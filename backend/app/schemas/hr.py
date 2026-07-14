from datetime import datetime
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
    user_id: int | None = None


class MembroCreate(MembroBase):
    pass


class MembroUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None
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
