"""Endpoints do módulo de Formulários Dinâmicos (PAPE, Avaliação 360, etc.)."""
from datetime import datetime
from math import ceil
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.hr import Membro
from app.models.forms import (
    FormTemplate, FormStep, FormField, FormSubmission, FormAnswer,
)
from app.schemas.forms import (
    FormTemplateRead, FormTemplateWithSteps,
    FormTemplateCreate, FormStepCreate, FormFieldCreate,
    FormSubmissionCreate, FormSubmissionUpdate, FormSubmissionRead,
    FormAnswerUpsert, FormAnswerRead,
)

router = APIRouter()


# ========== Templates ==========

@router.get("/templates", response_model=List[FormTemplateRead], summary="Listar templates de formulários")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    r = await db.execute(select(FormTemplate).where(FormTemplate.ativo == True).order_by(FormTemplate.id))
    templates = r.scalars().all()
    # Injeta total_steps para cada template
    result = []
    for t in templates:
        r2 = await db.execute(
            select(func.count(FormStep.id)).where(FormStep.template_id == t.id)
        )
        total = r2.scalar() or 0
        t.__dict__["total_steps"] = total
        result.append(t)
    return result


@router.get("/templates/{template_id}", response_model=FormTemplateWithSteps, summary="Detalhes + etapas de um formulário")
async def get_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    r = await db.execute(
        select(FormTemplate)
        .options(selectinload(FormTemplate.steps).selectinload(FormStep.fields))
        .where(FormTemplate.id == template_id)
    )
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Template não encontrado")
    r2 = await db.execute(select(func.count(FormStep.id)).where(FormStep.template_id == obj.id))
    obj.__dict__["total_steps"] = r2.scalar() or 0
    return obj


@router.post("/templates", response_model=FormTemplateRead, status_code=201, summary="Criar novo template")
async def create_template(
    body: FormTemplateCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = FormTemplate(**body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    obj.__dict__["total_steps"] = 0
    return obj


@router.post("/templates/{template_id}/steps", response_model=dict, status_code=201, summary="Adicionar etapa ao template")
async def add_step(
    template_id: int,
    body: FormStepCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    r = await db.execute(select(FormTemplate).where(FormTemplate.id == template_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404, "Template não encontrado")
    step = FormStep(template_id=template_id, **body.model_dump())
    db.add(step)
    await db.flush()
    await db.refresh(step)
    return {"id": step.id, "template_id": step.template_id, "index": step.index}


@router.post("/steps/{step_id}/fields", response_model=dict, status_code=201, summary="Adicionar campo a uma etapa")
async def add_field(
    step_id: int,
    body: FormFieldCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    r = await db.execute(select(FormStep).where(FormStep.id == step_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404, "Etapa não encontrada")
    field = FormField(step_id=step_id, **body.model_dump())
    db.add(field)
    await db.flush()
    await db.refresh(field)
    return {"id": field.id, "step_id": field.step_id, "label": field.label}


# ========== Submissões ==========

@router.get("/submissoes", response_model=List[FormSubmissionRead], summary="Submissões do usuário atual")
async def list_submissoes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna submissões vinculadas ao membro do usuário logado."""
    # Resolve membro pelo user_id
    r = await db.execute(select(Membro).where(Membro.user_id == current_user.id))
    membro = r.scalar_one_or_none()
    if not membro:
        return []
    r2 = await db.execute(
        select(FormSubmission)
        .where(FormSubmission.membro_id == membro.id)
        .order_by(FormSubmission.created_at.desc())
    )
    return r2.scalars().all()


@router.post("/submissoes", response_model=FormSubmissionRead, status_code=201, summary="Iniciar submissão de formulário")
async def create_submissao(
    body: FormSubmissionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(select(Membro).where(Membro.user_id == current_user.id))
    membro = r.scalar_one_or_none()
    if not membro:
        raise HTTPException(400, "Usuário não possui membro associado. Contate o administrador.")
    obj = FormSubmission(membro_id=membro.id, **body.model_dump())
    db.add(obj)
    await db.flush()
    await db.refresh(obj)
    return obj


@router.patch("/submissoes/{submission_id}", response_model=FormSubmissionRead, summary="Atualizar progresso/status")
async def update_submissao(
    submission_id: int,
    body: FormSubmissionUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    r = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Submissão não encontrada")
    for k, v in body.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    # Marca data_submissao automaticamente ao concluir
    if body.status == "concluido" and not obj.data_submissao:
        obj.data_submissao = datetime.utcnow()
    await db.flush()
    await db.refresh(obj)
    return obj


# ========== Respostas ==========

@router.post(
    "/submissoes/{submission_id}/respostas",
    response_model=List[FormAnswerRead],
    status_code=201,
    summary="Salvar/atualizar respostas de uma etapa",
)
async def upsert_respostas(
    submission_id: int,
    respostas: List[FormAnswerUpsert],
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Faz upsert das respostas. Se a resposta já existe, atualiza o valor."""
    r = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    if not r.scalar_one_or_none():
        raise HTTPException(404, "Submissão não encontrada")

    results = []
    for item in respostas:
        r2 = await db.execute(
            select(FormAnswer).where(
                FormAnswer.submission_id == submission_id,
                FormAnswer.field_id == item.field_id,
            )
        )
        existing = r2.scalar_one_or_none()
        if existing:
            existing.valor = item.valor
            await db.flush()
            await db.refresh(existing)
            results.append(existing)
        else:
            ans = FormAnswer(submission_id=submission_id, **item.model_dump())
            db.add(ans)
            await db.flush()
            await db.refresh(ans)
            results.append(ans)
    return results


@router.get("/submissoes/{submission_id}/respostas", response_model=List[FormAnswerRead], summary="Respostas de uma submissão")
async def get_respostas(
    submission_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    r = await db.execute(select(FormAnswer).where(FormAnswer.submission_id == submission_id))
    return r.scalars().all()
