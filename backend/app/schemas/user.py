from datetime import datetime
from typing import Literal
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=200)
    role: Literal["admin", "director", "member"] = "member"

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, v: str) -> str:
        return v.strip()


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
    full_name: str | None = Field(None, min_length=1, max_length=200)
    role: Literal["admin", "director", "member"] | None = None
    is_active: bool | None = None
    password: str | None = None

    @field_validator("full_name")
    @classmethod
    def strip_full_name(cls, v: str | None) -> str | None:
        return v.strip() if v else v

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
