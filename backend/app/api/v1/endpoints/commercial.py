"""Endpoints Comerciais — CRM (Leads, Oportunidades, Histórico de Fases)."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.commercial import (
    DimLeadOrigem, DimMotivoPerdida, Lead, Oportunidade, OportunidadePhaseHistory
)
from app.schemas.commercial import (
    DimBaseRead, DimCreate,
    LeadRead, LeadCreate, LeadUpdate,
    OportunidadeRead, OportunidadeCreate, OportunidadeUpdate,
    PhaseHistoryRead, PhaseHistoryCreate,
)

router = APIRouter()

# ========== Dimensões ==========

@router.get("/origens", response_model=List[DimBaseRead], summary="Listar origens de leads")
async def list_origens(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(DimLeadOrigem))
    return r.scalars().all()


@router.post("/origens", response_model=DimBaseRead, status_code=201)
async def create_origem(body: DimCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = DimLeadOrigem(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/motivos-perda", response_model=List[DimBaseRead], summary="Listar motivos de perda")
async def list_motivos(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(DimMotivoPerdida))
    return r.scalars().all()


@router.post("/motivos-perda", response_model=DimBaseRead, status_code=201)
async def create_motivo(body: DimCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = DimMotivoPerdida(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Leads ==========

@router.get("/leads", response_model=List[LeadRead])
async def list_leads(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    r = await db.execute(select(Lead).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/leads/{lead_id}", response_model=LeadRead)
async def get_lead(lead_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = r.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    return lead


@router.post("/leads", response_model=LeadRead, status_code=201)
async def create_lead(body: LeadCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    lead = Lead(**body.model_dump())
    db.add(lead)
    await db.flush()
    await db.refresh(lead)
    return lead


@router.patch("/leads/{lead_id}", response_model=LeadRead)
async def update_lead(
    lead_id: int, body: LeadUpdate,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    r = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = r.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
    await db.flush()
    await db.refresh(lead)
    return lead


# ========== Oportunidades ==========

@router.get("/oportunidades", response_model=List[OportunidadeRead])
async def list_oportunidades(
    status: str | None = None,
    lead_id: int | None = None,
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    query = select(Oportunidade)
    if status:
        query = query.where(Oportunidade.status == status)
    if lead_id:
        query = query.where(Oportunidade.lead_id == lead_id)
    r = await db.execute(query.offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/oportunidades/{op_id}", response_model=OportunidadeRead)
async def get_oportunidade(op_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Oportunidade).where(Oportunidade.id == op_id))
    op = r.scalar_one_or_none()
    if not op:
        raise HTTPException(404, "Oportunidade não encontrada")
    return op


@router.post("/oportunidades", response_model=OportunidadeRead, status_code=201)
async def create_oportunidade(
    body: OportunidadeCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    op = Oportunidade(**body.model_dump())
    db.add(op)
    await db.flush()
    await db.refresh(op)
    return op


@router.patch("/oportunidades/{op_id}", response_model=OportunidadeRead)
async def update_oportunidade(
    op_id: int, body: OportunidadeUpdate,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    r = await db.execute(select(Oportunidade).where(Oportunidade.id == op_id))
    op = r.scalar_one_or_none()
    if not op:
        raise HTTPException(404, "Oportunidade não encontrada")

    old_fase = op.fase_atual
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(op, k, v)

    # Registra histórico automaticamente se a fase mudou
    if "fase_atual" in body.model_dump(exclude_unset=True) and body.fase_atual != old_fase:
        history = OportunidadePhaseHistory(
            oportunidade_id=op_id,
            fase_anterior=old_fase,
            fase_nova=body.fase_atual,
        )
        db.add(history)

    await db.flush()
    await db.refresh(op)
    return op


# ========== Histórico de Fases ==========

@router.get("/oportunidades/{op_id}/historico", response_model=List[PhaseHistoryRead])
async def get_phase_history(
    op_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    r = await db.execute(
        select(OportunidadePhaseHistory)
        .where(OportunidadePhaseHistory.oportunidade_id == op_id)
        .order_by(OportunidadePhaseHistory.mudado_em)
    )
    return r.scalars().all()


@router.post("/oportunidades/{op_id}/historico", response_model=PhaseHistoryRead, status_code=201)
async def add_phase_history(
    op_id: int, body: PhaseHistoryCreate,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    """Inserção manual de entrada no histórico (append-only)."""
    history = OportunidadePhaseHistory(oportunidade_id=op_id, **body.model_dump())
    db.add(history)
    await db.flush()
    await db.refresh(history)
    return history
