from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth,
    users,
    commercial,
    financial,
    project_tracking,
    hr,
    dashboard,
)

api_router = APIRouter()

api_router.include_router(auth.router,            prefix="/auth",            tags=["Autenticação"])
api_router.include_router(users.router,           prefix="/users",           tags=["Usuários do Sistema"])
api_router.include_router(commercial.router,      prefix="/comercial",       tags=["Comercial / CRM"])
api_router.include_router(financial.router,       prefix="/financeiro",      tags=["Financeiro / Contratos"])
api_router.include_router(project_tracking.router,prefix="/projetos",        tags=["Acompanhamento de Projetos"])
api_router.include_router(hr.router,              prefix="/rh",              tags=["RH / Gestão Interna"])
api_router.include_router(dashboard.router,       prefix="/dashboard",       tags=["Dashboard"])
