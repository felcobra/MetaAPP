"""Endpoints de RH e Gestão Interna — Membros, Estrutura Organizacional, Alocações.

v3 — Alinhado ao schema real do banco de produção da empresa (banco_de_dados_bd):
- `membro` no banco só tem id/nome/email. Campos de perfil estendido (telefone,
  foto, data de nascimento, data de entrada, destaque, e o "ativo" usado para
  soft-delete) vivem em `membro_perfil_metaapp`, tabela exclusiva do MetaApp.
- celula/coordenacao/cargo não têm mais campo `descricao` (não existe no banco).
- Alocações N:N (membro_cargo/celula/coordenacao) não têm mais data_inicio/
  data_fim/ativo — são apenas vínculos simples no banco real.
"""
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload
from datetime import date

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_director_or_admin
from app.models.user import User
from app.models.hr import (
    Celula, Coordenacao, Cargo, Membro, MembroPerfilMetaapp,
    MembroCargo, MembroCelula, MembroCoordenacao, MembroProjeto,
    OrgDivisao, OrgNo, OrgNoMembro,
)
from app.schemas.hr import (
    CelulaCreate, CelulaRead,
    CoordenacaoCreate, CoordenacaoRead,
    CargoCreate, CargoRead,
    MembroRead, MembroListRead, MembroCreate, MembroUpdate, MembroStatusUpdate,
    MembroPerfilRead, MembroPerfilPublicRead, MembroPerfilUpdate,
    MembroCargoCreate, MembroCargoRead,
    MembroCelulaCreate, MembroCelulaRead,
    MembroCoordenacaoCreate, MembroCoordenacaoRead,
    MembroProjetoCreate, MembroProjetoRead,
    OrgNoCreate, OrgNoUpdate, OrgDivisaoCreate, OrgDivisaoRead, OrgNoRead,
)

logger = logging.getLogger("metaapp")
router = APIRouter()

# ========== Estrutura Organizacional ==========

@router.get("/celulas", response_model=List[CelulaRead])
async def list_celulas(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Celula))
    return r.scalars().all()


