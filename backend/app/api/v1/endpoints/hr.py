"""Endpoints de RH e Gestão Interna — Membros, Estrutura Organizacional, Alocações."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.hr import (
    Celula, Coordenacao, Cargo, Membro,
    MembroCargo, MembroCelula, MembroCoordenacao, MembroProjeto,
)
from app.schemas.hr import (
    OrgCreate, OrgRead,
    MembroRead, MembroCreate, MembroUpdate,
    MembroCargoCreate, MembroCargoRead,
    MembroCelulaCreate, MembroCelulaRead,
    MembroCoordenacaoCreate, MembroCoordenacaoRead,
    MembroProjetoCreate, MembroProjetoRead,
)

router = APIRouter()

# ========== Estrutura Organizacional ==========

@router.get("/celulas", response_model=List[OrgRead])
async def list_celulas(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Celula))
    return r.scalars().all()


@router.post("/celulas", response_model=OrgRead, status_code=201)
async def create_celula(body: OrgCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = Celula(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/coordenacoes", response_model=List[OrgRead])
async def list_coordenacoes(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Coordenacao))
    return r.scalars().all()


@router.post("/coordenacoes", response_model=OrgRead, status_code=201)
async def create_coordenacao(body: OrgCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = Coordenacao(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/cargos", response_model=List[OrgRead])
async def list_cargos(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Cargo))
    return r.scalars().all()


@router.post("/cargos", response_model=OrgRead, status_code=201)
async def create_cargo(body: OrgCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = Cargo(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Membros ==========

@router.get("/membros", response_model=List[MembroRead])
async def list_membros(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Membro).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/membros/{membro_id}", response_model=MembroRead)
async def get_membro(membro_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    return obj


@router.post("/membros", response_model=MembroRead, status_code=201)
async def create_membro(body: MembroCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = Membro(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/membros/{membro_id}", response_model=MembroRead)
async def update_membro(membro_id: int, body: MembroUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Alocações N:N ==========

def _handle_unique_conflict(e: IntegrityError) -> None:
    """Converte IntegrityError de UNIQUE em 409 Conflict."""
    raise HTTPException(409, "Alocação duplicada — este membro já está nesta posição")


@router.post("/membros/cargos", response_model=MembroCargoRead, status_code=201)
async def alocar_cargo(body: MembroCargoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    try:
        obj = MembroCargo(**body.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj
    except IntegrityError as e:
        _handle_unique_conflict(e)


@router.get("/membros/{membro_id}/cargos", response_model=List[MembroCargoRead])
async def get_cargos_membro(membro_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(MembroCargo).where(MembroCargo.membro_id == membro_id))
    return r.scalars().all()


@router.post("/membros/celulas", response_model=MembroCelulaRead, status_code=201)
async def alocar_celula(body: MembroCelulaCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    try:
        obj = MembroCelula(**body.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj
    except IntegrityError as e:
        _handle_unique_conflict(e)


@router.get("/membros/{membro_id}/celulas", response_model=List[MembroCelulaRead])
async def get_celulas_membro(membro_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(MembroCelula).where(MembroCelula.membro_id == membro_id))
    return r.scalars().all()


@router.post("/membros/coordenacoes", response_model=MembroCoordenacaoRead, status_code=201)
async def alocar_coordenacao(body: MembroCoordenacaoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    try:
        obj = MembroCoordenacao(**body.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj
    except IntegrityError as e:
        _handle_unique_conflict(e)


@router.post("/membros/projetos", response_model=MembroProjetoRead, status_code=201)
async def alocar_projeto(body: MembroProjetoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    try:
        obj = MembroProjeto(**body.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj
    except IntegrityError as e:
        _handle_unique_conflict(e)


@router.get("/membros/{membro_id}/projetos", response_model=List[MembroProjetoRead])
async def get_projetos_membro(membro_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(MembroProjeto).where(MembroProjeto.membro_id == membro_id))
    return r.scalars().all()
