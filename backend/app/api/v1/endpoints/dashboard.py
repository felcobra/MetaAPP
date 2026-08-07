"""Dashboard — Métricas executivas calculadas dinamicamente a partir dos dados reais.

v3 — Alinhado ao schema real do banco de produção da empresa (banco_de_dados_bd):
- `ativo`/`data_nascimento`/`destaque_texto` de Membro vêm de membro_perfil_metaapp
  (tabela exclusiva do MetaApp), não mais da tabela `membro` real.
- ProjetoExterno.status agora é o enum real (ativo/finalizado/pausado); não existem
  mais os campos `progresso`, `cliente_nome` nem `created_at` — progresso é estimado
  a partir do acompanhamento mais recente (`pct_conclusao`) e o cliente vem via
  Contrato → Cliente.
- Oportunidade.status virou Oportunidade.status_terminal.
- AcompanhamentoProjeto.qualidade_entrega/satisfacao_geral/data_avaliacao viraram
  eficacia_metodologia/satisfacao_cliente/data_resposta.
"""
from datetime import datetime, date, timedelta, timezone
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.hr import (
    Cargo, Membro, Celula, Coordenacao, MembroProjeto, MembroCelula,
    MembroCoordenacao, MembroPerfilMetaapp,
)
from app.models.project_tracking import ProjetoExterno, AcompanhamentoProjeto
from app.models.financial import Cliente, ContratoPagamento, Contrato
from app.models.service import Servico
from app.models.commercial import Oportunidade, Lead

logger = logging.getLogger("metaapp")
router = APIRouter()

_PROJETO_INATIVO = ("finalizado",)  # status que tiram o projeto da contagem de "ativos"

_PCT_FAIXA_MEIO = {
    "0-20%": 10, "21-40%": 30, "41-60%": 50, "61-80%": 70, "81-100%": 90,
}

# acompanhamento_projeto.status_cronograma guarda o texto que o consultor
# escolheu no PAPE. Traduzido aqui para os estados que a tabela colore.
# Os quatro valores foram conferidos contra o enum real do banco — faltar um
# deles aqui faria o projeto cair no fallback "sem-dados", ou seja, um projeto
# concluído apareceria como "sem PAPE respondido".
_STATUS_VISUAL = {
    "Dentro do prazo": "no-prazo",
    "Com risco de atraso": "atencao",
    "Atrasado": "atrasado",
    "Concluido": "concluido",
}


