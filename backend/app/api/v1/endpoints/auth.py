"""
Endpoints de Autenticação — Login, Refresh e Logout.

Segurança v3:
- Rate limiting: 10 tentativas/minuto por IP no login (slowapi)
- Refresh tokens incluem JTI para revogação explícita via logout
- Logout invalida o refresh token (insere JTI na tabela revoked_tokens)
- datetime.now(timezone.utc) em todo lugar (utcnow deprecated)
- MED-03: timing-safe login — dummy hash evita enumeração de usuários por tempo
- MED-02: Refresh Token Rotation — token antigo é revogado ao emitir novo
- CRIT-03: commit explícito no logout garante persistência em resposta 204
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
)
from app.models.user import User
from app.models.auth import RevokedToken
from app.schemas.auth import Token, RefreshTokenRequest, LogoutRequest

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# MED-03: hash dummy pré-computado para garantir tempo de resposta constante
# no login, mesmo quando o e-mail não existe no banco (evita user enumeration).
_DUMMY_HASH: str = get_password_hash("__meta_timing_protection_dummy_2026__")


@router.post("/login", response_model=Token, summary="Login com email e senha")
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Autentica o usuário e retorna access + refresh tokens.
    - Limitado a 10 tentativas por minuto por IP (força bruta).
    - Sempre executa verify_password para evitar timing attacks (MED-03).
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    # MED-03: mesmo se o usuário não existe, executa o bcrypt para equalizar
    # o tempo de resposta e impedir enumeração por análise de timing.
    hash_to_check = user.hashed_password if user else _DUMMY_HASH
    password_ok = verify_password(form_data.password, hash_to_check)

    if not user or not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo. Contate o administrador.",
        )

    refresh_token, _jti = create_refresh_token(user.id)
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token, summary="Renovar access token")
@limiter.limit("20/minute")
async def refresh_token(
    request: Request,
    body: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db),
):
    """Gera um novo par de tokens usando um refresh token válido.
    - Verifica se o token foi revogado antes de aceitar.
    - MED-02: Refresh Token Rotation — revoga o JTI antigo ao emitir o novo.
    """
    from jose import JWTError

    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = int(payload["sub"])
        jti = payload.get("jti")
        exp_ts = payload.get("exp", 0)
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    # Verificar se o token foi revogado
    if jti:
        revoked = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
        if revoked.scalar_one_or_none():
            raise HTTPException(
                status_code=401, detail="Token revogado. Faça login novamente."
            )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")

    # MED-02: Refresh Token Rotation — revogar o JTI antigo antes de emitir o novo.
    # Isso garante que um refresh token capturado não possa ser reutilizado após
    # uma renovação legítima.
    if jti:
        old_exp = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
        db.add(RevokedToken(jti=jti, user_id=user_id, expired_at=old_exp))
        await db.flush()

    new_refresh, _new_jti = create_refresh_token(user.id)
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": new_refresh,
        "token_type": "bearer",
    }


@router.post("/logout", status_code=204, summary="Logout — invalida o refresh token")
async def logout(
    body: LogoutRequest,
    db: AsyncSession = Depends(get_db),
):
    """Revoga o refresh token enviado, impedindo sua reutilização.
    O access token continuará válido até expirar (comportamento padrão JWT).
    Não requer autenticação para permitir logout mesmo com access expirado.
    CRIT-03: commit explícito garante que a revogação persiste mesmo em resposta 204.
    """
    from jose import JWTError

    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            return  # Token inválido — retorna 204 de qualquer forma (não revela info)
        jti = payload.get("jti")
        user_id = int(payload.get("sub", 0))
        exp_ts = payload.get("exp", 0)
        expired_at = datetime.fromtimestamp(exp_ts, tz=timezone.utc)
    except (JWTError, Exception):
        return  # Token expirado/inválido — logout silencioso

    if jti:
        # Idempotente: ignora se JTI já foi revogado
        existing = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
        if not existing.scalar_one_or_none():
            db.add(RevokedToken(jti=jti, user_id=user_id, expired_at=expired_at))
            await db.flush()
            # CRIT-03: commit explícito necessário — endpoints que retornam None (204)
            # podem não acionar o commit automático do get_db em todos os cenários.
            await db.commit()