@router.post("/celulas", response_model=CelulaRead, status_code=201)
async def create_celula(body: CelulaCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = Celula(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/coordenacoes", response_model=List[CoordenacaoRead])
async def list_coordenacoes(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Coordenacao))
    return r.scalars().all()


@router.post("/coordenacoes", response_model=CoordenacaoRead, status_code=201)
async def create_coordenacao(body: CoordenacaoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = Coordenacao(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/cargos", response_model=List[CargoRead])
async def list_cargos(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Cargo))
    return r.scalars().all()


@router.post("/cargos", response_model=CargoRead, status_code=201)
async def create_cargo(body: CargoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = Cargo(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Perfil estendido (exclusivo do MetaApp) ==========

async def _get_or_create_perfil(db: AsyncSession, membro_id: int) -> MembroPerfilMetaapp:
    r = await db.execute(
        select(MembroPerfilMetaapp).where(MembroPerfilMetaapp.membro_id == membro_id)
    )
    perfil = r.scalar_one_or_none()
    if not perfil:
        perfil = MembroPerfilMetaapp(membro_id=membro_id)
        db.add(perfil)
        await db.flush()
        await db.refresh(perfil)
    return perfil


@router.get("/membros/{membro_id}/perfil", response_model=MembroPerfilPublicRead)
async def get_perfil_membro(membro_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404, "Membro não encontrado")
    return await _get_or_create_perfil(db, membro_id)


@router.patch("/membros/{membro_id}/perfil", response_model=MembroPerfilRead)
async def update_perfil_membro(
    membro_id: int, body: MembroPerfilUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404, "Membro não encontrado")

    # Só a própria pessoa (via membro vinculado à conta) ou admin/diretor
    # editam um perfil — sem isso, qualquer usuário logado editaria o
    # perfil de qualquer outro só trocando o membro_id na URL.
    if current_user.role not in ("admin", "director"):
        vinculo = await db.execute(
            select(MembroPerfilMetaapp.id).where(
                MembroPerfilMetaapp.membro_id == membro_id,
                MembroPerfilMetaapp.user_id == current_user.id,
            )
        )
        if vinculo.scalar_one_or_none() is None:
            raise HTTPException(403, "Você só pode editar o seu próprio perfil.")

    perfil = await _get_or_create_perfil(db, membro_id)
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(perfil, k, v)
    await db.flush()
    await db.refresh(perfil)
    return perfil


# ========== Membros ==========

@router.get("/membros", response_model=List[MembroListRead])
async def list_membros(
    nome: Optional[str] = Query(None, description="Filtrar por nome (busca parcial)", max_length=100),
    apenas_ativos: bool = Query(True, description="Se True, retorna apenas membros ativos"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Lista membros com filtro opcional por nome e status ativo.
    'ativo' é controlado pelo MetaApp (membro_perfil_metaapp), não pelo banco real.
    """
    q = select(Membro, MembroPerfilMetaapp.ativo, MembroPerfilMetaapp.status_vinculo).outerjoin(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
    if apenas_ativos:
        q = q.where((MembroPerfilMetaapp.ativo.is_(None)) | (MembroPerfilMetaapp.ativo == True))
    if nome:
        q = q.where(Membro.nome.ilike(f"%{nome}%"))
    r = await db.execute(q.offset(skip).limit(limit))
    return [
        {
            "id": m.id,
            "nome": m.nome,
            "email": m.email,
            "ativo": ativo if ativo is not None else True,
            "status_vinculo": status_vinculo if status_vinculo is not None else "ativo",
        }
        for m, ativo, status_vinculo in r
    ]


@router.get("/aniversariantes", summary="Aniversariantes do mês corrente")
async def get_aniversariantes(
    mes: Optional[int] = Query(None, ge=1, le=12, description="Mês (1-12). Default: mês atual"),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna membros ativos que fazem aniversário no mês informado (ou mês atual)."""
    mes_alvo = mes or date.today().month
    r = await db.execute(
        select(Membro, MembroPerfilMetaapp)
        .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where(
            MembroPerfilMetaapp.ativo == True,
            MembroPerfilMetaapp.data_nascimento.isnot(None),
            func.extract("month", MembroPerfilMetaapp.data_nascimento) == mes_alvo,
        )
        .order_by(func.extract("day", MembroPerfilMetaapp.data_nascimento))
    )
    return [
        {
            "id": m.id,
            "nome": m.nome,
            "data_nascimento": p.data_nascimento.isoformat() if p.data_nascimento else None,
            "foto_url": p.foto_url,
        }
        for m, p in r
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
    """Retorna dados completos do membro: perfil + cargos + células + coordenações + projetos."""
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    m = r.scalar_one_or_none()
    if not m:
        raise HTTPException(404, "Membro não encontrado")

    perfil = await _get_or_create_perfil(db, membro_id)

    cargos_r = await db.execute(
        select(MembroCargo, Cargo)
        .join(Cargo, MembroCargo.cargo_id == Cargo.id)
        .where(MembroCargo.membro_id == membro_id)
    )
    cargos = [{"id": mc.id, "cargo": c.nome} for mc, c in cargos_r]

    celulas_r = await db.execute(
        select(MembroCelula, Celula)
        .join(Celula, MembroCelula.celula_id == Celula.id)
        .where(MembroCelula.membro_id == membro_id)
    )
    celulas = [{"id": mc.id, "celula": c.nome} for mc, c in celulas_r]

    coords_r = await db.execute(
        select(MembroCoordenacao, Coordenacao)
        .join(Coordenacao, MembroCoordenacao.coordenacao_id == Coordenacao.id)
        .where(MembroCoordenacao.membro_id == membro_id)
    )
    coordenacoes = [{"id": mc.id, "coordenacao": c.nome} for mc, c in coords_r]

    from app.models.project_tracking import ProjetoExterno
    projetos_r = await db.execute(
        select(MembroProjeto, ProjetoExterno)
        .join(ProjetoExterno, MembroProjeto.projeto_externo_id == ProjetoExterno.id)
        .where(MembroProjeto.membro_id == membro_id)
    )
    projetos = [
        {"id": mp.id, "projeto": p.nome, "data_entrada": mp.data_entrada, "data_saida": mp.data_saida}
        for mp, p in projetos_r
    ]

    return {
        "id": m.id,
        "nome": m.nome,
        "email": m.email,
        "telefone": perfil.telefone,
        "foto_url": perfil.foto_url,
        "data_entrada": perfil.data_entrada.isoformat() if perfil.data_entrada else None,
        "data_nascimento": perfil.data_nascimento.isoformat() if perfil.data_nascimento else None,
        "destaque_texto": perfil.destaque_texto,
        "ativo": perfil.ativo,
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


@router.patch("/membros/{membro_id}/status", response_model=MembroListRead)
async def update_membro_status(membro_id: int, body: MembroStatusUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    
    perfil = await _get_or_create_perfil(db, membro_id)
    perfil.ativo = body.ativo
    perfil.status_vinculo = body.status_vinculo
    await db.flush()
    
    return {
        "id": obj.id,
        "nome": obj.nome,
        "email": obj.email,
        "ativo": perfil.ativo,
        "status_vinculo": perfil.status_vinculo
    }


@router.delete("/membros/{membro_id}", status_code=204, summary="Desativar membro (soft-delete no MetaApp)")
async def delete_membro(
    membro_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Soft-delete: seta ativo=False em membro_perfil_metaapp, preservando o
    cadastro real (`membro`) intocado. Requer permissão de administrador.
    """
    r = await db.execute(select(Membro).where(Membro.id == membro_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Membro não encontrado")
    perfil = await _get_or_create_perfil(db, membro_id)
    perfil.ativo = False
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


# ========== OrgChart hierárquico (exclusivo do MetaApp) ==========

def _membro_resumo(m: Membro, perfil: MembroPerfilMetaapp | None) -> dict:
    return {
        "id": m.id,
        "nome": m.nome,
        "email": m.email,
        "telefone": perfil.telefone if perfil else None,
        "foto_url": perfil.foto_url if perfil else None,
    }


def _build_tree(no: OrgNo, ctx: dict) -> dict:
    """Converte um OrgNo SQLAlchemy em dict recursivo para o frontend.

    `ctx` traz lookups pré-calculados (perfis, membros por cargo/coordenação,
    nomes de cargo/coordenação) montados uma vez em `get_orgchart` — evita
    lazy-load fora do greenlet async e uma query por nó.
    """
    membro_data = None
    equipe_data = None

    manual_ids = ctx["manual_membros"].get(no.id, set())

    if no.membro:
        membro_data = _membro_resumo(no.membro, ctx["perfis_by_membro"].get(no.membro.id))
    elif no.cargo_id or manual_ids:
        # Nó de time: a lista de pessoas soma duas fontes —
        # 1) quem já tem esse cargo (e essa coordenação, se informada) no RH,
        #    derivado sozinho, sem retrabalho, e que acompanha o RH;
        # 2) quem foi adicionado à mão (org_no_membro), para times ad-hoc que
        #    não correspondem a nenhum cargo (ex: "Equipe de Conteúdo").
        membro_ids = set(ctx["membros_por_cargo"].get(no.cargo_id, set())) if no.cargo_id else set()
        if no.cargo_id and no.coordenacao_id:
            membro_ids &= ctx["membros_por_coordenacao"].get(no.coordenacao_id, set())
        membro_ids |= manual_ids

        membros_time = []
        for membro_id in membro_ids:
            m = ctx["membros_by_id"].get(membro_id)
            if not m:
                continue
            perfil = ctx["perfis_by_membro"].get(membro_id)
            if perfil is not None and not perfil.ativo:
                continue
            membros_time.append(_membro_resumo(m, perfil))
        membros_time.sort(key=lambda item: item["nome"])

        equipe_data = {
            "cargo_id": no.cargo_id,
            "cargo_nome": ctx["cargos_by_id"].get(no.cargo_id) if no.cargo_id else None,
            "coordenacao_id": no.coordenacao_id,
            "coordenacao_nome": ctx["coordenacoes_by_id"].get(no.coordenacao_id) if no.coordenacao_id else None,
            "membros": membros_time,
            "membro_ids_manual": sorted(manual_ids),
        }

    return {
        "id": no.id,
        "titulo": no.titulo,
        "membro": membro_data,
        "equipe": equipe_data,
        "filhos": [_build_tree(filho, ctx) for filho in (no.filhos or [])],
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

    O eager-load carrega `membro` em CADA nível (raiz e cada `filhos`), não só
    `filhos` em cadeia — `_build_tree` lê `no.membro` em todo nó que visita, e
    sem isso o acesso disparava um lazy-load fora do greenlet async
    (AsyncSession não permite I/O síncrono implícito), derrubando a rota com
    `MissingGreenlet` sempre que um nó tinha `membro_id` preenchido.
    """
    r = await db.execute(
        select(OrgDivisao)
        .options(
            selectinload(OrgDivisao.nos).options(
                selectinload(OrgNo.membro),
                selectinload(OrgNo.filhos).options(
                    selectinload(OrgNo.membro),
                    selectinload(OrgNo.filhos).options(
                        selectinload(OrgNo.membro),
                        selectinload(OrgNo.filhos).selectinload(OrgNo.membro),  # 3 níveis de profundidade
                    ),
                ),
            )
        )
        .order_by(OrgDivisao.ordem)
    )
    divisoes = r.scalars().all()

    perfis_r = await db.execute(select(MembroPerfilMetaapp))
    perfis_by_membro = {p.membro_id: p for p in perfis_r.scalars().all()}

    membros_r = await db.execute(select(Membro))
    membros_by_id = {m.id: m for m in membros_r.scalars().all()}

    membros_por_cargo: dict[int, set[int]] = {}
    mc_r = await db.execute(select(MembroCargo.membro_id, MembroCargo.cargo_id))
    for membro_id, cargo_id in mc_r.all():
        membros_por_cargo.setdefault(cargo_id, set()).add(membro_id)

    membros_por_coordenacao: dict[int, set[int]] = {}
    mco_r = await db.execute(select(MembroCoordenacao.membro_id, MembroCoordenacao.coordenacao_id))
    for membro_id, coordenacao_id in mco_r.all():
        membros_por_coordenacao.setdefault(coordenacao_id, set()).add(membro_id)

    cargos_by_id = {c.id: c.nome for c in (await db.execute(select(Cargo))).scalars().all()}
    coordenacoes_by_id = {c.id: c.nome for c in (await db.execute(select(Coordenacao))).scalars().all()}

    manual_membros: dict[int, set[int]] = {}
    manual_r = await db.execute(select(OrgNoMembro.org_no_id, OrgNoMembro.membro_id))
    for org_no_id, membro_id in manual_r.all():
        manual_membros.setdefault(org_no_id, set()).add(membro_id)

    ctx = {
        "perfis_by_membro": perfis_by_membro,
        "membros_by_id": membros_by_id,
        "membros_por_cargo": membros_por_cargo,
        "membros_por_coordenacao": membros_por_coordenacao,
        "cargos_by_id": cargos_by_id,
        "coordenacoes_by_id": coordenacoes_by_id,
        "manual_membros": manual_membros,
    }

    result = []
    for div in divisoes:
        nos_raiz = [n for n in div.nos if n.parent_id is None]
        root_data = _build_tree(nos_raiz[0], ctx) if nos_raiz else None
        result.append({
            "id": div.slug,
            "divisao_num_id": div.id,   # ID numérico — usado pelo painel admin para POST /orgchart/nos
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
    dados = body.model_dump()
    membro_ids_manual = set(dados.pop("membro_ids_manual", []))
    # membro_id (1 pessoa) e cargo_id (time derivado do RH) são mutuamente
    # exclusivos — cargo_id manda se os dois vierem preenchidos.
    if dados.get("cargo_id"):
        dados["membro_id"] = None
    else:
        dados["coordenacao_id"] = None
    obj = OrgNo(**dados)
    db.add(obj)
    await db.flush()
    for membro_id in membro_ids_manual:
        db.add(OrgNoMembro(org_no_id=obj.id, membro_id=membro_id))
    await db.flush()
    await db.refresh(obj)
    return {"id": obj.id, "titulo": obj.titulo, "divisao_id": obj.divisao_id}


@router.patch("/orgchart/nos/{no_id}", response_model=dict, summary="Editar título/membro de um nó existente")
async def update_no(
    no_id: int,
    body: OrgNoUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Corrige o título (cargo) ou o membro vinculado de um nó sem tocar na
    hierarquia. Existe para consertar nós criados com o nome da pessoa no
    campo de título em vez do cargo — sem isso, a única forma de corrigir
    seria apagar o nó, o que arrasta os filhos junto (cascade)."""
    r = await db.execute(select(OrgNo).where(OrgNo.id == no_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Nó não encontrado")
    obj.titulo = body.titulo
    # membro_id (1 pessoa) e cargo_id (time derivado do RH) são mutuamente
    # exclusivos — cargo_id manda se os dois vierem preenchidos.
    if body.cargo_id:
        obj.membro_id = None
        obj.cargo_id = body.cargo_id
        obj.coordenacao_id = body.coordenacao_id
    else:
        obj.membro_id = body.membro_id
        obj.cargo_id = None
        obj.coordenacao_id = None

    # Lista manual: substitui por completo (apaga e recria) em vez de
    # comparar diferenças — mais simples e evita duplicar em caso de dois
    # PATCHes concorrentes na mesma lista.
    await db.execute(delete(OrgNoMembro).where(OrgNoMembro.org_no_id == no_id))
    for membro_id in set(body.membro_ids_manual):
        db.add(OrgNoMembro(org_no_id=no_id, membro_id=membro_id))

    await db.flush()
    await db.refresh(obj)
    return {
        "id": obj.id,
        "titulo": obj.titulo,
        "membro_id": obj.membro_id,
        "cargo_id": obj.cargo_id,
        "coordenacao_id": obj.coordenacao_id,
    }


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
