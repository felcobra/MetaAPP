from datetime import datetime, date
from typing import Annotated
from pydantic import BaseModel, EmailStr, Field, field_validator, AnyHttpUrl
import re


# ── Helpers de validação ──────────────────────────────────────────────────────

def _sanitize_str(v: str | None) -> str | None:
    """Remove espaços extras das extremidades."""
    return v.strip() if v else v


# ── Validator de URL de foto (bloqueia protocolos perigosos) ──────────────────

def _validate_foto_url(v: str | None) -> str | None:
    """Aceita apenas URLs HTTPS com extensão de imagem conhecida.

    Bloqueia explicitamente:
    - javascript: URI (XSS via <img src="javascript:...">)
    - data: URI (exfiltração via data:text/html ou data:image com payload)
    - Qualquer protocolo que não seja https://
    """
    if v is None:
        return v
    v = v.strip()
    if not v:
        return None
    lower = v.lower()
    # Bloqueia protocolos perigosos antes de qualquer parsing
    for blocked in ("javascript:", "data:", "vbscript:", "file:"):
        if lower.startswith(blocked):
            raise ValueError("foto_url não pode conter protocolos não permitidos (javascript:, data: etc.).")
    # Exige HTTPS
    if not lower.startswith("https://"):
        raise ValueError("foto_url deve começar com https://.")
    # Comprimento máximo
    if len(v) > 500:
        raise ValueError("foto_url deve ter no máximo 500 caracteres.")
    return v


# ---------- Estrutura Organizacional ----------

class CargoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)

    @field_validator("nome")
    @classmethod
    def strip_nome(cls, v: str) -> str:
        return v.strip()


class CargoRead(BaseModel):
    id: int
    nome: str
    model_config = {"from_attributes": True}


class CelulaCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    sigla: str | None = Field(None, max_length=20)

    @field_validator("nome", "sigla")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class CelulaRead(BaseModel):
    id: int
    nome: str
    sigla: str | None
    model_config = {"from_attributes": True}


class CoordenacaoCreate(BaseModel):
    celula_id: int | None = None
    nome: str = Field(..., min_length=1, max_length=100)
    sigla: str | None = Field(None, max_length=10)

    @field_validator("nome", "sigla")
    @classmethod
    def strip_fields(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class CoordenacaoRead(BaseModel):
    id: int
    celula_id: int | None
    nome: str
    sigla: str | None
    model_config = {"from_attributes": True}


# ---------- Membro ----------

class MembroBase(BaseModel):
    nome: str = Field(..., min_length=1, max_length=150)
    email: EmailStr


class MembroCreate(MembroBase):
    pass


class MembroUpdate(BaseModel):
    nome: str | None = Field(None, min_length=1, max_length=150)
    email: EmailStr | None = None


class MembroRead(MembroBase):
    id: int
    model_config = {"from_attributes": True}


# ---------- Perfil estendido (exclusivo do MetaApp) ----------

class MembroPerfilBase(BaseModel):
    telefone: str | None = Field(None, max_length=30)
    data_entrada: date | None = None
    data_nascimento: date | None = None
    foto_url: str | None = None
    destaque_texto: str | None = Field(None, max_length=1000)

    @field_validator("foto_url")
    @classmethod
    def validate_foto_url(cls, v: str | None) -> str | None:
        return _validate_foto_url(v)

    @field_validator("telefone")
    @classmethod
    def strip_telefone(cls, v: str | None) -> str | None:
        return v.strip() if v else v


class MembroPerfilUpdate(MembroPerfilBase):
    pass


# Read público — sem user_id (evita vazamento de ID interno de usuário
# para membros que acessam o perfil de outros membros).
class MembroPerfilPublicRead(MembroPerfilBase):
    id: int
    membro_id: int
    ativo: bool
    model_config = {"from_attributes": True}


# Read completo — inclui user_id, usado apenas em contextos admin/próprio usuário.
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
    titulo: str = Field(..., min_length=1, max_length=200)
    ordem: int = 0

    @field_validator("titulo")
    @classmethod
    def strip_titulo(cls, v: str) -> str:
        return v.strip()


class OrgNoUpdate(BaseModel):
    """Edição de um nó existente — só título, membro, cargo/coordenação e a
    lista manual mudam; hierarquia e divisão não (para isso o admin remove e
    recria o nó)."""
    titulo: str = Field(..., min_length=1, max_length=200)
    membro_id: int | None = None
    cargo_id: int | None = None
    coordenacao_id: int | None = None
    membro_ids_manual: list[int] = []

    @field_validator("titulo")
    @classmethod
    def strip_titulo(cls, v: str) -> str:
        return v.strip()


class OrgDivisaoCreate(BaseModel):
    nome: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=60, pattern=r"^[a-z0-9\-]+$")
    ordem: int = 0

    @field_validator("nome", "slug")
    @classmethod
    def strip_fields(cls, v: str) -> str:
        return v.strip()
