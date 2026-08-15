"""Endpoints Financeiros — Clientes, Contratos, Pagamentos e Auxiliares.

v2 — Melhorias:
- GET /contratos: filtro por status (ativo/encerrado/suspenso) e cliente_id
- DELETE /clientes/{id}: requer admin, valida contratos vinculados
- DELETE /contratos/{id}: requer admin, valida pagamentos vinculados
- GET /fluxo-mensal: receita mês a mês (últimos 12 meses) usando DATE_FORMAT MySQL
- Validação básica de CPF/CNPJ (14 chars numéricos) no create_cliente
- Logging em operações destrutivas
"""
import logging
import re
from typing import List, Optional
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, case

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_director_or_admin
from app.models.financial import (
    FormaPagamento, ContaBancaria, CategoriaTransacao,
    Cliente, Contrato, ContratoPagamento, Transacao,
)
from app.models.project_tracking import ProjetoExterno
from app.schemas.financial import (
    FormaPagamentoCreate, FormaPagamentoRead,
    ContaBancariaCreate, ContaBancariaRead,
    CategoriaTransacaoCreate, CategoriaTransacaoRead,
    ClienteRead, ClienteCreate, ClienteUpdate,
    ContratoRead, ContratoCreate, ContratoUpdate,
    ContratoPagamentoRead, ContratoPagamentoCreate, ContratoPagamentoUpdate,
    FinanceiroPorStatus,
)

logger = logging.getLogger("metaapp")
router = APIRouter()

# ========== Auxiliares ==========

@router.get("/formas-pagamento", response_model=List[FormaPagamentoRead])
async def list_formas_pagamento(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(FormaPagamento))
    return r.scalars().all()


