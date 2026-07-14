"""Script de seed para criar o primeiro usuário admin."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.core.security import get_password_hash
from app.models.user import User


async def create_admin():
    async with AsyncSessionLocal() as session:
        admin = User(
            email="admin@metaconsultoria.com",
            full_name="Administrador",
            hashed_password=get_password_hash("admin123"),
            role="admin",
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print("✅ Usuário admin criado: admin@metaconsultoria.com / admin123")
        print("⚠️  Troque a senha imediatamente após o primeiro login!")


if __name__ == "__main__":
    asyncio.run(create_admin())
