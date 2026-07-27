"""Dashboard — Métricas executivas calculadas dinamicamente a partir dos dados reais.

v2 — Correções e melhorias:
- /deliveries-by-month: corrigido de strftime (SQLite) → DATE_FORMAT (MySQL)
- /engagement-by-area: corrigida lógica para filtrar projetos pela coordenação correta
  via membro_projeto → membro_coordenacao
- /alertas: novo endpoint com notificações ativas (pagamentos atrasados, aniversários,
  acompanhamentos vencidos há mais de 30 dias)
"""
from datetime import datetime, date, timedelta, timezone
from typing import List
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.hr import Membro, Coordenacao, MembroProjeto, MembroCoordenacao
from app.models.project_tracking import ProjetoExterno, AcompanhamentoProjeto
from app.models.financial import ContratoPagamento, Contrato
from app.models.commercial import Oportunidade, Lead

logger = logging.getLogger("metaapp")
router = APIRouter()


@router.get("/", summary="Métricas gerais da plataforma")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna métricas consolidadas para a tela inicial."""

    # RH
    total_membros = (await db.execute(select(func.count(Membro.id)).where(Membro.ativo == True))).scalar() or 0

    # Projetos
    total_projetos = (await db.execute(select(func.count(ProjetoExterno.id)))).scalar() or 0

    projetos_ativos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.notin_(["encerrado", "cancelado", "concluido"]))
    )).scalar() or 0

    total_acompanhamentos = (await db.execute(
        select(func.count(AcompanhamentoProjeto.id))
    )).scalar() or 0

    # Financeiro — parcelas por status
    pag_rows = await db.execute(
        select(ContratoPagamento.status, func.sum(ContratoPagamento.valor))
        .group_by(ContratoPagamento.status)
    )
    financeiro = {"pendente": 0.0, "pago": 0.0, "atrasado": 0.0, "cancelado": 0.0}
    for row_status, val in pag_rows:
        financeiro[row_status] = float(val or 0)
    financeiro["total_recebido"] = financeiro["pago"]
    financeiro["total_a_receber"] = financeiro["pendente"] + financeiro["atrasado"]

    # Total contratos ativos
    total_contratos = (await db.execute(select(func.count(Contrato.id)))).scalar() or 0

    # CRM — oportunidades por status
    op_rows = await db.execute(
        select(Oportunidade.status, func.count(Oportunidade.id))
        .group_by(Oportunidade.status)
    )
    oportunidades = {}
    for row_status, count in op_rows:
        oportunidades[row_status] = count

    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar() or 0

    return {
        "rh": {
            "total_membros": total_membros,
        },
        "projetos": {
            "total": total_projetos,
            "ativos": projetos_ativos,
            "total_acompanhamentos": total_acompanhamentos,
        },
        "financeiro": financeiro,
        "contratos": {
            "total": total_contratos,
        },
        "crm": {
            "total_leads": total_leads,
            "oportunidades": oportunidades,
        },
    }


@router.get("/home", summary="Dados do widget Home (revenue, funil, projetos, aniversários)")
async def get_home_data(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Endpoint dedicado à tela Home do frontend."""

    # Faturamento atual (soma dos pagamentos pagos no mês corrente)
    hoje = date.today()
    inicio_mes = hoje.replace(day=1)

    fat_atual = (await db.execute(
        select(func.sum(ContratoPagamento.valor))
        .where(
            ContratoPagamento.status == "pago",
            ContratoPagamento.data_pagamento >= inicio_mes,
        )
    )).scalar() or 0.0

    # Total faturado histórico
    fat_total = (await db.execute(
        select(func.sum(ContratoPagamento.valor))
        .where(ContratoPagamento.status == "pago")
    )).scalar() or 0.0

    # Em negociação (oportunidades ativas)
    total_em_neg = (await db.execute(
        select(func.count(Oportunidade.id)).where(Oportunidade.status == "ativo")
    )).scalar() or 0

    # Projetos overview
    projetos_ativos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.notin_(["encerrado", "cancelado", "concluido"]))
    )).scalar() or 0

    projetos_concluidos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.in_(["concluido"]))
    )).scalar() or 0

    # Aniversariantes do mês (data_nascimento no mês atual)
    aniv_rows = await db.execute(
        select(Membro)
        .where(
            Membro.ativo == True,
            func.extract("month", Membro.data_nascimento) == hoje.month,
        )
        .order_by(func.extract("day", Membro.data_nascimento))
        .limit(5)
    )
    aniversariantes = []
    for m in aniv_rows.scalars().all():
        initials = "".join(p[0].upper() for p in m.nome.split()[:2])
        aniversariantes.append({
            "initials": initials,
            "name": m.nome,
            "department": "",
        })

    # Reconhecimentos (membros com destaque_texto preenchido)
    rec_rows = await db.execute(
        select(Membro)
        .where(Membro.ativo == True, Membro.destaque_texto.isnot(None))
        .order_by(Membro.updated_at.desc())
        .limit(3)
    )
    reconhecimentos = []
    for m in rec_rows.scalars().all():
        initials = "".join(p[0].upper() for p in m.nome.split()[:2])
        reconhecimentos.append({
            "initials": initials,
            "name": m.nome,
            "achievement": m.destaque_texto,
        })

    # Sales funnel (oportunidades por fase)
    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar() or 0
    total_qualificados = total_em_neg
    op_fechadas = (await db.execute(
        select(func.count(Oportunidade.id)).where(Oportunidade.status == "fechado")
    )).scalar() or 0

    return {
        "revenue": {
            "fat_atual": float(fat_atual),
            "fat_total": float(fat_total),
            "em_negociacao_count": total_em_neg,
        },
        "sales_funnel": [
            {"label": "Leads", "value": total_leads, "percentage": 100},
            {"label": "Qualificados", "value": total_qualificados,
             "percentage": round(total_qualificados / total_leads * 100) if total_leads else 0},
            {"label": "Fechados", "value": op_fechadas,
             "percentage": round(op_fechadas / total_leads * 100) if total_leads else 0},
        ],
        "projects_overview": {
            "active": projetos_ativos,
            "completed": projetos_concluidos,
        },
        "birthdays": aniversariantes,
        "recognitions": reconhecimentos,
    }


