"""
Configuração centralizada — lida via variáveis de ambiente (.env).

Segurança:
- SECRET_KEY fraca é bloqueada automaticamente em produção (DEBUG=False)
- DB_USER "root" emite aviso em produção
- DATABASE_URL construída como property (nunca hardcoded)
"""
from pydantic_settings import BaseSettings
from pydantic import model_validator
from typing import List
from urllib.parse import quote_plus
import warnings


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Meta App"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    DEBUG: bool = False

    # Security
    SECRET_KEY: str = "TROQUE_ESTA_CHAVE_EM_PRODUCAO"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hora (MED-01: reduzido de 8h para limitar janela de exploração)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database (MySQL)
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = ""
    DB_NAME: str = "metaapp"

    @property
    def DATABASE_URL(self) -> str:
        # DB_USER/DB_PASSWORD são URL-encoded pois podem conter caracteres
        # especiais (ex: "@") que quebrariam o parsing da connection string.
        user = quote_plus(self.DB_USER)
        password = quote_plus(self.DB_PASSWORD)
        return (
            f"mysql+aiomysql://{user}:{password}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )

    # E-mail (SMTP) — usado só na redefinição de senha.
    # Vazio = redefinição por e-mail desligada; o endpoint continua respondendo
    # normalmente (para não revelar quais e-mails existem) e registra um aviso.
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""

    # Base para montar o link do e-mail. Aponta para o FRONTEND, não para a API.
    FRONTEND_URL: str = "http://localhost:3000"
    RESET_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ]
    # Origens extras para rede local/staging. Adicione via .env sem alterar código:
    # EXTRA_ALLOWED_ORIGINS=["http://192.168.1.100:3000","https://staging.exemplo.com"]
    EXTRA_ALLOWED_ORIGINS: List[str] = []

    @property
    def ALL_ALLOWED_ORIGINS(self) -> List[str]:
        """Combina ALLOWED_ORIGINS + EXTRA_ALLOWED_ORIGINS (sem duplicatas)."""
        combined = list(dict.fromkeys(self.ALLOWED_ORIGINS + self.EXTRA_ALLOWED_ORIGINS))
        return combined

    # MED-04: métodos e headers explicitamente permitidos (em vez de allow all)
    ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    ALLOWED_HEADERS: List[str] = ["Content-Type", "Authorization"]

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        """Bloqueia configurações inseguras em ambiente de produção."""
        _WEAK_KEY = "TROQUE_ESTA_CHAVE_EM_PRODUCAO"

        if not self.DEBUG:
            # Produção: SECRET_KEY fraca é erro fatal
            if self.SECRET_KEY == _WEAK_KEY or len(self.SECRET_KEY) < 32:
                raise ValueError(
                    "SECRET_KEY inválida para produção. "
                    "Gere uma chave segura: openssl rand -hex 32"
                )
            # Produção: avisar sobre uso de root
            if self.DB_USER == "root":
                warnings.warn(
                    "⚠️  DB_USER=root em produção. Crie um usuário MySQL dedicado com privilégios mínimos.",
                    stacklevel=2,
                )
        else:
            # Desenvolvimento: apenas avisar (não bloquear)
            if self.SECRET_KEY == _WEAK_KEY:
                warnings.warn(
                    "⚠️  SECRET_KEY padrão detectada. Altere no .env antes de ir para produção.",
                    stacklevel=2,
                )

        return self

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
