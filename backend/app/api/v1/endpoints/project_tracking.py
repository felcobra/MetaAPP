"""Endpoints de Acompanhamento de Projetos — Health Check.

v2 — Correções:
- Paths corrigidos: removido duplicação /projetos/projetos
  (antes: prefix=/projetos + endpoint=/projetos → /projetos/projetos)
  (agora: prefix=/projetos + endpoint=/ → /projetos/)
- Filtro por status adicionado ao list_projetos
- Logging em operações destrutivas
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.financial import Contrato, Cliente
from app.models.hr import Cargo, Coordenacao, Membro, MembroProjeto
from app.models.project_tracking import (
    ProjetoExterno, AcompanhamentoProjeto,
    AcompImpedimento, AcompOrientador, AcompSprint,
)
from app.schemas.project_tracking import (
    ProjetoExternoRead, ProjetoExternoCreate, ProjetoExternoUpdate,
    AcompanhamentoRead, AcompanhamentoCreate, AcompanhamentoUpdate,
    ImpedimentoRead, ImpedimentoCreate, ImpedimentoUpdate,
    OrientadorRead, OrientadorCreate,
    SprintRead, SprintCreate, SprintUpdate,
)

logger = logging.getLogger("metaapp")
router = APIRouter()

# ========== Projeto Externo ==========
# NOTA: prefix do router é /projetos, então os paths abaixo são relativos a ele.
# Ex: GET / → GET /api/v1/projetos/
#     GET /{id} → GET /api/v1/projetos/{id}

_PCT_FAIXA_MEIO = {
    "0-20%": 10, "21-40%": 30, "41-60%": 50, "61-80%": 70, "81-100%": 90,
}

# Os quatro valores do enum real de acompanhamento_projeto.status_cronograma.
_STATUS_VISUAL = {
    "Dentro do prazo": "no-prazo",
    "Com risco de atraso": "atencao",
    "Atrasado": "atrasado",
    "Concluido": "concluido",
}


# Declarado antes de /{projeto_id}: o FastAPI casa as rotas na ordem em que
# são registradas, e /{projeto_id} capturaria "board" como se fosse um id.
@router.get("/board", summary="Projetos com cliente, gerente, área e progresso (quadro)")
async def get_board(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Alimenta o quadro de Projetos Externos.

    Sem recorte de período: `projeto_externo.data_inicio` está preenchida em
    apenas 3 das 22 linhas, e as três em 2025. Qualquer recorte de 2026 devolve
    o quadro vazio — não é filtro, é apagar a tela. Por isso a tela de Projetos
    externos também não mostra os chips de período (ver `AppShell`).

    Quando a coluna estiver preenchida, dá para recortar com
    `*periodo.condicoes(ProjetoExterno.data_inicio)` na consulta abaixo e
    religar `showPeriodFilter` na página.

    Difere de /dashboard/active-projects por trazer também os finalizados (o
    quadro tem filtro próprio) e a área responsável.

    v2 — Batching: a versão anterior fazia 1 query para listar os projetos e
    depois 3 queries POR PROJETO (acompanhamento, alocação, contrato) num loop
    sequencial. Sob o volume real de produção isso estourava o timeout do
    proxy e a API respondia 503 (ver mesmo fix em dashboard.get_active_projects).
    Agora são 4 queries no total, casadas em Python por projeto_externo_id.
    """
    projetos = (await db.execute(
        select(ProjetoExterno).order_by(desc(ProjetoExterno.id))
    )).scalars().all()
    projeto_ids = [p.id for p in projetos]

    if not projeto_ids:
        return []

    # ── Último acompanhamento por projeto ────────────────────────────────────
    acomp_rows = (await db.execute(
        select(
            AcompanhamentoProjeto.projeto_externo_id,
            AcompanhamentoProjeto.pct_conclusao,
            AcompanhamentoProjeto.status_cronograma,
        )
        .where(AcompanhamentoProjeto.projeto_externo_id.in_(projeto_ids))
        .order_by(
            AcompanhamentoProjeto.projeto_externo_id,
            desc(AcompanhamentoProjeto.data_resposta),
        )
    )).all()
    ultimo_por_projeto: dict[int, tuple] = {}
    for row in acomp_rows:
        ultimo_por_projeto.setdefault(row.projeto_externo_id, (row.pct_conclusao, row.status_cronograma))

    # ── Gerente + área por projeto (mesma alocação) ─────────────────────────
    # Cargos de gerência vêm primeiro; se o projeto não tiver nenhuma
    # alocação com cargo de gerência, cai para qualquer membro ainda alocado.
    alocacao_rows = (await db.execute(
        select(
            MembroProjeto.projeto_externo_id,
            Membro.nome,
            Coordenacao.nome.label("area_nome"),
            Cargo.nome.like("Gerente%").label("eh_gerente"),
        )
        .join(Membro, Membro.id == MembroProjeto.membro_id)
        .outerjoin(Cargo, Cargo.id == MembroProjeto.cargo_id)
        .outerjoin(Coordenacao, Coordenacao.id == MembroProjeto.coordenacao_id)
        .where(
            MembroProjeto.projeto_externo_id.in_(projeto_ids),
            MembroProjeto.data_saida.is_(None),
        )
        .order_by(MembroProjeto.projeto_externo_id, desc("eh_gerente"), Membro.id)
    )).all()
    alocacao_por_projeto: dict[int, tuple] = {}
    for row in alocacao_rows:
        alocacao_por_projeto.setdefault(row.projeto_externo_id, (row.nome, row.area_nome))

    # ── Cliente via Contrato → Cliente ───────────────────────────────────────
    contrato_rows = (await db.execute(
        select(Contrato.projeto_externo_id, Cliente.nome)
        .join(Contrato.cliente)
        .where(Contrato.projeto_externo_id.in_(projeto_ids))
        .order_by(Contrato.projeto_externo_id, Contrato.id)
    )).all()
    cliente_por_projeto: dict[int, str] = {}
    for row in contrato_rows:
        cliente_por_projeto.setdefault(row.projeto_externo_id, row.nome)

    resultado = []
    for p in projetos:
        pct, status_cronograma = ultimo_por_projeto.get(p.id, (None, None))
        gerente, area = alocacao_por_projeto.get(p.id, (None, None))
        cliente = cliente_por_projeto.get(p.id)

        resultado.append({
            "id": p.id,
            "nome": p.nome,
            "cliente": cliente or p.nome,
            "area": area or "—",
            "gerente": gerente or "—",
            "status": _STATUS_VISUAL.get(status_cronograma, "sem-dados"),
            "status_projeto": p.status,
            "progresso": _PCT_FAIXA_MEIO.get(pct, 0),
        })

    return resultado


