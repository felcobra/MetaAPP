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
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_director_or_admin
from app.api.v1.periodo import Periodo, periodo_param
from app.models.commercial import (
    DimLeadOrigem, DimMotivoPerdida, Lead, Oportunidade, OportunidadePhaseHistory
)
from app.models.financial import Cliente
from app.models.hr import Coordenacao
from app.schemas.commercial import (
    DimBaseRead, DimCreate,
    LeadRead, LeadCreate, LeadUpdate,
    OportunidadeRead, OportunidadeCreate, OportunidadeUpdate,
    PaginatedOportunidades,
    PhaseHistoryRead, PhaseHistoryCreate,
)

logger = logging.getLogger("metaapp")
router = APIRouter()

# Ordem canônica do funil comercial (conferida contra a BDU, que lê o mesmo
# banco). `oportunidade.fase_atual_nome` também carrega fases de outros
# pipes/boards importados pro mesmo campo (ex.: "IVE Social", que não é etapa
# de venda) — sem uma lista fixa, esses valores viravam "estágios" fantasmas
# no funil. Fases fora desta lista são histórico de outro processo, não do
# funil comercial, e ficam de fora da leitura — mas continuam contáveis em
# outras rotas (ex.: /oportunidades) que não filtram por fase.
_FUNIL_FASES_CANONICAS = [
    "Caixa de Entrada",
    "Ligação Diagnóstico",
    "Reunião Diagnóstico",
    "Proposta Comercial",
    "Negociação",
    "Pré-Assinatura de Contrato",
]

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
    r = await db.execute(q.order_by(Lead.id.desc()).offset(skip).limit(limit))
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

