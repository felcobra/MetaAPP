from datetime import datetime
from pydantic import BaseModel


class ServicoCreate(BaseModel):
    nome: str
    descricao: str | None = None
    icone: str | None = None
    ordem: int = 0
    ativo: bool = True


class ServicoRead(BaseModel):
    id: int
    coordenacao_id: int
    nome: str
    descricao: str | None
    icone: str | None
    ordem: int
    ativo: bool
    created_at: datetime
    model_config = {"from_attributes": True}


class PortfolioCoordReadItem(BaseModel):
    """Coordenação enriquecida para a tela de portfólio."""
    id: int
    nome: str
    descricao: str | None
    total_oportunidades: int
    servicos: list[ServicoRead]
    model_config = {"from_attributes": True}
