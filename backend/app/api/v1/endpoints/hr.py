"""Endpoints de RH e Gestão Interna — Membros, Estrutura Organizacional, Alocações.

v2 — Melhorias:
- GET /membros: filtro opcional por nome (LIKE case-insensitive)
- DELETE /membros/{id}: soft-delete (seta ativo=False), requer admin
- GET /membros/{id}/resumo: perfil completo com cargos, células, coordenações e projetos
- GET /aniversariantes: aniversariantes do mês corrente (separado do dashboard)
- GET /orgchart/divisoes: lista divisões sem carregar árvore completa (mais rápido)
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from datetime import date

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_director_or_admin
from app.models.hr import (
    Celula, Coordenacao, Cargo, Membro,
    MembroCargo, MembroCelula, MembroCoordenacao, MembroProjeto,
    OrgDivisao, OrgNo,
)
from app.schemas.hr import (
    OrgCreate, OrgRead,
    MembroRead, MembroCreate, MembroUpdate,
    MembroCargoCreate, MembroCargoRead,
    MembroCelulaCreate, MembroCelulaRead,
    MembroCoordenacaoCreate, MembroCoordenacaoRead,
    MembroProjetoCreate, MembroProjetoRead,
    OrgNoCreate, OrgDivisaoCreate, OrgDivisaoRead, OrgNoRead,
)

logger = logging.getLogger("metaapp")
router = APIRouter()

# ========== Estrutura Organizacional ==========

@router.get("/celulas", response_model=List[OrgRead])
async def list_celulas(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Celula))
    return r.scalars().all()


@router.post("/celulas", response_model=OrgRead, status_code=201)
async def create_celula(body: OrgCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
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
async def create_coordenacao(body: OrgCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
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
async def create_cargo(body: OrgCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = Cargo(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Membros ==========

@router.get("/membros", response_model=List[MembroRead])
async def list_membros(
    nome: Optional[str] = Query(None, description="Filtrar por nome (busca parcial)"),
    apenas_ativos: bool = Query(True, description="Se True, retorna apenas membros ativos"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Lista membros com filtro opcional por nome e status ativo."""
    q = select(Membro)
    if apenas_ativos:
        q = q.where(Membro.ativo == True)
    if nome:
        q = q.where(Membro.nome.ilike(f"%{nome}%"))
    r = await db.execute(q.offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/aniversariantes", summary="Aniversariantes do mês corrente")
async def get_aniversariantes(
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mês (1-12). Default: mês atual"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna membros ativos que fazem aniversário no mês informado (ou mês atual)."""
    mes_alvo = mes or date.today().month
    r = await db.execute(
        select(Membro)
        .where(
            Membro.ativo == True,
            Membro.data_nascimento.isnot(None),
            # LOW-03: filtrar no SQL (MySQL func.extract) em vez de carregar
            # todos os membros em memória e filtrar em Python.
            func.extract("month", Membro.data_nascimento) == mes_alvo,
        )
        .order_by(func.extract("day", Membro.data_nascimento))
    )
    membros = r.scalars().all()
    return [
        {
            "id": m.id,
            "nome": m.nome,
            "data_nascimento": m.data_nascimento.isoformat() if m.data_nascimento else None,
            "foto_url": m.foto_url,
        }
        for m in membros
    ]


@router.get("/membros/{membro_id}", response_model=MembroRead)
async def get_membro(membro_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    return obj


@router.get("/membros/{membro_id}/resumo", summary="Perfil completo do membro com alocações")
async def get_membro_resumo(
    membro_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna dados completos do membro: perfil + cargos ativos + células + coordenações + projetos."""
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    m = r.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Membro não encontrado")

    # Cargos ativos
    cargos_r = await db.execute(
        select(MembroCargo, Cargo)
        .join(Cargo, MembroCargo.cargo_id == Cargo.id)
        .where(MembroCargo.membro_id == membro_id, MembroCargo.ativo == True)
    )
    cargos = [{"id": mc.id, "cargo": c.nome, "data_inicio": mc.data_inicio} for mc, c in cargos_r]

    # Células ativas
    celulas_r = await db.execute(
        select(MembroCelula, Celula)
        .join(Celula, MembroCelula.celula_id == Celula.id)
        .where(MembroCelula.membro_id == membro_id, MembroCelula.ativo == True)
    )
    celulas = [{"id": mc.id, "celula": c.nome} for mc, c in celulas_r]

    # Coordenações ativas
    coords_r = await db.execute(
        select(MembroCoordenacao, Coordenacao)
        .join(Coordenacao, MembroCoordenacao.coordenacao_id == Coordenacao.id)
        .where(MembroCoordenacao.membro_id == membro_id, MembroCoordenacao.ativo == True)
    )
    coordenacoes = [{"id": mc.id, "coordenacao": c.nome} for mc, c in coords_r]

    # Projetos ativos
    from app.models.project_tracking import ProjetoExterno
    projetos_r = await db.execute(
        select(MembroProjeto, ProjetoExterno)
        .join(ProjetoExterno, MembroProjeto.projeto_externo_id == ProjetoExterno.id)
        .where(MembroProjeto.membro_id == membro_id, MembroProjeto.ativo == True)
    )
    projetos = [{"id": mp.id, "projeto": p.nome, "papel": mp.papel} for mp, p in projetos_r]

    return {
        "id": m.id,
        "nome": m.nome,
        "email": m.email,
        "telefone": m.telefone,
        "foto_url": m.foto_url,
        "data_entrada": m.data_entrada.isoformat() if m.data_entrada else None,
        "data_nascimento": m.data_nascimento.isoformat() if m.data_nascimento else None,
        "destaque_texto": m.destaque_texto,
        "ativo": m.ativo,
        "cargos": cargos,
        "celulas": celulas,
        "coordenacoes": coordenacoes,
        "projetos": projetos,
    }


@router.post("/membros", response_model=MembroRead, status_code=201)
async def create_membro(body: MembroCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = Membro(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/membros/{membro_id}", response_model=MembroRead)
async def update_membro(membro_id: int, body: MembroUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/membros/{membro_id}", status_code=204, summary="Desativar membro (soft-delete)")
async def delete_membro(
    membro_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Soft-delete: seta ativo=False preservando histórico de alocações e projetos.
    Requer permissão de administrador.
    """
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    obj.ativo = False
    await db.flush()
    logger.info("Membro %s (%s) desativado", membro_id, obj.nome)


# ========== Alocações N:N ==========

def _handle_unique_conflict(e: IntegrityError) -> None:
    """Converte IntegrityError de UNIQUE em 409 Conflict."""
    raise HTTPException(409, "Alocação duplicada — este membro já está nesta posição")


@router.post("/membros/cargos", response_model=MembroCargoRead, status_code=201)
async def alocar_cargo(body: MembroCargoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
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
async def alocar_celula(body: MembroCelulaCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
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
async def alocar_coordenacao(body: MembroCoordenacaoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    try:
        obj = MembroCoordenacao(**body.model_dump())
        db.add(obj)
        await db.flush()
        await db.refresh(obj)
        return obj
    except IntegrityError as e:
        _handle_unique_conflict(e)


@router.post("/membros/projetos", response_model=MembroProjetoRead, status_code=201)
async def alocar_projeto(body: MembroProjetoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
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


# ========== OrgChart hierárquico ==========

def _build_tree(no: OrgNo) -> dict:
    """Converte um OrgNo SQLAlchemy em dict recursivo para o schema OrgNoRead."""
    membro_data = None
    if no.membro:
        m = no.membro
        membro_data = {
            "id": m.id,
            "nome": m.nome,
            "email": m.email,
            "telefone": m.telefone,
            "foto_url": m.foto_url,
        }
    return {
        "id": no.id,
        "titulo": no.titulo,
        "membro": membro_data,
        "filhos": [_build_tree(filho) for filho in (no.filhos or [])],
    }


@router.get("/orgchart/divisoes", summary="Lista divisões do organograma (sem carregar árvore)")
async def list_divisoes(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Lista rápida de divisões sem carregar a árvore de nós.
    Use para popular selects/dropdowns antes de caregar o orgchart completo.
    """
    r = await db.execute(select(OrgDivisao).order_by(OrgDivisao.ordem))
    divisoes = r.scalars().all()
    return [{"id": d.id, "nome": d.nome, "slug": d.slug, "ordem": d.ordem} for d in divisoes]


@router.get("/orgchart", summary="Árvore hierárquica do organograma (todas as divisões)")
async def get_orgchart(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna a árvore hierárquica completa do organograma no formato OrgDivision[]
    que o frontend consome. Carrega divisões ordenadas com nós raiz eager-loaded.
    """
    r = await db.execute(
        select(OrgDivisao)
        .options(
            selectinload(OrgDivisao.nos)
            .selectinload(OrgNo.filhos)
            .selectinload(OrgNo.filhos)
            .selectinload(OrgNo.filhos)  # 3 níveis de profundidade
        )
        .order_by(OrgDivisao.ordem)
    )
    divisoes = r.scalars().all()

    result = []
    for div in divisoes:
        nos_raiz = [n for n in div.nos if n.parent_id is None]
        root_data = _build_tree(nos_raiz[0]) if nos_raiz else None
        result.append({
            "id": div.slug,
            "label": div.nome,
            "root": root_data,
        })
    return result


@router.post("/orgchart/divisoes", response_model=dict, status_code=201, summary="Criar divisão do organograma")
async def create_divisao(
    body: OrgDivisaoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = OrgDivisao(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return {"id": obj.id, "nome": obj.nome, "slug": obj.slug}


@router.post("/orgchart/nos", response_model=dict, status_code=201, summary="Criar/mover nó no organograma")
async def create_no(
    body: OrgNoCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    obj = OrgNo(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return {"id": obj.id, "titulo": obj.titulo, "divisao_id": obj.divisao_id}


@router.delete("/orgchart/nos/{no_id}", status_code=204, summary="Remover nó (cascade nos filhos)")
async def delete_no(
    no_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    r = await db.execute(select(OrgNo).where(OrgNo.id == no_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Nó não encontrado")
    await db.delete(obj)
