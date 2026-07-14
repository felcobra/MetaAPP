"""Endpoints Financeiros — Clientes, Contratos, Pagamentos e Auxiliares."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from decimal import Decimal

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.financial import (
    FormaPagamento, ContaBancaria, CategoriaTransacao,
    Cliente, Contrato, ContratoPagamento,
)
from app.schemas.financial import (
    AuxCreate,
    FormaPagamentoRead, ContaBancariaRead,
    CategoriaTransacaoCreate, CategoriaTransacaoRead,
    ClienteRead, ClienteCreate, ClienteUpdate,
    ContratoRead, ContratoCreate, ContratoUpdate,
    ContratoPagamentoRead, ContratoPagamentoCreate, ContratoPagamentoUpdate,
    FinanceiroPorStatus,
)

router = APIRouter()

# ========== Auxiliares ==========

@router.get("/formas-pagamento", response_model=List[FormaPagamentoRead])
async def list_formas_pagamento(db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(FormaPagamento))
    return r.scalars().all()


@router.post("/formas-pagamento", response_model=FormaPagamentoRead, status_code=201)
async def create_forma_pagamento(body: AuxCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
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
async def create_conta(body: AuxCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
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
async def create_categoria(body: CategoriaTransacaoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = CategoriaTransacao(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Clientes ==========

@router.get("/clientes", response_model=List[ClienteRead])
async def list_clientes(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Cliente).offset(skip).limit(limit))
    return r.scalars().all()


@router.get("/clientes/{cliente_id}", response_model=ClienteRead)
async def get_cliente(cliente_id: int, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Cliente).where(Cliente.id == cliente_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Cliente não encontrado")
    return obj


@router.post("/clientes", response_model=ClienteRead, status_code=201)
async def create_cliente(body: ClienteCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    # Verifica unicidade de CPF/CNPJ
    if body.cpf_cnpj:
        dup = await db.execute(select(Cliente).where(Cliente.cpf_cnpj == body.cpf_cnpj))
        if dup.scalar_one_or_none():
            raise HTTPException(409, "CPF/CNPJ já cadastrado")
    obj = Cliente(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/clientes/{cliente_id}", response_model=ClienteRead)
async def update_cliente(cliente_id: int, body: ClienteUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Cliente).where(Cliente.id == cliente_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Cliente não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Contratos ==========

@router.get("/contratos", response_model=List[ContratoRead])
async def list_contratos(
    cliente_id: int | None = None,
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    q = select(Contrato)
    if cliente_id:
        q = q.where(Contrato.cliente_id == cliente_id)
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
async def create_contrato(body: ContratoCreate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    obj = Contrato(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/contratos/{contrato_id}", response_model=ContratoRead)
async def update_contrato(contrato_id: int, body: ContratoUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
    r = await db.execute(select(Contrato).where(Contrato.id == contrato_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Contrato não encontrado")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    await db.flush()
    await db.refresh(obj)
    return obj


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
    db: AsyncSession = Depends(get_db), _=Depends(get_current_user),
):
    obj = ContratoPagamento(**body.model_dump(), contrato_id=contrato_id)
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/pagamentos/{pag_id}", response_model=ContratoPagamentoRead)
async def update_pagamento(pag_id: int, body: ContratoPagamentoUpdate, db: AsyncSession = Depends(get_db), _=Depends(get_current_user)):
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
    for status, val in rows:
        result[status] = val or Decimal(0)
        total += val or Decimal(0)
    result["total"] = total
    return result