@router.get("/kpis", summary="KPIs executivos (headcount, projetos, NPS, taxa de entrega)")
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """KPIs calculados dinamicamente. NPS e Taxa de Entrega calculados a partir
    das notas de acompanhamento de projetos.
    """
    # Headcount (apenas ativos)
    headcount = (await db.execute(
        select(func.count(Membro.id)).where(Membro.ativo == True)
    )).scalar() or 0

    # Projetos ativos
    projetos_ativos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.notin_(["encerrado", "cancelado", "concluido"]))
    )).scalar() or 0

    # Taxa de entrega — média de qualidade_entrega nos acompanhamentos (escala 1-5 → 0-100%)
    media_qualidade = (await db.execute(
        select(func.avg(AcompanhamentoProjeto.qualidade_entrega))
        .where(AcompanhamentoProjeto.qualidade_entrega.isnot(None))
    )).scalar()
    taxa_entrega = round((float(media_qualidade) / 5.0) * 100) if media_qualidade else None

    # NPS Interno — média de satisfacao_geral convertida para escala NPS (-100 a 100)
    # Escala: 1→-100, 3→0, 5→100
    media_satisfacao = (await db.execute(
        select(func.avg(AcompanhamentoProjeto.satisfacao_geral))
        .where(AcompanhamentoProjeto.satisfacao_geral.isnot(None))
    )).scalar()
    nps_interno = None
    if media_satisfacao:
        nps_interno = round(((float(media_satisfacao) - 1) / 4.0) * 200 - 100)

    return {
        "headcount": headcount,
        "projetos_ativos": projetos_ativos,
        "taxa_entrega_pct": taxa_entrega,
        "nps_interno": nps_interno,
    }


