"""
Endpoints de Autenticação — Login, Refresh e Logout.

Segurança v2:
- Rate limiting: 10 tentativas/minuto por IP no login (slowapi)
- Refresh tokens incluem JTI para revogação explícita via logout
- Logout invalida o refresh token (insere JTI na tabela revoked_tokens)
- datetime.now(timezone.utc) em todo lugar (utcnow deprecated)
"""
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import verify_password, create_access_token, create_refresh_token, decode_token
from app.core.config import settings
from app.models.user import User
from app.models.auth import RevokedToken
from app.schemas.auth import Token, RefreshTokenRequest, LogoutRequest

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=Token, summary="Login com email e senha")
@limiter.limit("10/minute")
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    """Autentica o usuário e retorna access + refresh tokens.
    Limitado a 10 tentativas por minuto por IP para prevenir força bruta.
    """
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
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
    Verifica se o token foi revogado via logout antes de aceitar.
    """
    from jose import JWTError

    try:
        payload = decode_token(body.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Token inválido")
        user_id = int(payload["sub"])
        jti = payload.get("jti")
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Token inválido ou expirado")

    # Verificar se o token foi revogado
    if jti:
        revoked = await db.execute(select(RevokedToken).where(RevokedToken.jti == jti))
        if revoked.scalar_one_or_none():
            raise HTTPException(status_code=401, detail="Token revogado. Faça login novamente.")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")

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