@router.get("/", summary="Métricas gerais da plataforma")
async def get_dashboard(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Retorna métricas consolidadas para a tela inicial."""

    # RH — ativos conforme membro_perfil_metaapp (membro sem perfil conta como ativo)
    total_membros = (await db.execute(
        select(func.count(Membro.id))
        .outerjoin(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where((MembroPerfilMetaapp.ativo.is_(None)) | (MembroPerfilMetaapp.ativo == True))
    )).scalar() or 0

    # Projetos
    total_projetos = (await db.execute(select(func.count(ProjetoExterno.id)))).scalar() or 0

    projetos_ativos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.notin_(_PROJETO_INATIVO))
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
        if row_status in financeiro:
            financeiro[row_status] = float(val or 0)
    financeiro["total_recebido"] = financeiro["pago"]
    financeiro["total_a_receber"] = financeiro["pendente"] + financeiro["atrasado"]

    total_contratos = (await db.execute(select(func.count(Contrato.id)))).scalar() or 0

    # CRM — oportunidades por status
    op_rows = await db.execute(
        select(Oportunidade.status_terminal, func.count(Oportunidade.id))
        .group_by(Oportunidade.status_terminal)
    )
    oportunidades = {row_status: count for row_status, count in op_rows}

    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar() or 0

    # Contagens que alimentam a faixa "sistema conectado" da Home. Ficam aqui,
    # e não num endpoint próprio, para a Home resolver a faixa inteira numa
    # chamada só.
    async def _contar(model) -> int:
        return (await db.execute(select(func.count(model.id)))).scalar() or 0

    total_celulas = await _contar(Celula)
    total_coordenacoes = await _contar(Coordenacao)
    total_servicos = await _contar(Servico)
    total_clientes = await _contar(Cliente)

    oportunidades_ativas = oportunidades.get("ativo", 0)

    valor_contratos = (await db.execute(
        select(func.sum(Contrato.valor_total))
    )).scalar() or 0

    return {
        "rh": {
            "total_membros": total_membros,
            "total_celulas": total_celulas,
            "total_coordenacoes": total_coordenacoes,
        },
        "projetos": {
            "total": total_projetos,
            "ativos": projetos_ativos,
            "total_acompanhamentos": total_acompanhamentos,
        },
        "servicos": {"total": total_servicos},
        "clientes": {"total": total_clientes},
        "financeiro": financeiro,
        "contratos": {"total": total_contratos, "valor_total": float(valor_contratos)},
        "crm": {
            "total_leads": total_leads,
            "oportunidades": oportunidades,
            "oportunidades_ativas": oportunidades_ativas,
        },
    }


@router.get("/home", summary="Dados do widget Home (revenue, funil, projetos, aniversários)")
async def get_home_data(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Endpoint dedicado à tela Home do frontend."""

    hoje = date.today()
    inicio_mes = hoje.replace(day=1)

    fat_atual = (await db.execute(
        select(func.sum(ContratoPagamento.valor))
        .where(
            ContratoPagamento.status == "pago",
            ContratoPagamento.data_pagamento >= inicio_mes,
        )
    )).scalar() or 0.0

    fat_total = (await db.execute(
        select(func.sum(ContratoPagamento.valor))
        .where(ContratoPagamento.status == "pago")
    )).scalar() or 0.0

    total_em_neg = (await db.execute(
        select(func.count(Oportunidade.id)).where(Oportunidade.status_terminal == "ativo")
    )).scalar() or 0

    # Só as oportunidades já precificadas entram na soma; valor_fechado é
    # nullable, então este número é um piso, não o pipeline inteiro.
    valor_em_neg = (await db.execute(
        select(func.sum(Oportunidade.valor_fechado))
        .where(Oportunidade.status_terminal == "ativo")
    )).scalar() or 0

    projetos_ativos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.notin_(_PROJETO_INATIVO))
    )).scalar() or 0

    projetos_concluidos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status == "finalizado")
    )).scalar() or 0

    # Aniversariantes do mês (via membro_perfil_metaapp)
    aniv_rows = await db.execute(
        select(Membro, MembroPerfilMetaapp)
        .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where(
            MembroPerfilMetaapp.ativo == True,
            MembroPerfilMetaapp.data_nascimento.isnot(None),
            func.extract("month", MembroPerfilMetaapp.data_nascimento) == hoje.month,
        )
        .order_by(func.extract("day", MembroPerfilMetaapp.data_nascimento))
        .limit(5)
    )
    # A área de cada aniversariante sai de uma consulta só, em vez de uma por
    # pessoa: coordenação quando existe, senão célula.
    aniv_membros = [m for m, _ in aniv_rows]
    areas: dict[int, str] = {}
    if aniv_membros:
        ids = [m.id for m in aniv_membros]
        for assoc, nome_model, fk in (
            (MembroCelula, Celula, MembroCelula.celula_id),
            (MembroCoordenacao, Coordenacao, MembroCoordenacao.coordenacao_id),
        ):
            rows = await db.execute(
                select(assoc.membro_id, nome_model.nome)
                .join(nome_model, fk == nome_model.id)
                .where(assoc.membro_id.in_(ids))
            )
            # Coordenação roda depois e sobrescreve a célula de propósito:
            # é o rótulo mais específico das duas.
            areas.update({mid: nome for mid, nome in rows})

    aniversariantes = []
    for m in aniv_membros:
        initials = "".join(p[0].upper() for p in m.nome.split()[:2])
        aniversariantes.append(
            {"initials": initials, "name": m.nome, "department": areas.get(m.id, "")}
        )

    # Reconhecimentos (membros com destaque_texto preenchido em membro_perfil_metaapp)
    rec_rows = await db.execute(
        select(Membro, MembroPerfilMetaapp)
        .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where(MembroPerfilMetaapp.ativo == True, MembroPerfilMetaapp.destaque_texto.isnot(None))
        .order_by(MembroPerfilMetaapp.updated_at.desc())
        .limit(3)
    )
    reconhecimentos = []
    for m, perfil in rec_rows:
        initials = "".join(p[0].upper() for p in m.nome.split()[:2])
        reconhecimentos.append({"initials": initials, "name": m.nome, "achievement": perfil.destaque_texto})

    total_leads = (await db.execute(select(func.count(Lead.id)))).scalar() or 0
    total_qualificados = total_em_neg
    op_fechadas = (await db.execute(
        select(func.count(Oportunidade.id)).where(Oportunidade.status_terminal == "fechado")
    )).scalar() or 0

    return {
        "revenue": {
            "fat_atual": float(fat_atual),
            "fat_total": float(fat_total),
            "em_negociacao_count": total_em_neg,
            "em_negociacao_valor": float(valor_em_neg),
        },
        "sales_funnel": [
            {"label": "Leads", "value": total_leads, "percentage": 100},
            {"label": "Qualificados", "value": total_qualificados,
             "percentage": round(total_qualificados / total_leads * 100) if total_leads else 0},
            {"label": "Fechados", "value": op_fechadas,
             "percentage": round(op_fechadas / total_leads * 100) if total_leads else 0},
        ],
        "projects_overview": {"active": projetos_ativos, "completed": projetos_concluidos},
        "birthdays": aniversariantes,
        "recognitions": reconhecimentos,
    }


