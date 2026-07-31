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
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user, require_admin
from app.models.user import User
from app.models.hr import Membro, MembroPerfilMetaapp
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