@router.get("/resumo", summary="Agregados da tela Comercial (funil, origens, motivos, resumo)")
async def get_resumo_comercial(
    periodo: Periodo = Depends(periodo_param),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Tudo que os cards da tela Comercial precisam, numa chamada só.

    O recorte de período incide sobre `oportunidade.criado_em` — a data de
    entrada no funil. Um comentário antigo aqui dizia que filtrar por data
    esconderia registros, porque `criado_em` seria nulo numa parte relevante
    das oportunidades importadas do Pipefy; isso não vale mais para os dados
    atuais (as oportunidades têm data, de 2019 em diante). Ainda assim, uma
    linha sem data fica de fora de qualquer recorte — só aparece em "Tudo".

    `clientes` é a única métrica imune ao recorte: `cliente` não tem coluna de
    data, então o número é sempre o total da base. Ver a chave `recorte` na
    resposta, que a tela usa para dizer isso na cara da pessoa.
    """
    filtro_data = periodo.condicoes(Oportunidade.criado_em)
    # Funil — oportunidades abertas, agrupadas pela fase em que pararam.
    # Restrito às fases canônicas do funil comercial (ver _FUNIL_FASES_CANONICAS)
    # e sempre nessa ordem, com 0 explícito para fase sem oportunidade parada —
    # um GROUP BY livre listava qualquer valor de fase_atual_nome, incluindo
    # fases de outros processos importados pro mesmo campo.
    funil_rows = await db.execute(
        select(Oportunidade.fase_atual_nome, func.count(Oportunidade.id))
        .where(
            Oportunidade.status_terminal == "ativo",
            Oportunidade.fase_atual_nome.in_(_FUNIL_FASES_CANONICAS),
            *filtro_data,
        )
        .group_by(Oportunidade.fase_atual_nome)
    )
    contagem_por_fase = {nome: total for nome, total in funil_rows}
    funil = [
        {"label": fase, "value": contagem_por_fase.get(fase, 0)}
        for fase in _FUNIL_FASES_CANONICAS
    ]

    # Desfechos por status_terminal.
    status_rows = await db.execute(
        select(Oportunidade.status_terminal, func.count(Oportunidade.id))
        .where(*filtro_data)
        .group_by(Oportunidade.status_terminal)
    )
    por_status = {s: c for s, c in status_rows}

    valor_ganho = (await db.execute(
        select(func.sum(Oportunidade.valor_fechado))
        .where(Oportunidade.status_terminal == "fechado", *filtro_data)
    )).scalar() or 0

    # Origens e motivos de perda: a contagem sai das oportunidades, não das
    # tabelas de dimensão — dimensão sem oportunidade vinculada não vira barra.
    #
    # canonical_value é uma curadoria manual sobre raw_value (o texto cru que
    # veio do Pipefy/CRM) e a maior parte das linhas de dim_lead_origem/
    # dim_motivo_perda nunca passou por essa curadoria — canonical_value fica
    # NULL. Antes disto, o GROUP BY canonical_value jogava toda essa maioria
    # não-curada numa única fatia "Sem origem"/"Não informado", escondendo a
    # origem real (Site, Indicação, ...) que só existe em raw_value. Com
    # COALESCE, usa o valor curado quando existe e cai pro cru quando não.
    origem_rows = await db.execute(
        select(
            func.coalesce(DimLeadOrigem.canonical_value, DimLeadOrigem.raw_value),
            func.count(Oportunidade.id),
        )
        .join(Oportunidade, Oportunidade.origem_id == DimLeadOrigem.id)
        .where(*filtro_data)
        .group_by(func.coalesce(DimLeadOrigem.canonical_value, DimLeadOrigem.raw_value))
        .order_by(desc(func.count(Oportunidade.id)))
        .limit(8)
    )
    origens = [{"label": nome or "Sem origem", "value": total} for nome, total in origem_rows]

    motivo_rows = await db.execute(
        select(
            func.coalesce(DimMotivoPerdida.canonical_value, DimMotivoPerdida.raw_value),
            func.count(Oportunidade.id),
        )
        .join(Oportunidade, Oportunidade.motivo_perda_id == DimMotivoPerdida.id)
        .where(*filtro_data)
        .group_by(func.coalesce(DimMotivoPerdida.canonical_value, DimMotivoPerdida.raw_value))
        .order_by(desc(func.count(Oportunidade.id)))
        .limit(15)
    )
    motivos = [{"label": nome or "Não informado", "value": total} for nome, total in motivo_rows]

    # Sem recorte: `cliente` não tem coluna de data (ver docstring).
    total_clientes = (await db.execute(select(func.count(Cliente.id)))).scalar() or 0
    total_op = sum(por_status.values())
    fechadas = por_status.get("fechado", 0)

    return {
        "recorte": {
            "ativo": periodo.ativo,
            "clientes_sem_recorte": periodo.ativo,
        },
        "funil": funil,
        "desfechos": {
            "ganhos": fechadas,
            # O enum não tem um estado "perdido": desistido (o lead saiu) e
            # recusado (a Meta não seguiu) são as duas formas de perder.
            "perdidos": por_status.get("desistido", 0) + por_status.get("recusado", 0),
            "postergados": por_status.get("postergado", 0),
            "valor_ganho": float(valor_ganho),
        },
        "origens": origens,
        "motivos_perda": motivos,
        "resumo": {
            "pipeline_aberto": por_status.get("ativo", 0),
            # Conversão sobre o total de oportunidades já registradas.
            "taxa_conversao_pct": round(fechadas / total_op * 100) if total_op else 0,
            "clientes": total_clientes,
            "valor_ganho": float(valor_ganho),
        },
    }


@router.get("/tabela-oportunidades", summary="Oportunidades com nomes resolvidos (tabela)")
async def get_tabela_oportunidades(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    periodo: Periodo = Depends(periodo_param),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Como /oportunidades, mas com lead, origem, motivo e coordenação já
    resolvidos em nome — a tabela mostra texto, e resolver isso no cliente
    exigiria uma chamada por linha.

    O mesmo recorte de /resumo se aplica aqui, e o `total` também é o do
    recorte — se a contagem da paginação ignorasse o filtro, a tabela
    anunciaria páginas que não existem.
    """
    filtro_data = periodo.condicoes(Oportunidade.criado_em)

    total = (await db.execute(
        select(func.count(Oportunidade.id)).where(*filtro_data)
    )).scalar() or 0
    total_pages = max(1, -(-total // page_size))
    skip = (page - 1) * page_size

    # COALESCE(canonical_value, raw_value): canonical_value é curadoria manual
    # e a maioria das linhas de dim_lead_origem/dim_motivo_perda nunca passou
    # por ela — usar só canonical_value deixava a coluna vazia ("—") na
    # maior parte das linhas mesmo quando a origem/motivo cru existia.
    origem_nome = func.coalesce(DimLeadOrigem.canonical_value, DimLeadOrigem.raw_value)
    motivo_nome = func.coalesce(DimMotivoPerdida.canonical_value, DimMotivoPerdida.raw_value)

    rows = await db.execute(
        select(
            Oportunidade.id,
            Oportunidade.criado_em,
            Oportunidade.status_terminal,
            Lead.nome,
            origem_nome,
            Coordenacao.sigla,
            motivo_nome,
        )
        .outerjoin(Lead, Lead.id == Oportunidade.lead_id)
        .outerjoin(DimLeadOrigem, DimLeadOrigem.id == Oportunidade.origem_id)
        .outerjoin(Coordenacao, Coordenacao.id == Oportunidade.coordenacao_id)
        .outerjoin(DimMotivoPerdida, DimMotivoPerdida.id == Oportunidade.motivo_perda_id)
        .where(*filtro_data)
        .order_by(desc(Oportunidade.id))
        .offset(skip)
        .limit(page_size)
    )

    items = [
        {
            "id": op_id,
            "criado_em": criado.isoformat() if criado else None,
            "status": status_terminal,
            "contato": nome or "—",
            "origem": origem or "—",
            "coordenacao": sigla or "—",
            "motivo": motivo or "—",
        }
        for op_id, criado, status_terminal, nome, origem, sigla, motivo in rows
    ]

    return {
        "items": items,
        "total": total,
        "total_pages": total_pages,
        "current_page": page,
        "page_from": skip + 1 if total else 0,
        "page_to": min(skip + page_size, total),
    }


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
        query = query.where(Oportunidade.status_terminal == status)
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

    old_fase_id = op.fase_atual_id
    old_fase_nome = op.fase_atual_nome
    updates = body.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(op, k, v)

    # Registra histórico automaticamente se a fase mudou
    if "fase_atual_nome" in updates and updates["fase_atual_nome"] != old_fase_nome:
        history = OportunidadePhaseHistory(
            oportunidade_id=op_id,
            from_phase_id=old_fase_id,
            from_phase_nome=old_fase_nome,
            to_phase_id=updates.get("fase_atual_id"),
            to_phase_nome=updates["fase_atual_nome"],
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
        .order_by(OportunidadePhaseHistory.moved_at)
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
