"""Endpoints de Usuários do Sistema.

v2 — Melhorias:
- GET /users/me/membro: retorna o Membro vinculado ao usuário logado
  (necessário para o frontend saber o membro_id do usuário autenticado)
- DELETE /users/{id}: requer admin, impede auto-deleção
- Logging em operações destrutivas
"""
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.models.forms import FormSubmission
from app.models.hr import (
    Cargo, Celula, Coordenacao, Membro, MembroCargo, MembroCelula,
    MembroCoordenacao, MembroPerfilMetaapp, MembroProjeto,
)
from app.schemas.user import UserRead, UserCreate, UserUpdate
from app.core.security import get_password_hash

logger = logging.getLogger("metaapp")
router = APIRouter()


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    """Retorna o usuário autenticado."""
    return current_user


@router.get("/me/profile", summary="Perfil do usuário logado (SessionUser para o frontend)")
async def get_me_profile(current_user: User = Depends(get_current_user)):
    """Retorna o perfil resumido usado pelo TopBar e Sidebar do frontend.
    Inclui: nome, role, email e iniciais calculadas.
    """
    name = current_user.full_name
    initials = "".join(p[0].upper() for p in name.split()[:2]) if name else "??"
    return {
        "name": name,
        "role": current_user.role,
        "email": current_user.email,
        "initials": initials,
    }


@router.get("/me/membro", summary="Membro vinculado ao usuário logado")
async def get_me_membro(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retorna os dados do Membro vinculado ao usuário autenticado.
    Necessário para o frontend associar o usuário logado a um membro do RH
    e habilitar formulários, alocações e perfil.
    Retorna 404 se o usuário não tiver membro vinculado (ex: admin externo).
    """
    r = await db.execute(
        select(Membro, MembroPerfilMetaapp)
        .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
        .where(MembroPerfilMetaapp.user_id == current_user.id)
    )
    row = r.first()
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Usuário não possui membro associado. Contate o administrador.",
        )
    membro, perfil = row
    return {
        "id": membro.id,
        "nome": membro.nome,
        "email": membro.email,
        "telefone": perfil.telefone,
        "foto_url": perfil.foto_url,
        "data_entrada": perfil.data_entrada.isoformat() if perfil.data_entrada else None,
        "ativo": perfil.ativo,
    }


@router.get("/me/perfil", summary="Perfil completo do usuário logado (tela Meu Perfil)")
async def get_me_perfil(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Agrega tudo que a tela de perfil precisa numa chamada só: dados do
    membro, perfil estendido do MetaApp, cargo/célula/coordenação e contadores.

    Não dá 404 quando o usuário não tem membro vinculado (ex: o admin criado
    pelo seed). Nesse caso `membro_id` vem null e a tela cai nos dados do
    login — o contrário deixaria o admin sem conseguir abrir a própria página.
    """
    name = current_user.full_name
    perfil = {
        "membro_id": None,
        "nome": name,
        "email": current_user.email,
        "iniciais": "".join(p[0].upper() for p in name.split()[:2]) if name else "??",
        "cargo": None,
        "celula": None,
        "coordenacao": None,
        "telefone": None,
        "foto_url": None,
        "data_entrada": None,
        "data_nascimento": None,
        "sobre": None,
        "stats": {"papes_respondidos": 0, "projetos_ativos": 0, "membro_desde": None},
    }

    row = (
        await db.execute(
            select(Membro, MembroPerfilMetaapp)
            .join(MembroPerfilMetaapp, MembroPerfilMetaapp.membro_id == Membro.id)
            .where(MembroPerfilMetaapp.user_id == current_user.id)
        )
    ).first()
    if not row:
        return perfil

    membro, ext = row

    # Um membro pode ter mais de um cargo/célula (tabelas N:N). A tela mostra
    # um só, então pegamos o primeiro vínculo — critério suficiente aqui, mas
    # é o motivo de a tela não refletir acúmulo de cargos.
    async def _primeiro(assoc_model, nome_model, fk):
        return (
            await db.execute(
                select(nome_model.nome)
                .join(assoc_model, fk == nome_model.id)
                .where(assoc_model.membro_id == membro.id)
                .limit(1)
            )
        ).scalar_one_or_none()

    # Projeto sem data_saida = alocação ainda aberta.
    projetos_ativos = (
        await db.execute(
            select(func.count())
            .select_from(MembroProjeto)
            .where(
                MembroProjeto.membro_id == membro.id,
                MembroProjeto.data_saida.is_(None),
            )
        )
    ).scalar_one()

    papes = (
        await db.execute(
            select(func.count())
            .select_from(FormSubmission)
            .where(
                FormSubmission.membro_id == membro.id,
                FormSubmission.status == "concluido",
            )
        )
    ).scalar_one()

    perfil.update(
        {
            "membro_id": membro.id,
            "nome": membro.nome,
            "email": membro.email,
            "iniciais": "".join(p[0].upper() for p in membro.nome.split()[:2]),
            "cargo": await _primeiro(MembroCargo, Cargo, MembroCargo.cargo_id),
            "celula": await _primeiro(MembroCelula, Celula, MembroCelula.celula_id),
            "coordenacao": await _primeiro(
                MembroCoordenacao, Coordenacao, MembroCoordenacao.coordenacao_id
            ),
            "telefone": ext.telefone,
            "foto_url": ext.foto_url,
            "data_entrada": ext.data_entrada.isoformat() if ext.data_entrada else None,
            "data_nascimento": (
                ext.data_nascimento.isoformat() if ext.data_nascimento else None
            ),
            "sobre": ext.destaque_texto,
            "stats": {
                "papes_respondidos": papes,
                "projetos_ativos": projetos_ativos,
                "membro_desde": ext.data_entrada.year if ext.data_entrada else None,
            },
        }
    )
    return perfil


@router.get("/", response_model=List[UserRead], dependencies=[Depends(require_admin)])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=get_password_hash(body.password),
        role=body.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    logger.info("Usuário criado: %s (%s)", user.email, user.role)
    return user


@router.patch("/{user_id}", response_model=UserRead, dependencies=[Depends(require_admin)])
async def update_user(user_id: int, body: UserUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    for field, value in body.model_dump(exclude_unset=True).items():
        if field == "password":
            setattr(user, "hashed_password", get_password_hash(value))
        else:
            setattr(user, field, value)
    await db.flush()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204, dependencies=[Depends(require_admin)],
               summary="Desativar usuário (admin)")
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Desativa um usuário (is_active=False). Impede auto-deleção. Requer admin."""
    if user_id == current_user.id:
        raise HTTPException(400, "Não é possível desativar o próprio usuário.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    user.is_active = False
    await db.flush()
    logger.info("Usuário %s (%s) desativado", user_id, user.email)
