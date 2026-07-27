from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator
import re


class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: Literal["admin", "director", "member"] = "member"


class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Mínimo: 8 chars, ao menos 1 letra e 1 número."""
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("A senha deve conter ao menos uma letra.")
        if not re.search(r"\d", v):
            raise ValueError("A senha deve conter ao menos um número.")
        return v


class UserUpdate(BaseModel):
    full_name: str | None = None
    role: Literal["admin", "director", "member"] | None = None
    is_active: bool | None = None
    password: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if len(v) < 8:
            raise ValueError("A senha deve ter no mínimo 8 caracteres.")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("A senha deve conter ao menos uma letra.")
        if not re.search(r"\d", v):
            raise ValueError("A senha deve conter ao menos um número.")
        return v


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
