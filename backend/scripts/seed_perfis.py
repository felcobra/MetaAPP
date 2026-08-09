"""
Cria a linha de perfil estendido (membro_perfil_metaapp) para cada membro que
ainda nao tem uma.

Contexto: o banco da empresa so guarda membro.id/nome/email. Os campos que o
frontend usa (telefone, foto, aniversario, destaque) vivem em
membro_perfil_metaapp, tabela exclusiva do MetaApp. Sem uma linha ali, as telas
de Profile/OrgChart/Home quebram ao tentar ler o perfil de um membro.

Este script NAO inventa dados. Ele cria a linha com os campos opcionais em NULL
e ativo=True; telefone, data de nascimento e foto ficam para o proprio membro
preencher dentro do app. Popular esses campos com valores ficticios colocaria
dado falso no banco de producao da empresa.

Idempotente: rodar de novo so cria o que faltar, nunca sobrescreve perfil
existente.

Uso:
    cd backend
    python -m scripts.seed_perfis            # aplica
    python -m scripts.seed_perfis --dry-run  # so mostra o que faria
"""
import asyncio
import sys

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine
from app.models.hr import Membro, MembroPerfilMetaapp
from app.models.user import User


async def seed_perfis(dry_run: bool = False) -> None:
    async with AsyncSessionLocal() as session:
        membros = (await session.execute(select(Membro))).scalars().all()
        if not membros:
            print("Nenhum membro encontrado. O banco esta correto/conectado?")
            return

        # Um SELECT so, em vez de um por membro.
        ja_tem = set(
            (await session.execute(select(MembroPerfilMetaapp.membro_id)))
            .scalars()
            .all()
        )
        # Vincula o perfil ao login quando o email bate. Emails de membro sao
        # corporativos e unicos na pratica, mas o banco nao garante unique em
        # membro.email -- entao o primeiro que casar vence, e o resto fica sem
        # user_id (a coluna e unique, dois perfis nao podem apontar pro mesmo).
        users_por_email = {
            email.lower(): uid
            for uid, email in (
                await session.execute(select(User.id, User.email))
            ).all()
        }
        users_usados = set(
            (
                await session.execute(
                    select(MembroPerfilMetaapp.user_id).where(
                        MembroPerfilMetaapp.user_id.is_not(None)
                    )
                )
            )
            .scalars()
            .all()
        )

        criados = 0
        vinculados = 0
        for membro in membros:
            if membro.id in ja_tem:
                continue

            user_id = users_por_email.get((membro.email or "").lower())
            if user_id in users_usados:
                user_id = None
            elif user_id is not None:
                users_usados.add(user_id)
                vinculados += 1

            if dry_run:
                marca = f" -> user #{user_id}" if user_id else ""
                print(f"  criaria perfil para #{membro.id} {membro.nome}{marca}")
            else:
                session.add(
                    MembroPerfilMetaapp(membro_id=membro.id, user_id=user_id, ativo=True)
                )
            criados += 1

        if dry_run:
            print(f"\n[dry-run] {criados} perfis seriam criados, {vinculados} com login vinculado.")
            print("Nada foi gravado.")
            return

        await session.commit()
        print(f"{criados} perfis criados ({vinculados} vinculados a um login).")
        print(f"{len(membros) - criados} membros ja tinham perfil.")


async def main() -> None:
    # O pool precisa ser fechado enquanto o event loop ainda existe. Sem isto,
    # asyncio.run() fecha o loop primeiro e o coletor de lixo finaliza as
    # conexões do aiomysql depois, imprimindo um traceback
    # "RuntimeError: Event loop is closed" apos o trabalho ja ter sido
    # commitado -- alarmante e inofensivo ao mesmo tempo.
    try:
        await seed_perfis(dry_run="--dry-run" in sys.argv)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
