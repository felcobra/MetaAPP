"""Endpoints de Portfólio — Coordenações com seus serviços técnicos."""
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.hr import Coordenacao
from app.models.service import Servico
from app.models.commercial import Oportunidade
from app.schemas.service import ServicoCreate, ServicoRead, PortfolioCoordReadItem

router = APIRouter()


@router.get("/coordenacoes", summary="Coordenações com serviços e contagem de oportunidades")
async def list_portfolio(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna a lista de coordenações enriquecida com seus serviços e o total
    de oportunidades — dados usados na tela de Portfólio do frontend.
    """
    r = await db.execute(select(Coordenacao).order_by(Coordenacao.id))
    coordenacoes = r.scalars().all()

    result = []
    for coord in coordenacoes:
        # Serviços da coordenação
        rs = await db.execute(
            select(Servico)
            .where(Servico.coordenacao_id == coord.id, Servico.ativo == True)
            .order_by(Servico.ordem)
        )
        servicos = rs.scalars().all()

        # Contagem de oportunidades relacionadas (via coordenacao_id)
        ro = await db.execute(
            select(func.count(Oportunidade.id))
            .where(Oportunidade.coordenacao_id == coord.id)
        )
        total_op = ro.scalar() or 0

        result.append({
            "id": coord.id,
            "nome": coord.nome,
            "descricao": coord.descricao,
            "total_oportunidades": total_op,
            "servicos": servicos,
        })

    return result


@router.post("/coordenacoes/{coordenacao_id}/servicos", response_model=ServicoRead, status_code=201,
             summary="Adicionar serviço a uma coordenação")
async def create_servico(
    coordenacao_id: int,
    body: ServicoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    r = await db.execute(select(Coordenacao).where(Coordenacao.id == coordenacao_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404, "Coordenação não encontrada")
    obj = Servico(coordenacao_id=coordenacao_id, **body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/servicos/{servico_id}", response_model=ServicoRead, summary="Atualizar serviço")
async def update_servico(
    servico_id: int,
    body: ServicoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    r = await db.execute(select(Servico).where(Servico.id == servico_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Serviço não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/servicos/{servico_id}", status_code=204, summary="Remover serviço")
async def delete_servico(
    servico_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    r = await db.execute(select(Servico).where(Servico.id == servico_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Serviço não encontrado")
    await db.delete(obj)
