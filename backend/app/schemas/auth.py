import re

from pydantic import BaseModel, EmailStr, field_validator


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


def _validar_forca_senha(v: str) -> str:
    """Regra única de força de senha, usada pelo cadastro e pela troca."""
    if len(v) < 8:
        raise ValueError("A senha deve ter no mínimo 8 caracteres.")
    if not re.search(r"[A-Za-z]", v):
        raise ValueError("A senha deve conter ao menos uma letra.")
    if not re.search(r"\d", v):
        raise ValueError("A senha deve conter ao menos um número.")
    return v


class ChangePasswordRequest(BaseModel):
    senha_atual: str
    senha_nova: str

    @field_validator("senha_nova")
    @classmethod
    def validar_forca(cls, v: str) -> str:
        return _validar_forca_senha(v)


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    senha_nova: str

    @field_validator("senha_nova")
    @classmethod
    def validar_forca(cls, v: str) -> str:
        return _validar_forca_senha(v)


class RegisterRequest(BaseModel):
    """Auto-cadastro de membro da empresa.

    Não recebe `full_name` nem `role`: o nome vem da tabela `membro` e o papel
    é sempre "member". Deixar qualquer um dos dois vir do cliente permitiria
    que alguém se registrasse como admin.
    """
    email: EmailStr
    password: str

    @field_validator("password")
    @classmethod
    def validar_forca(cls, v: str) -> str:
        # Mesma regra do UserCreate, para o auto-cadastro não abrir uma porta
        # com senha mais fraca que a do cadastro feito por admin.
        return _validar_forca_senha(v)


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
