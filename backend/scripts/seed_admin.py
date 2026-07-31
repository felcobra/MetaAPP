"""
Script de seed para criar o primeiro usuário admin.

Segurança v2:
- CRIT-02: senha lida de ADMIN_PASSWORD env var; se ausente, gerada automaticamente
  com 16 caracteres seguros (letras + números + símbolos).
- LOW-01: verifica se admin já existe antes de criar — idempotente.
"""
import asyncio
import os
import secrets
import string

from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User

ADMIN_EMAIL = "admin@metaconsultoria.com"


async def create_admin() -> None:
    # CRIT-02: lê senha de variável de ambiente ou gera uma segura
    password = os.environ.get("ADMIN_PASSWORD", "").strip()
    auto_generated = False

    if not password:
        alphabet = string.ascii_letters + string.digits + "!@#$%^&*"
        password = "".join(secrets.choice(alphabet) for _ in range(16))
        auto_generated = True

    async with AsyncSessionLocal() as session:
        # LOW-01: verificar se admin já existe (idempotente)
        result = await session.execute(
            select(User).where(User.email == ADMIN_EMAIL)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"⚠️  Usuário admin '{ADMIN_EMAIL}' já existe. Nenhuma alteração foi feita.")
            return

        admin = User(
            email=ADMIN_EMAIL,
            full_name="Administrador",
            hashed_password=get_password_hash(password),
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()

    print(f"✅ Usuário admin criado: {ADMIN_EMAIL}")
    if auto_generated:
        print(f"🔑 Senha gerada: {password}")
        print("⚠️  ANOTE ESTA SENHA AGORA — ela não será exibida novamente!")
        print("    Alternativamente, defina ADMIN_PASSWORD=<sua_senha> antes de rodar.")
    else:
        print("🔑 Senha configurada via ADMIN_PASSWORD (env var).")


if __name__ == "__main__":
    asyncio.run(create_admin())
