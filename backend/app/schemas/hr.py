from datetime import datetime, date
from pydantic import BaseModel, EmailStr


# ---------- Estrutura Organizacional ----------

class CargoCreate(BaseModel):
    nome: str


class CargoRead(BaseModel):
    id: int
    nome: str
    model_config = {"from_attributes": True}


class CelulaCreate(BaseModel):
    nome: str
    sigla: str | None = None


class CelulaRead(BaseModel):
    id: int
    nome: str
    sigla: str | None
    model_config = {"from_attributes": True}


class CoordenacaoCreate(BaseModel):
    celula_id: int | None = None
    nome: str
    sigla: str | None = None


class CoordenacaoRead(BaseModel):
    id: int
    celula_id: int | None
    nome: str
    sigla: str | None
    model_config = {"from_attributes": True}


# ---------- Membro ----------

class MembroBase(BaseModel):
    nome: str
    email: EmailStr


class MembroCreate(MembroBase):
    pass


class MembroUpdate(BaseModel):
    nome: str | None = None
    email: EmailStr | None = None


class MembroRead(MembroBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Perfil estendido (exclusivo do MetaApp) ----------

class MembroPerfilBase(BaseModel):
    telefone: str | None = None
    data_entrada: date | None = None
    data_nascimento: date | None = None
    foto_url: str | None = None
    destaque_texto: str | None = None


class MembroPerfilUpdate(MembroPerfilBase):
    pass


class MembroPerfilRead(MembroPerfilBase):
    id: int
    membro_id: int
    user_id: int | None
    ativo: bool
    model_config = {"from_attributes": True}


# ---------- Associações N:N ----------

class MembroCargoCreate(BaseModel):
    membro_id: int
    cargo_id: int


class MembroCargoRead(BaseModel):
    id: int
    membro_id: int
    cargo_id: int
    model_config = {"from_attributes": True}


class MembroCelulaCreate(BaseModel):
    membro_id: int
    celula_id: int


class MembroCelulaRead(BaseModel):
    id: int
    membro_id: int
    celula_id: int
    model_config = {"from_attributes": True}


class MembroCoordenacaoCreate(BaseModel):
    membro_id: int
    coordenacao_id: int


class MembroCoordenacaoRead(BaseModel):
    id: int
    membro_id: int
    coordenacao_id: int
    model_config = {"from_attributes": True}


class MembroProjetoCreate(BaseModel):
    membro_id: int
    projeto_externo_id: int
    coordenacao_id: int | None = None
    cargo_id: int | None = None
    data_entrada: date | None = None
    data_saida: date | None = None


class MembroProjetoRead(BaseModel):
    id: int
    membro_id: int
    projeto_externo_id: int
    coordenacao_id: int | None
    cargo_id: int | None
    data_entrada: date | None
    data_saida: date | None
    model_config = {"from_attributes": True}


# ---------- OrgChart hierárquico ----------

class MembroSummary(BaseModel):
    """Resumo de membro para exibição no OrgChart."""
    id: int
    nome: str
    email: str
    telefone: str | None = None
    foto_url: str | None = None
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
    # Preencha cargo_id (e opcionalmente coordenacao_id para refinar) em vez
    # de membro_id para um nó de "time" — a lista de pessoas é derivada do RH,
    # não cadastrada nó a nó. São mutuamente exclusivos com membro_id.
    cargo_id: int | None = None
    coordenacao_id: int | None = None
    # Pessoas acrescentadas à mão ao time — para quando cargo/coordenação não
    # bastam pra descrever quem está nele (times ad-hoc). Soma com o que vem
    # de cargo_id, não substitui.
    membro_ids_manual: list[int] = []
    titulo: str
    ordem: int = 0


class OrgNoUpdate(BaseModel):
    """Edição de um nó existente — só título, membro, cargo/coordenação e a
    lista manual mudam; hierarquia e divisão não (para isso o admin remove e
    recria o nó)."""
    titulo: str
    membro_id: int | None = None
    cargo_id: int | None = None
    coordenacao_id: int | None = None
    membro_ids_manual: list[int] = []


class OrgDivisaoCreate(BaseModel):
    nome: str
    slug: str
    ordem: int = 0