@router.get("/", response_model=List[ProjetoExternoRead], summary="Listar projetos")
async def list_projetos(
    status_filtro: Optional[str] = Query(None, alias="status", description="Filtrar por status do projeto"),
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Lista projetos externos com filtro opcional por status."""
    q = select(ProjetoExterno)
    if status_filtro:
        q = q.where(ProjetoExterno.status == status_filtro)
    r = await db.execute(q.order_by(ProjetoExterno.id.desc()).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/{projeto_id}", response_model=ProjetoExternoRead)
async def get_projeto(projeto_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(ProjetoExterno).where(ProjetoExterno.id == projeto_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Projeto não encontrado")
    return obj


@router.post("/", response_model=ProjetoExternoRead, status_code=201)
async def create_projeto(body: ProjetoExternoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = ProjetoExterno(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/{projeto_id}", response_model=ProjetoExternoRead)
async def update_projeto(projeto_id: int, body: ProjetoExternoUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(ProjetoExterno).where(ProjetoExterno.id == projeto_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Projeto não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Acompanhamentos ==========

@router.get("/acompanhamentos/", response_model=List[AcompanhamentoRead])
async def list_acompanhamentos(
    projeto_externo_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(AcompanhamentoProjeto)
    if projeto_externo_id:
        q = q.where(AcompanhamentoProjeto.projeto_externo_id == projeto_externo_id)
    r = await db.execute(q.order_by(AcompanhamentoProjeto.data_resposta.desc()).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/acompanhamentos/{acomp_id}", response_model=AcompanhamentoRead)
async def get_acompanhamento(acomp_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompanhamentoProjeto).where(AcompanhamentoProjeto.id == acomp_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Acompanhamento não encontrado")
    return obj


@router.post("/acompanhamentos/", response_model=AcompanhamentoRead, status_code=201)
async def create_acompanhamento(body: AcompanhamentoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = AcompanhamentoProjeto(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/acompanhamentos/{acomp_id}", response_model=AcompanhamentoRead)
async def update_acompanhamento(acomp_id: int, body: AcompanhamentoUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompanhamentoProjeto).where(AcompanhamentoProjeto.id == acomp_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Acompanhamento não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/acompanhamentos/{acomp_id}", status_code=204,
               summary="Deletar acompanhamento e suas tabelas satélite (CASCADE)")
async def delete_acompanhamento(acomp_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompanhamentoProjeto).where(AcompanhamentoProjeto.id == acomp_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Acompanhamento não encontrado")
    await db.delete(obj)
    logger.info("Acompanhamento %s deletado (cascade impedimentos/orientador/sprints)", acomp_id)


# ========== Impedimentos ==========

@router.get("/acompanhamentos/{acomp_id}/impedimentos", response_model=List[ImpedimentoRead])
async def list_impedimentos(acomp_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompImpedimento).where(AcompImpedimento.acompanhamento_id == acomp_id))
    return r.scalars().all()


@router.post("/acompanhamentos/{acomp_id}/impedimentos", response_model=ImpedimentoRead, status_code=201)
async def create_impedimento(acomp_id: int, body: ImpedimentoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = AcompImpedimento(acompanhamento_id=acomp_id, **body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/impedimentos/{imp_id}", response_model=ImpedimentoRead)
async def update_impedimento(imp_id: int, body: ImpedimentoUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompImpedimento).where(AcompImpedimento.id == imp_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Impedimento não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Orientador ==========

@router.get("/acompanhamentos/{acomp_id}/orientador", response_model=OrientadorRead | None)
async def get_orientador(acomp_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompOrientador).where(AcompOrientador.acompanhamento_id == acomp_id))
    return r.scalar_one_or_none()


@router.post("/acompanhamentos/{acomp_id}/orientador", response_model=OrientadorRead, status_code=201)
async def create_or_update_orientador(
    acomp_id: int, body: OrientadorCreate,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    """Cria ou substitui o orientador do acompanhamento (1:1)."""
    r = await db.execute(select(AcompOrientador).where(AcompOrientador.acompanhamento_id == acomp_id))
    existing = r.scalar_one_or_none()
    if existing:
        for k, v in body.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        await db.flush()
        await db.refresh(existing)
        return existing
    obj = AcompOrientador(acompanhamento_id=acomp_id, **body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Sprints ==========

@router.get("/acompanhamentos/{acomp_id}/sprints", response_model=List[SprintRead])
async def list_sprints(acomp_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompSprint).where(AcompSprint.acompanhamento_id == acomp_id))
    return r.scalars().all()


@router.post("/acompanhamentos/{acomp_id}/sprints", response_model=SprintRead, status_code=201)
async def create_sprint(acomp_id: int, body: SprintCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = AcompSprint(acompanhamento_id=acomp_id, **body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/sprints/{sprint_id}", response_model=SprintRead)
async def update_sprint(sprint_id: int, body: SprintUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompSprint).where(AcompSprint.id == sprint_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Sprint não encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj
