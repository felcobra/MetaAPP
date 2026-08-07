"""Endpoints do módulo de Formulários Dinâmicos (PAPE, Avaliação 360, etc.).

v2 — Melhorias:
- datetime.now(timezone.utc) substitui datetime.utcnow() (deprecated Python 3.12+)
- list_templates: N+1 eliminado com subquery de COUNT agregado
- update_submissao: corrigido crash no PATCH parcial quando `status` não é enviado
"""
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.hr import Membro, MembroPerfilMetaapp
from app.models.project_tracking import ProjetoExterno
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


async def _get_membro_by_user(db: AsyncSession, user_id: int) -> Membro | None:
    """O vínculo membro↔usuário vive em membro_perfil_metaapp (exclusivo do
    MetaApp) — a tabela `membro` real não tem user_id."""
    r = await db.execute(
        select(Membro)
        .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where(MembroPerfilMetaapp.user_id == user_id)
    )
    return r.scalar_one_or_none()


# ========== Templates ==========

@router.get("/templates", response_model=List[FormTemplateRead], summary="Listar templates de formulários")
async def list_templates(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Lista templates ativos.
    Otimizado: uma única subquery conta os steps de todos os templates
    (sem N+1 queries como na versão anterior).
    """
    # Subquery de contagem de steps por template
    steps_sq = (
        select(FormStep.template_id, func.count(FormStep.id).label("total_steps"))
        .group_by(FormStep.template_id)
        .subquery()
    )

    rows = await db.execute(
        select(FormTemplate, func.coalesce(steps_sq.c.total_steps, 0).label("total_steps"))
        .outerjoin(steps_sq, FormTemplate.id == steps_sq.c.template_id)
        .where(FormTemplate.ativo == True)
        .order_by(FormTemplate.id)
    )

    result = []
    for template, total in rows:
        template.__dict__["total_steps"] = total
        result.append(template)
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
    obj.__dict__["total_steps"] = len(obj.steps)
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

@router.get("/minhas-tarefas", summary="Formulários ativos com o progresso do usuário logado")
async def get_minhas_tarefas(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cada template ativo com a submissão mais recente do próprio usuário.

    Quem não tem membro vinculado recebe os templates com status "pendente" —
    a lista de formulários existentes não depende de estar alocado.
    """
    templates = (await db.execute(
        select(FormTemplate)
        .where(FormTemplate.ativo == True)
        .order_by(FormTemplate.id)
    )).scalars().all()

    membro = await _get_membro_by_user(db, current_user.id)

    # Uma consulta para todas as submissões do membro; a mais recente de cada
    # template vence. Evita um SELECT por template.
    por_template: dict[int, FormSubmission] = {}
    if membro:
        submissoes = (await db.execute(
            select(FormSubmission)
            .where(FormSubmission.membro_id == membro.id)
            .order_by(FormSubmission.created_at.desc())
        )).scalars().all()
        for s in submissoes:
            por_template.setdefault(s.template_id, s)

    total_steps = dict((await db.execute(
        select(FormStep.template_id, func.count(FormStep.id)).group_by(FormStep.template_id)
    )).all())

    return [
        {
            "id": t.id,
            "titulo": t.titulo,
            "subtitulo": t.subtitulo,
            "descricao": t.descricao,
            "frequencia": t.frequencia,
            "duracao_estimada": t.duracao_estimada,
            "publico_alvo": t.publico_alvo,
            "total_steps": total_steps.get(t.id, 0),
            "status": por_template[t.id].status if t.id in por_template else "pendente",
            "progresso": por_template[t.id].progresso if t.id in por_template else 0,
            "submissao_id": por_template[t.id].id if t.id in por_template else None,
        }
        for t in templates
    ]


@router.get("/historico", summary="Submissões concluídas do usuário logado")
async def get_historico(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Formulários que o usuário já finalizou, do mais recente para o mais antigo."""
    membro = await _get_membro_by_user(db, current_user.id)
    if not membro:
        return []

    rows = await db.execute(
        select(FormSubmission, FormTemplate.titulo, ProjetoExterno.nome)
        .join(FormTemplate, FormTemplate.id == FormSubmission.template_id)
        .outerjoin(ProjetoExterno, ProjetoExterno.id == FormSubmission.projeto_externo_id)
        .where(
            FormSubmission.membro_id == membro.id,
            FormSubmission.status == "concluido",
        )
        .order_by(FormSubmission.data_submissao.desc())
        .limit(20)
    )

    return [
        {
            "id": s.id,
            "titulo": titulo,
            "ciclo": s.ciclo,
            "projeto": projeto,
            "data_submissao": s.data_submissao.isoformat() if s.data_submissao else None,
        }
        for s, titulo, projeto in rows
    ]


@router.get("/submissoes", response_model=List[FormSubmissionRead], summary="Submissões do usuário atual")
async def list_submissoes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retorna submissões vinculadas ao membro do usuário logado."""
    membro = await _get_membro_by_user(db, current_user.id)
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
    membro = await _get_membro_by_user(db, current_user.id)
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
    current_user: User = Depends(get_current_user),
):
    r = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    obj = r.scalar_one_or_none()
    if not obj:
        raise HTTPException(404, "Submissão não encontrada")

    # IDOR: garante que o usuário só edita o próprio formulário (admin pode editar qualquer um)
    if current_user.role != "admin":
        membro = await _get_membro_by_user(db, current_user.id)
        if not membro or obj.membro_id != membro.id:
            raise HTTPException(403, "Acesso negado: esta submissão pertence a outro membro.")

    updates = body.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(obj, k, v)

    # Corrigido: verifica o campo no dict de updates, não em body diretamente
    if updates.get("status") == "concluido" and not obj.data_submissao:
        obj.data_submissao = datetime.now(timezone.utc).replace(tzinfo=None)

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
    current_user: User = Depends(get_current_user),
):
    """Faz upsert das respostas. Se a resposta já existe, atualiza o valor."""
    r = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    submissao = r.scalar_one_or_none()
    if not submissao:
        raise HTTPException(404, "Submissão não encontrada")

    # IDOR: só o próprio membro (ou admin) pode salvar respostas
    if current_user.role != "admin":
        membro = await _get_membro_by_user(db, current_user.id)
        if not membro or submissao.membro_id != membro.id:
            raise HTTPException(403, "Acesso negado: esta submissão pertence a outro membro.")

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
    current_user: User = Depends(get_current_user),
):
    # IDOR: membro só lê as próprias respostas; admin vê qualquer uma
    r = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    submissao = r.scalar_one_or_none()
    if not submissao:
        raise HTTPException(404, "Submissão não encontrada")

    if current_user.role != "admin":
        membro = await _get_membro_by_user(db, current_user.id)
        if not membro or submissao.membro_id != membro.id:
            raise HTTPException(403, "Acesso negado: esta submissão pertence a outro membro.")

    r2 = await db.execute(select(FormAnswer).where(FormAnswer.submission_id == submission_id))
    return r2.scalars().all()
