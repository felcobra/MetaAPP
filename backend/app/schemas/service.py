from pydantic import BaseModel


class ServicoCreate(BaseModel):
    coordenacao_id: int | None = None
    nome: str
    sigla: str | None = None


class ServicoRead(BaseModel):
    id: int
    coordenacao_id: int | None
    nome: str
    sigla: str | None
    model_config = {"from_attributes": True}


class PortfolioCoordReadItem(BaseModel):
    """Coordenação enriquecida para a tela de portfólio."""
    id: int
    nome: str
    sigla: str | None
    total_oportunidades: int
    servicos: list[ServicoRead]
    model_config = {"from_attributes": True}


class ProjetoServicoCreate(BaseModel):
    projeto_externo_id: int
    servico_id: int


class ProjetoServicoRead(ProjetoServicoCreate):
    id: int
    model_config = {"from_attributes": True}
