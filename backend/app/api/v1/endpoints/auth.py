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
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.core.config import settings
from app.core.database import get_db
from app.core.email import enviar_email
from app.api.deps import get_current_user
from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
)
from app.models.user import User
from app.models.auth import RevokedToken, PasswordResetToken
from app.models.hr import Membro, MembroPerfilMetaapp
from app.schemas.auth import (
    Token, RefreshTokenRequest, LogoutRequest, RegisterRequest,
    ChangePasswordRequest, ForgotPasswordRequest, ResetPasswordRequest,
)

import logging

logger = logging.getLogger("metaapp")
router = APIRouter()
limiter = Limiter(key_func=get_remote_address)

# MED-03: hash dummy pré-computado para garantir tempo de resposta constante
# no login, mesmo quando o e-mail não existe no banco (evita user enumeration).
_DUMMY_HASH: str = get_password_hash("__meta_timing_protection_dummy_2026__")


def _hash_token(token: str) -> str:
    """SHA-256 do token. O banco guarda só isto — ver PasswordResetToken."""
    return hashlib.sha256(token.encode()).hexdigest()


@router.post("/forgot-password", status_code=204,
             summary="Solicitar link de redefinição de senha")
@limiter.limit("3/minute")
async def forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Envia por e-mail um link de redefinição, se a conta existir.

    Responde 204 sempre — inclusive para e-mail inexistente, conta inativa ou
    SMTP fora do ar. Qualquer diferença de resposta permitiria descobrir quem
    tem conta no sistema, que é exatamente a informação que um atacante quer
    antes de tentar força bruta.
    """
    email = body.email.strip().lower()
    user = (await db.execute(
        select(User).where(func.lower(User.email) == email)
    )).scalar_one_or_none()

    if user and user.is_active:
        # Token só existe em claro aqui e no e-mail; o banco guarda o hash.
        token = secrets.token_urlsafe(32)
        db.add(PasswordResetToken(
            user_id=user.id,
            token_hash=_hash_token(token),
            expires_at=datetime.now(timezone.utc)
            + timedelta(minutes=settings.RESET_TOKEN_EXPIRE_MINUTES),
        ))
        await db.flush()

        link = f"{settings.FRONTEND_URL.rstrip('/')}/redefinir-senha?token={token}"
        await enviar_email(
            destinatario=user.email,
            assunto="Redefinição de senha — Meta App",
            corpo_texto=(
                f"Olá, {user.full_name}.\n\n"
                "Recebemos um pedido para redefinir a senha da sua conta no Meta App.\n"
                f"Use o link abaixo (válido por {settings.RESET_TOKEN_EXPIRE_MINUTES} minutos):\n\n"
                f"{link}\n\n"
                "Se não foi você que pediu, ignore este e-mail — sua senha continua a mesma.\n"
            ),
        )
        logger.info("Redefinição de senha solicitada para o usuário %s", user.id)


@router.post("/reset-password", status_code=204,
             summary="Redefinir a senha usando o token recebido por e-mail")
@limiter.limit("5/minute")
async def reset_password(
    request: Request,
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """Consome o token do e-mail e grava a senha nova.

    O token vale uma vez só e expira: `used_at` é carimbado no uso, e a
    validade é conferida contra o relógio, não contra a existência da linha.
    """
    registro = (await db.execute(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == _hash_token(body.token))
    )).scalar_one_or_none()

    agora = datetime.now(timezone.utc)
    # expires_at volta do MySQL sem fuso; compara-se em UTC ingênuo.
    expirado = registro is not None and registro.expires_at < agora.replace(tzinfo=None)

    if not registro or registro.used_at is not None or expirado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Link inválido ou expirado. Peça um novo.",
        )

    user = (await db.execute(
        select(User).where(User.id == registro.user_id)
    )).scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=400, detail="Link inválido ou expirado. Peça um novo.")

    user.hashed_password = get_password_hash(body.senha_nova)
    registro.used_at = agora.replace(tzinfo=None)

    # Invalida os outros pedidos pendentes da mesma conta: se alguém clicou
    # duas vezes em "esqueci a senha", o link antigo não pode continuar valendo
    # depois que o novo foi usado.
    await db.execute(
        update(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
        .values(used_at=agora.replace(tzinfo=None))
    )
    await db.flush()

    logger.info("Senha redefinida via token pelo usuário %s", user.id)


@router.post("/change-password", status_code=204,
             summary="Trocar a própria senha (requer a senha atual)")
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    body: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Troca a senha de quem está logado.

    Exige a senha atual: sem isso, um token roubado viraria posse permanente
    da conta, já que o atacante trocaria a senha e o dono perderia o acesso.
    """
    if not verify_password(body.senha_atual, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta.",
        )

    if verify_password(body.senha_nova, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A senha nova precisa ser diferente da atual.",
        )

    current_user.hashed_password = get_password_hash(body.senha_nova)
    await db.flush()

    logger.info("Senha alterada pelo próprio usuário %s", current_user.id)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED,
             summary="Auto-cadastro de membro da empresa")
@limiter.limit("5/minute")
async def register(
    request: Request,
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Cria o login de quem já é membro da empresa.

    O portão é a tabela `membro`: só se cadastra quem já está lá, com o mesmo
    e-mail. Isso mantém o app fechado sem precisar de convite ou aprovação —
    e resolve o vínculo membro↔usuário na hora, em vez de depender de um seed.

    O nome e o papel não vêm do cliente: nome sai de `membro.nome` e o papel é
    sempre "member". Promover alguém a admin continua sendo ação de admin.
    """
    email = body.email.strip().lower()

    membro = (await db.execute(
        select(Membro).where(func.lower(Membro.email) == email)
    )).scalar_one_or_none()

    ja_existe = (await db.execute(
        select(User).where(func.lower(User.email) == email)
    )).scalar_one_or_none()

    perfil = None
    if membro:
        perfil = (await db.execute(
            select(MembroPerfilMetaapp)
            .where(MembroPerfilMetaapp.membro_id == membro.id)
        )).scalar_one_or_none()

    # Uma mensagem só para "não é membro", "já tem conta" e "perfil já
    # vinculado". Distinguir os casos transformaria este endpoint num oráculo
    # para descobrir quem trabalha na Meta e quem ainda não se cadastrou.
    if not membro or ja_existe or (perfil and perfil.user_id is not None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Não foi possível criar a conta com este e-mail. "
                "Use seu e-mail corporativo da Meta. Se você já tem conta, "
                "faça login."
            ),
        )

    user = User(
        email=membro.email,
        full_name=membro.nome,
        hashed_password=get_password_hash(body.password),
        role="member",
        is_active=True,
    )
    db.add(user)
    await db.flush()

    if perfil is None:
        # Membro sem linha de perfil (cadastrado depois do seed_perfis).
        perfil = MembroPerfilMetaapp(membro_id=membro.id, ativo=True)
        db.add(perfil)
    perfil.user_id = user.id
    await db.flush()

    logger.info("Auto-cadastro: user %s vinculado ao membro %s", user.id, membro.id)

    refresh_token, _jti = create_refresh_token(user.id)
    return {
        "access_token": create_access_token(user.id),
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


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