@router.get("/deliveries-by-month", summary="Entregas por mês (últimos 12 meses)")
async def get_deliveries_by_month(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Conta acompanhamentos por mês usando DATE_FORMAT (MySQL).
    Corrigido: versão anterior usava strftime() do SQLite (incompatível com MySQL).
    """
    rows = await db.execute(
        select(
            func.date_format(AcompanhamentoProjeto.data_avaliacao, "%Y-%m").label("mes"),
            func.count(AcompanhamentoProjeto.id).label("total"),
        )
        .where(AcompanhamentoProjeto.data_avaliacao.isnot(None))
        .group_by("mes")
        .order_by("mes")
        .limit(12)
    )
    return [{"month": row.mes, "value": row.total} for row in rows]


@router.get("/engagement-by-area", summary="Engajamento por área (satisfação média por coordenação)")
async def get_engagement_by_area(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Calcula a satisfação média de projetos segmentada por coordenação.

    Corrigido: versão anterior retornava a mesma média global para todas as áreas.
    Agora faz o join correto: acompanhamento → projeto → membro_projeto → membro_coordenacao.
    """
    r = await db.execute(select(Coordenacao).order_by(Coordenacao.id))
    coordenacoes = r.scalars().all()

    result = []
    for coord in coordenacoes:
        # Projetos cujos membros pertencem a esta coordenação
        media = (await db.execute(
            select(func.avg(AcompanhamentoProjeto.satisfacao_geral))
            .join(ProjetoExterno, AcompanhamentoProjeto.projeto_externo_id == ProjetoExterno.id)
            .join(MembroProjeto, MembroProjeto.projeto_externo_id == ProjetoExterno.id)
            .join(MembroCoordenacao, MembroCoordenacao.membro_id == MembroProjeto.membro_id)
            .where(
                MembroCoordenacao.coordenacao_id == coord.id,
                MembroCoordenacao.ativo == True,
                AcompanhamentoProjeto.satisfacao_geral.isnot(None),
            )
        )).scalar()

        score = round((float(media) / 5.0) * 100) if media else 0
        result.append({"area": coord.nome, "score": score})

    return result


@router.get("/active-projects", summary="Projetos ativos com progresso (tabela do Dashboard)")
async def get_active_projects(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna projetos ativos no formato que a tabela do Dashboard consome."""
    r = await db.execute(
        select(ProjetoExterno)
        .where(ProjetoExterno.status.notin_(["encerrado", "cancelado", "concluido"]))
        .order_by(ProjetoExterno.created_at.desc())
        .limit(20)
    )
    projetos = r.scalars().all()

    result = []
    for p in projetos:
        prog = p.progresso or 0
        if prog >= 70:
            visual_status = "no-prazo"
        elif prog >= 40:
            visual_status = "atencao"
        else:
            visual_status = "atrasado"

        result.append({
            "project": p.nome,
            "manager": p.cliente_nome or "—",
            "status": visual_status,
            "progress": prog,
        })
    return result


@router.get("/alertas", summary="Notificações e alertas ativos do sistema")
async def get_alertas(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna alertas que requerem atenção:
    - Pagamentos atrasados (vencidos e não pagos)
    - Acompanhamentos de projetos com mais de 30 dias sem atualização
    - Aniversariantes de hoje
    """
    hoje = date.today()
    alertas = []

    # 1. Pagamentos atrasados
    pag_atrasados = await db.execute(
        select(ContratoPagamento)
        .where(
            ContratoPagamento.status == "pendente",
            ContratoPagamento.data_vencimento < hoje,
        )
        .order_by(ContratoPagamento.data_vencimento)
        .limit(10)
    )
    for p in pag_atrasados.scalars().all():
        dias = (hoje - p.data_vencimento).days
        alertas.append({
            "tipo": "pagamento_atrasado",
            "nivel": "critico" if dias > 15 else "aviso",
            "mensagem": f"Pagamento de R$ {float(p.valor):.2f} venceu há {dias} dia(s)",
            "referencia_id": p.id,
            "data": p.data_vencimento.isoformat(),
        })

    # 2. Projetos ativos sem acompanhamento há 30+ dias
    limite_acomp = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)
    projetos_sem_acomp = await db.execute(
        select(ProjetoExterno)
        .where(
            ProjetoExterno.status.notin_(["encerrado", "cancelado", "concluido"]),
            ~ProjetoExterno.id.in_(
                select(AcompanhamentoProjeto.projeto_externo_id)
                .where(AcompanhamentoProjeto.data_avaliacao >= limite_acomp)
            )
        )
        .limit(10)
    )
    for p in projetos_sem_acomp.scalars().all():
        alertas.append({
            "tipo": "projeto_sem_acompanhamento",
            "nivel": "aviso",
            "mensagem": f"Projeto '{p.nome}' sem acompanhamento há mais de 30 dias",
            "referencia_id": p.id,
            "data": None,
        })

    # 3. Aniversariantes de hoje
    aniv_hoje = await db.execute(
        select(Membro)
        .where(
            Membro.ativo == True,
            func.extract("month", Membro.data_nascimento) == hoje.month,
            func.extract("day", Membro.data_nascimento) == hoje.day,
        )
    )
    for m in aniv_hoje.scalars().all():
        alertas.append({
            "tipo": "aniversario",
            "nivel": "info",
            "mensagem": f"🎂 Hoje é aniversário de {m.nome}!",
            "referencia_id": m.id,
            "data": hoje.isoformat(),
        })

    return {
        "total": len(alertas),
        "alertas": alertas,
    }
