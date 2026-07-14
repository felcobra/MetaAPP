"""Endpoints de Acompanhamento de Projetos — Health Check."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
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

router = APIRouter()

# ========== Projeto Externo ==========

@router.get("/projetos", response_model=List[ProjetoExternoRead])
async def list_projetos(skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(ProjetoExterno).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/projetos/{projeto_id}", response_model=ProjetoExternoRead)
async def get_projeto(projeto_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(ProjetoExterno).where(ProjetoExterno.id == projeto_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Projeto não encontrado")
    return obj


@router.post("/projetos", response_model=ProjetoExternoRead, status_code=201)
async def create_projeto(body: ProjetoExternoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = ProjetoExterno(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/projetos/{projeto_id}", response_model=ProjetoExternoRead)
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

@router.get("/acompanhamentos", response_model=List[AcompanhamentoRead])
async def list_acompanhamentos(
    projeto_externo_id: int | None = None,
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    q = select(AcompanhamentoProjeto)
    if projeto_externo_id:
        q = q.where(AcompanhamentoProjeto.projeto_externo_id == projeto_externo_id)
    r = await db.execute(q.order_by(AcompanhamentoProjeto.data_avaliacao.desc()).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/acompanhamentos/{acomp_id}", response_model=AcompanhamentoRead)
async def get_acompanhamento(acomp_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(AcompanhamentoProjeto).where(AcompanhamentoProjeto.id == acomp_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Acompanhamento não encontrado")
    return obj


@router.post("/acompanhamentos", response_model=AcompanhamentoRead, status_code=201)
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
