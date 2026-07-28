"""Endpoints Comerciais — CRM (Leads, Oportunidades, Histórico de Fases).

v2 — Melhorias:
- GET /leads: filtro por nome e empresa (busca parcial, case-insensitive)
- DELETE /leads/{id}: requer admin
- DELETE /oportunidades/{id}: requer admin
- Logging em operações destrutivas
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_director_or_admin
from app.models.commercial import (
    DimLeadOrigem, DimMotivoPerdida, Lead, Oportunidade, OportunidadePhaseHistory
)
from app.schemas.commercial import (
    DimBaseRead, DimCreate,
    LeadRead, LeadCreate, LeadUpdate,
    OportunidadeRead, OportunidadeCreate, OportunidadeUpdate,
    PaginatedOportunidades,
    PhaseHistoryRead, PhaseHistoryCreate,
)

logger = logging.getLogger("metaapp")
router = APIRouter()

# ========== Dimensões ==========

@router.get("/origens", response_model=List[DimBaseRead], summary="Listar origens de leads")
async def list_origens(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(DimLeadOrigem))
    return r.scalars().all()


@router.post("/origens", response_model=DimBaseRead, status_code=201)
async def create_origem(body: DimCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
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
async def create_motivo(body: DimCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = DimMotivoPerdida(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Leads ==========

@router.get("/leads", response_model=List[LeadRead])
async def list_leads(
    nome: Optional[str] = Query(None, description="Filtrar por nome do lead (busca parcial)"),
    empresa: Optional[str] = Query(None, description="Filtrar por empresa (busca parcial)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Lista leads com filtros opcionais por nome e empresa."""
    q = select(Lead)
    if nome:
        q = q.where(Lead.nome.ilike(f"%{nome}%"))
    if empresa:
        q = q.where(Lead.empresa.ilike(f"%{empresa}%"))
    r = await db.execute(q.order_by(Lead.created_at.desc()).offset(skip).limit(limit))
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
    db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin),
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


@router.delete("/leads/{lead_id}", status_code=204, summary="Deletar lead (admin)")
async def delete_lead(
    lead_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Remove um lead. Requer admin. Falhará se o lead possuir oportunidades vinculadas (RESTRICT)."""
    r = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = r.scalar_one_or_none()
    if not lead:
        raise HTTPException(404, "Lead não encontrado")
    try:
        await db.delete(lead)
        await db.flush()
        logger.info("Lead %s (%s) deletado", lead_id, lead.nome)
    except Exception:
        raise HTTPException(
            status_code=409,
            detail="Não é possível remover o lead pois existem oportunidades vinculadas.",
        )


# ========== Oportunidades ==========

@router.get("/oportunidades", response_model=PaginatedOportunidades)
async def list_oportunidades(
    status: Optional[str] = None,
    lead_id: Optional[int] = None,
    coordenacao_id: Optional[int] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(200, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    from sqlalchemy import func
    query = select(Oportunidade)
    if status:
        query = query.where(Oportunidade.status == status)
    if lead_id:
        query = query.where(Oportunidade.lead_id == lead_id)
    if coordenacao_id:
        query = query.where(Oportunidade.coordenacao_id == coordenacao_id)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = max(1, -(-total // page_size))
    skip = (page - 1) * page_size

    r = await db.execute(query.offset(skip).limit(page_size))
    items = r.scalars().all()

    return {
        "items": items,
        "total": total,
        "total_pages": total_pages,
        "current_page": page,
        "page_from": skip + 1 if total else 0,
        "page_to": min(skip + page_size, total),
    }


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
    db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin),
):
    r = await db.execute(select(Oportunidade).where(Oportunidade.id == op_id))
    op = r.scalar_one_or_none()
    if not op:
        raise HTTPException(404, "Oportunidade não encontrada")

    old_fase = op.fase_atual
    updates = body.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(op, k, v)

    # Registra histórico automaticamente se a fase mudou
    if "fase_atual" in updates and updates["fase_atual"] != old_fase:
        history = OportunidadePhaseHistory(
            oportunidade_id=op_id,
            fase_anterior=old_fase,
            fase_nova=updates["fase_atual"],
        )
        db.add(history)

    await db.flush()
    await db.refresh(op)
    return op


@router.delete("/oportunidades/{op_id}", status_code=204, summary="Deletar oportunidade (admin)")
async def delete_oportunidade(
    op_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Remove uma oportunidade e seu histórico de fases. Requer admin."""
    r = await db.execute(select(Oportunidade).where(Oportunidade.id == op_id))
    op = r.scalar_one_or_none()
    if not op:
        raise HTTPException(404, "Oportunidade não encontrada")
    await db.delete(op)
    await db.flush()
    logger.info("Oportunidade %s deletada", op_id)


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
    db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin),
):
    """Inserção manual de entrada no histórico (append-only)."""
    history = OportunidadePhaseHistory(oportunidade_id=op_id, **body.model_dump())
    db.add(history)
    await db.flush()
    await db.refresh(history)
    return history
