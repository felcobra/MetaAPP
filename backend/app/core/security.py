"""
Segurança — JWT e bcrypt
Funções de hash de senha e geração/validação de tokens JWT.

Mudanças v2:
- Refresh tokens incluem `jti` (UUID único) para suporte a revogação via logout
- `datetime.now(timezone.utc)` usado em todos os lugares (utcnow() está deprecated)
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def generate_jti() -> str:
    """Gera um JWT ID único para identificar um refresh token."""
    return str(uuid.uuid4())


def create_access_token(subject: Any, expires_delta: timedelta | None = None) -> str:
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(subject: Any) -> tuple[str, str]:
    """Gera um refresh token com JTI único.

    Returns:
        (token_str, jti) — o JTI deve ser armazenado para possível revogação.
    """
    jti = generate_jti()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh",
        "jti": jti,
    }
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, jti


def create_media_token(subject: Any) -> str:
    """Token de leitura de mídia (vídeo da TV Meta).

    A tag <video> não envia o header Authorization, então o token precisa ir na
    URL. Por isso ele é separado do access token: tipo próprio ("media"), sem
    permissão de chamar a API, e com validade própria — se o link vazar, expõe
    só o vídeo institucional e por tempo limitado.
    """
    # A expiração é arredondada para o fim de uma janela fixa (e não "agora +
    # 12h"): assim o token — e portanto a URL do vídeo — não muda a cada
    # request, e o navegador reaproveita o arquivo que já baixou em vez de
    # puxar os megabytes de novo a cada visita à Home. Duas janelas de folga
    # para o token nunca nascer perto de expirar.
    janela = max(int(settings.MEDIA_TOKEN_EXPIRE_MINUTES) * 60, 60)
    agora = int(datetime.now(timezone.utc).timestamp())
    expire = datetime.fromtimestamp(
        (agora // janela + 2) * janela, tz=timezone.utc
    )
    to_encode = {"exp": expire, "sub": str(subject), "type": "media"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
