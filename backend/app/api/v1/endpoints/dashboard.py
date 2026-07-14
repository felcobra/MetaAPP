"""Dashboard — Resumo executivo baseado no esquema real do banco."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.hr import Membro
from app.models.project_tracking import ProjetoExterno, AcompanhamentoProjeto
from app.models.financial import ContratoPagamento, Contrato
from app.models.commercial import Oportunidade, Lead

router = APIRouter()


@router.get("/", summary="Métricas gerais da plataforma")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna métricas consolidadas para a tela inicial."""

    # RH
    total_membros = (await db.execute(select(func.count(Membro.id)))).scalar() or 0

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
    for status, val in pag_rows:
        financeiro[status] = float(val or 0)
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
    for status, count in op_rows:
        oportunidades[status] = count

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
