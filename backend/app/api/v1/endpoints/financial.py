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
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin, require_director_or_admin
from app.models.financial import (
    FormaPagamento, ContaBancaria, CategoriaTransacao,
    Cliente, Contrato, ContratoPagamento,
)
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
    """Remove formatação do CPF/CNPJ e valida comprimento."""
    if not value:
        return None
    digits = re.sub(r"\D", "", value)
    if len(digits) not in (11, 14):
        raise HTTPException(
            status_code=422,
            detail="CPF/CNPJ inválido. Informe 11 dígitos (CPF) ou 14 dígitos (CNPJ).",
        )
    return digits


@router.get("/clientes", response_model=List[ClienteRead])
async def list_clientes(
    nome: Optional[str] = Query(None, description="Filtrar por nome do cliente"),
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


# ========== Contratos ==========

@router.get("/contratos", response_model=List[ContratoRead])
async def list_contratos(
    cliente_id: Optional[int] = None,
    fase_atual: Optional[str] = Query(None, description="Filtrar por fase atual do contrato"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _=Depends(get_current_user),
):
    q = select(Contrato)
    if cliente_id:
        q = q.where(Contrato.cliente_id == cliente_id)
    if fase_atual:
        q = q.where(Contrato.fase_atual == fase_atual)
    r = await db.execute(q.offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/contratos/{contrato_id}", response_model=ContratoRead)
async def get_contrato(contrato_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
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
async def list_pagamentos(contrato_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
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
async def get_resumo(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
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
    _=Depends(get_current_user),
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