@router.post("/formas-pagamento", response_model=FormaPagamentoRead, status_code=201)
async def create_forma_pagamento(body: FormaPagamentoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = FormaPagamento(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/contas-bancarias", response_model=List[ContaBancariaRead])
async def list_contas(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(ContaBancaria))
    return r.scalars().all()


@router.post("/contas-bancarias", response_model=ContaBancariaRead, status_code=201)
async def create_conta(body: ContaBancariaCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = ContaBancaria(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/categorias", response_model=List[CategoriaTransacaoRead])
async def list_categorias(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(CategoriaTransacao))
    return r.scalars().all()


@router.post("/categorias", response_model=CategoriaTransacaoRead, status_code=201)
async def create_categoria(body: CategoriaTransacaoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = CategoriaTransacao(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Clientes ==========

def _sanitize_cpf_cnpj(value: str | None) -> str | None:
    """Remove formatação do CPF/CNPJ (pontos/traços/barras).
    A validação de comprimento (11 ou 14 dígitos) já é feita pelo Pydantic
    no schema — este helper apenas normaliza o valor antes de salvar no banco.
    """
    if not value:
        return None
    digits = re.sub(r"\D", "", value)
    return digits if digits else None


@router.get("/clientes", response_model=List[ClienteRead])
async def list_clientes(
    nome: Optional[str] = Query(None, description="Filtrar por nome do cliente", max_length=200),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Cliente)
    if nome:
        q = q.where(Cliente.nome.ilike(f"%{nome}%"))
    r = await db.execute(q.order_by(Cliente.nome).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/clientes/{cliente_id}", response_model=ClienteRead)
async def get_cliente(cliente_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Cliente).where(Cliente.id == cliente_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Cliente não encontrado")
    return obj


@router.post("/clientes", response_model=ClienteRead, status_code=201)
async def create_cliente(body: ClienteCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    cpf_cnpj = _sanitize_cpf_cnpj(body.cpf_cnpj)

    if cpf_cnpj:
        dup = await db.execute(select(Cliente).where(Cliente.cpf_cnpj == cpf_cnpj))
        if dup.scalar_one_or_none():
            raise HTTPException(409, "CPF/CNPJ já cadastrado")

    data = body.model_dump()
    data["cpf_cnpj"] = cpf_cnpj
    obj = Cliente(**data)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/clientes/{cliente_id}", response_model=ClienteRead)
async def update_cliente(cliente_id: int, body: ClienteUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(select(Cliente).where(Cliente.id == cliente_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Cliente não encontrado")
    updates = body.model_dump(exclude_unset=True)
    if "cpf_cnpj" in updates:
        updates["cpf_cnpj"] = _sanitize_cpf_cnpj(updates["cpf_cnpj"])
    for k, v in updates.items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/clientes/{cliente_id}", status_code=204, summary="Remover cliente (admin)")
async def delete_cliente(
    cliente_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Remove cliente. Falhará se existirem contratos vinculados (RESTRICT). Requer admin."""
    r = await db.execute(select(Cliente).where(Cliente.id == cliente_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Cliente não encontrado")

    # Verifica contratos vinculados antes de tentar deletar
    contratos_count = (await db.execute(
        select(func.count(Contrato.id)).where(Contrato.cliente_id == cliente_id)
    )).scalar() or 0
    if contratos_count:
        raise HTTPException(
            409,
            f"Não é possível remover o cliente pois possui {contratos_count} contrato(s) vinculado(s).",
        )

    await db.delete(obj)
    await db.flush()
    logger.info("Cliente %s (%s) removido", cliente_id, obj.nome)


# ========== Contratos & Financeiro — tela agregada ==========

@router.get("/painel", summary="Agregados da tela Contratos & Financeiro (resumo, fluxo mensal, saídas por categoria)")
async def get_painel_financeiro(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_director_or_admin),
):
    """Tudo que os cards da tela Contratos & Financeiro precisam, numa
    chamada só — mesmo padrão de /comercial/resumo."""
    receita_row = (await db.execute(
        select(func.sum(Contrato.valor_total), func.count(Contrato.id))
    )).first()
    receita_contratada = float(receita_row[0] or 0)
    total_contratos = receita_row[1] or 0

    a_receber = (await db.execute(
        select(func.sum(ContratoPagamento.valor)).where(ContratoPagamento.status == "pendente")
    )).scalar() or 0

    fluxo_rows = (await db.execute(
        select(Transacao.tipo, func.sum(Transacao.valor)).group_by(Transacao.tipo)
    )).all()
    por_tipo = {tipo: float(valor or 0) for tipo, valor in fluxo_rows}
    entradas = por_tipo.get("entrada", 0)
    saidas = por_tipo.get("saida", 0)

    # Fluxo de caixa mensal (últimos 12 meses, entradas x saídas)
    mensal_rows = (await db.execute(
        select(
            func.date_format(Transacao.data, "%Y-%m").label("mes"),
            Transacao.tipo,
            func.sum(Transacao.valor),
        )
        .where(Transacao.data.isnot(None))
        .group_by("mes", Transacao.tipo)
        .order_by(desc("mes"))
    )).all()
    por_mes: dict[str, dict[str, float]] = {}
    for mes, tipo, valor in mensal_rows:
        por_mes.setdefault(mes, {"entrada": 0.0, "saida": 0.0})[tipo] = float(valor or 0)
    ultimos_12_meses = sorted(por_mes.keys())[-12:]
    fluxo_mensal = [
        {"mes": mes, "entradas": por_mes[mes]["entrada"], "saidas": por_mes[mes]["saida"]}
        for mes in ultimos_12_meses
    ]

    # Saídas por categoria (top 8)
    categoria_rows = (await db.execute(
        select(CategoriaTransacao.nome, func.sum(Transacao.valor))
        .join(Transacao, Transacao.categoria_id == CategoriaTransacao.id)
        .where(Transacao.tipo == "saida")
        .group_by(CategoriaTransacao.nome)
        .order_by(desc(func.sum(Transacao.valor)))
        .limit(8)
    )).all()
    saidas_por_categoria = [
        {"label": nome or "Sem categoria", "value": float(valor or 0)}
        for nome, valor in categoria_rows
    ]

    # Saldo por conta (entradas − saídas), só contas com movimentação
    conta_rows = (await db.execute(
        select(
            ContaBancaria.nome,
            func.sum(case((Transacao.tipo == "entrada", Transacao.valor), else_=-Transacao.valor)),
        )
        .join(Transacao, Transacao.conta_id == ContaBancaria.id)
        .group_by(ContaBancaria.nome)
        .order_by(desc(func.sum(case((Transacao.tipo == "entrada", Transacao.valor), else_=-Transacao.valor))))
    )).all()
    saldo_por_conta = [{"label": nome, "value": float(valor or 0)} for nome, valor in conta_rows]

    return {
        "resumo": {
            "receita_contratada": receita_contratada,
            "total_contratos": total_contratos,
            "a_receber": float(a_receber),
            "entradas": entradas,
            "saidas": saidas,
            "resultado": entradas - saidas,
        },
        "fluxo_mensal": fluxo_mensal,
        "saidas_por_categoria": saidas_por_categoria,
        "saldo_por_conta": saldo_por_conta,
    }


@router.get("/contratos-resumo", summary="Contratos com cliente, projeto e progresso de parcelas resolvidos")
async def get_contratos_resumo(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_director_or_admin),
):
    """Como /contratos, mas com cliente, projeto e progresso de parcelas já
    resolvidos — /contratos só traz cliente_id/projeto_externo_id crus, e a
    tabela da tela mostra texto e progresso (x/y parcelas)."""
    total = (await db.execute(select(func.count(Contrato.id)))).scalar() or 0

    contratos = (await db.execute(
        select(Contrato).order_by(desc(Contrato.id)).offset(skip).limit(limit)
    )).scalars().all()
    contrato_ids = [c.id for c in contratos]

    if not contrato_ids:
        return {"items": [], "total": total}

    cliente_ids = {c.cliente_id for c in contratos if c.cliente_id}
    clientes: dict[int, str] = {}
    if cliente_ids:
        rows = await db.execute(select(Cliente.id, Cliente.nome).where(Cliente.id.in_(cliente_ids)))
        clientes = {cid: nome for cid, nome in rows}

    projeto_ids = {c.projeto_externo_id for c in contratos if c.projeto_externo_id}
    projetos: dict[int, str] = {}
    if projeto_ids:
        rows = await db.execute(
            select(ProjetoExterno.id, ProjetoExterno.nome).where(ProjetoExterno.id.in_(projeto_ids))
        )
        projetos = {pid: nome for pid, nome in rows}

    pag_rows = await db.execute(
        select(ContratoPagamento.contrato_id, ContratoPagamento.status, func.count(ContratoPagamento.id))
        .where(ContratoPagamento.contrato_id.in_(contrato_ids))
        .group_by(ContratoPagamento.contrato_id, ContratoPagamento.status)
    )
    parcelas_por_contrato: dict[int, dict[str, int]] = {}
    for contrato_id, status_pag, count in pag_rows:
        parcelas_por_contrato.setdefault(contrato_id, {})[status_pag] = count

    items = []
    for c in contratos:
        parcelas = parcelas_por_contrato.get(c.id, {})
        items.append({
            "id": c.id,
            "numero": c.numero or "—",
            "cliente": clientes.get(c.cliente_id) or "Cliente não informado",
            "projeto": projetos.get(c.projeto_externo_id) or "—",
            "fase_atual": c.fase_atual or "—",
            "parcelas_pagas": parcelas.get("pago", 0),
            "parcelas_total": sum(parcelas.values()),
            "valor_total": float(c.valor_total) if c.valor_total is not None else 0,
        })

    return {"items": items, "total": total}


@router.get("/transacoes", summary="Extrato de transações (entradas e saídas), paginado")
async def list_transacoes(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo: entrada ou saida"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_director_or_admin),
):
    """Extrato paginado — o modelo/schema de Transacao já existiam, mas não
    havia rota nenhuma expondo o lançamento financeiro (só os agregados)."""
    query = select(Transacao)
    if tipo:
        query = query.where(Transacao.tipo == tipo)

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    total_pages = max(1, -(-total // page_size))
    skip = (page - 1) * page_size

    rows = await db.execute(
        select(
            Transacao.id, Transacao.data, Transacao.tipo, Transacao.valor,
            CategoriaTransacao.nome, ContaBancaria.nome, ProjetoExterno.nome,
        )
        .outerjoin(CategoriaTransacao, CategoriaTransacao.id == Transacao.categoria_id)
        .outerjoin(ContaBancaria, ContaBancaria.id == Transacao.conta_id)
        .outerjoin(ProjetoExterno, ProjetoExterno.id == Transacao.projeto_externo_id)
        .order_by(desc(Transacao.data), desc(Transacao.id))
        .offset(skip)
        .limit(page_size)
    )

    items = [
        {
            "id": tid,
            "data": data.isoformat() if data else None,
            "tipo": tipo_transacao,
            "valor": float(valor) if valor is not None else 0,
            "categoria": categoria or "—",
            "conta": conta or "—",
            "vinculo": projeto,
        }
        for tid, data, tipo_transacao, valor, categoria, conta, projeto in rows
    ]

    return {
        "items": items,
        "total": total,
        "total_pages": total_pages,
        "current_page": page,
        "page_from": skip + 1 if total else 0,
        "page_to": min(skip + page_size, total),
    }


# ========== Contratos ==========

@router.get("/contratos", response_model=List[ContratoRead])
async def list_contratos(
    cliente_id: Optional[int] = None,
    fase_atual: Optional[str] = Query(None, description="Filtrar por fase atual do contrato"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_director_or_admin),
):
    q = select(Contrato)
    if cliente_id:
        q = q.where(Contrato.cliente_id == cliente_id)
    if fase_atual:
        q = q.where(Contrato.fase_atual == fase_atual)
    r = await db.execute(q.offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/contratos/{contrato_id}", response_model=ContratoRead)
async def get_contrato(contrato_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(select(Contrato).where(Contrato.id == contrato_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Contrato não encontrado")
    return obj


@router.post("/contratos", response_model=ContratoRead, status_code=201)
async def create_contrato(body: ContratoCreate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    obj = Contrato(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/contratos/{contrato_id}", response_model=ContratoRead)
async def update_contrato(contrato_id: int, body: ContratoUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(select(Contrato).where(Contrato.id == contrato_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Contrato não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.delete("/contratos/{contrato_id}", status_code=204, summary="Remover contrato (admin)")
async def delete_contrato(
    contrato_id: int,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_admin),
):
    """Remove contrato. Falhará se existirem pagamentos vinculados (RESTRICT). Requer admin."""
    r = await db.execute(select(Contrato).where(Contrato.id == contrato_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Contrato não encontrado")

    pag_count = (await db.execute(
        select(func.count(ContratoPagamento.id)).where(ContratoPagamento.contrato_id == contrato_id)
    )).scalar() or 0
    if pag_count:
        raise HTTPException(
            409,
            f"Não é possível remover o contrato pois possui {pag_count} pagamento(s) vinculado(s).",
        )

    await db.delete(obj)
    await db.flush()
    logger.info("Contrato %s removido", contrato_id)


# ========== Pagamentos ==========

@router.get("/contratos/{contrato_id}/pagamentos", response_model=List[ContratoPagamentoRead])
async def list_pagamentos(contrato_id: int, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(
        select(ContratoPagamento).where(ContratoPagamento.contrato_id == contrato_id)
    )
    return r.scalars().all()


@router.post("/contratos/{contrato_id}/pagamentos", response_model=ContratoPagamentoRead, status_code=201)
async def create_pagamento(
    contrato_id: int, body: ContratoPagamentoCreate,
    db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin),
):
    obj = ContratoPagamento(**body.model_dump(), contrato_id=contrato_id)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/pagamentos/{pag_id}", response_model=ContratoPagamentoRead)
async def update_pagamento(pag_id: int, body: ContratoPagamentoUpdate, db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    r = await db.execute(select(ContratoPagamento).where(ContratoPagamento.id == pag_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Pagamento não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.get("/resumo", response_model=FinanceiroPorStatus, summary="Resumo financeiro por status")
async def get_resumo(db: AsyncSession = Depends(get_db), _=Depends(require_director_or_admin)):
    """Agrega o valor total de parcelas por status de pagamento."""
    rows = await db.execute(
        select(ContratoPagamento.status, func.sum(ContratoPagamento.valor))
        .group_by(ContratoPagamento.status)
    )
    result = {"pendente": Decimal(0), "pago": Decimal(0), "atrasado": Decimal(0), "cancelado": Decimal(0)}
    total = Decimal(0)
    for row_status, val in rows:
        if row_status in result:
            result[row_status] = val or Decimal(0)
        total += val or Decimal(0)
    result["total"] = total
    return result


@router.get("/fluxo-mensal", summary="Receita mensal — últimos 12 meses (MySQL DATE_FORMAT)")
async def get_fluxo_mensal(
    db: AsyncSession = Depends(get_db),
    _=Depends(require_director_or_admin),
):
    """Retorna receita recebida (status=pago) mês a mês dos últimos 12 meses.
    Usa DATE_FORMAT do MySQL — compatível com o banco de dados da aplicação.
    """
    rows = await db.execute(
        select(
            func.date_format(ContratoPagamento.data_pagamento, "%Y-%m").label("mes"),
            func.sum(ContratoPagamento.valor).label("total"),
        )
        .where(
            ContratoPagamento.status == "pago",
            ContratoPagamento.data_pagamento.isnot(None),
        )
        .group_by("mes")
        .order_by("mes")
        .limit(12)
    )
    return [{"mes": row.mes, "total": float(row.total or 0)} for row in rows]