@router.get("/kpis", summary="KPIs executivos (headcount, projetos, NPS, taxa de entrega)")
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """KPIs calculados dinamicamente a partir das notas de acompanhamento de projetos."""
    headcount = (await db.execute(
        select(func.count(Membro.id))
        .outerjoin(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where((MembroPerfilMetaapp.ativo.is_(None)) | (MembroPerfilMetaapp.ativo == True))
    )).scalar() or 0

    projetos_ativos = (await db.execute(
        select(func.count(ProjetoExterno.id))
        .where(ProjetoExterno.status.notin_(_PROJETO_INATIVO))
    )).scalar() or 0

    # Taxa de entrega — média de eficacia_metodologia (escala 1-5 → 0-100%)
    media_qualidade = (await db.execute(
        select(func.avg(AcompanhamentoProjeto.eficacia_metodologia))
        .where(AcompanhamentoProjeto.eficacia_metodologia.isnot(None))
    )).scalar()
    taxa_entrega = round((float(media_qualidade) / 5.0) * 100) if media_qualidade else None

    # NPS Interno — média de satisfacao_cliente convertida para escala NPS (-100 a 100)
    media_satisfacao = (await db.execute(
        select(func.avg(AcompanhamentoProjeto.satisfacao_cliente))
        .where(AcompanhamentoProjeto.satisfacao_cliente.isnot(None))
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
    """Conta acompanhamentos por mês usando DATE_FORMAT (MySQL)."""
    rows = await db.execute(
        select(
            func.date_format(AcompanhamentoProjeto.data_resposta, "%Y-%m").label("mes"),
            func.count(AcompanhamentoProjeto.id).label("total"),
        )
        .where(AcompanhamentoProjeto.data_resposta.isnot(None))
        .group_by("mes")
        # Ordena do mais recente para o mais antigo antes de cortar: com
        # order_by("mes") crescente, o LIMIT devolvia os 12 meses mais
        # antigos do histórico em vez dos 12 últimos.
        .order_by(desc("mes"))
        .limit(12)
    )
    return [{"month": row.mes, "value": row.total} for row in reversed(rows.all())]


@router.get("/engagement-by-area", summary="Engajamento por área (satisfação média por coordenação)")
async def get_engagement_by_area(
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    """Calcula a satisfação média de projetos segmentada por coordenação.
    Join: acompanhamento → projeto → membro_projeto → membro_coordenacao.
    """
    r = await db.execute(select(Coordenacao).order_by(Coordenacao.id))
    coordenacoes = r.scalars().all()

    result = []
    for coord in coordenacoes:
        media = (await db.execute(
            select(func.avg(AcompanhamentoProjeto.satisfacao_cliente))
            .join(ProjetoExterno, AcompanhamentoProjeto.projeto_externo_id == ProjetoExterno.id)
            .join(MembroProjeto, MembroProjeto.projeto_externo_id == ProjetoExterno.id)
            .join(MembroCoordenacao, MembroCoordenacao.membro_id == MembroProjeto.membro_id)
            .where(
                MembroCoordenacao.coordenacao_id == coord.id,
                AcompanhamentoProjeto.satisfacao_cliente.isnot(None),
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
    """Retorna projetos ativos no formato que a tabela do Dashboard consome.
    Progresso estimado pelo pct_conclusao do acompanhamento mais recente;
    cliente obtido via Contrato → Cliente (projeto_externo pode não ter contrato).
    """
    r = await db.execute(
        select(ProjetoExterno)
        .where(ProjetoExterno.status.notin_(_PROJETO_INATIVO))
        .order_by(ProjetoExterno.id.desc())
        .limit(20)
    )
    projetos = r.scalars().all()

    result = []
    for p in projetos:
        ultimo_acomp = (await db.execute(
            select(AcompanhamentoProjeto.pct_conclusao, AcompanhamentoProjeto.status_cronograma)
            .where(AcompanhamentoProjeto.projeto_externo_id == p.id)
            .order_by(AcompanhamentoProjeto.data_resposta.desc())
            .limit(1)
        )).first()
        pct, status_cronograma = ultimo_acomp if ultimo_acomp else (None, None)
        prog = _PCT_FAIXA_MEIO.get(pct, 0)

        # O gerente sai de membro_projeto. Alocações com cargo de gerência vêm
        # primeiro; se o projeto não tiver nenhuma, cai para qualquer membro
        # ainda alocado.
        gerente = (await db.execute(
            select(Membro.nome)
            .join(MembroProjeto, MembroProjeto.membro_id == Membro.id)
            .outerjoin(Cargo, Cargo.id == MembroProjeto.cargo_id)
            .where(
                MembroProjeto.projeto_externo_id == p.id,
                MembroProjeto.data_saida.is_(None),
            )
            .order_by(Cargo.nome.like("Gerente%").desc(), Membro.id)
            .limit(1)
        )).scalar_one_or_none()

        contrato = (await db.execute(
            select(Contrato)
            .join(Contrato.cliente)
            .where(Contrato.projeto_externo_id == p.id)
            .limit(1)
        )).scalar_one_or_none()
        cliente = contrato.cliente.nome if contrato and contrato.cliente else None

        result.append({
            "project": p.nome,
            "manager": gerente or "—",
            "client": cliente or "—",
            # O status do prazo é registrado no acompanhamento; derivá-lo do
            # percentual (o que era feito aqui) marcava como "atrasado"
            # qualquer projeto em fase inicial, mesmo dentro do prazo.
            "status": _STATUS_VISUAL.get(status_cronograma, "sem-dados"),
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
    limite_acomp = (datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(days=30)).date()
    projetos_sem_acomp = await db.execute(
        select(ProjetoExterno)
        .where(
            ProjetoExterno.status.notin_(_PROJETO_INATIVO),
            ~ProjetoExterno.id.in_(
                select(AcompanhamentoProjeto.projeto_externo_id)
                .where(AcompanhamentoProjeto.data_resposta >= limite_acomp)
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
        .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where(
            MembroPerfilMetaapp.ativo == True,
            func.extract("month", MembroPerfilMetaapp.data_nascimento) == hoje.month,
            func.extract("day", MembroPerfilMetaapp.data_nascimento) == hoje.day,
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

    return {"total": len(alertas), "alertas": alertas}
