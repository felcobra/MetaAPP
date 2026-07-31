"""
Meta App — Entry Point FastAPI

v3 — Melhorias de Segurança:
- HIGH-04: Swagger/OpenAPI desabilitado em produção (DEBUG=False)
- MED-04: CORS com métodos e headers explícitos (não mais allow_all)
- LOW-02: Migrado de on_event (deprecated) para lifespan context manager
- Mantidos: headers de segurança HTTP, rate limiter, global exception handler
"""
import time
import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.v1.router import api_router

# Configura logging antes de tudo
setup_logging()
logger = logging.getLogger("metaapp")

# Rate limiter global (usado nos endpoints de auth)
limiter = Limiter(key_func=get_remote_address)


# LOW-02: lifespan substitui os deprecated @app.on_event("startup"/"shutdown")
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    logger.info("🚀 %s v%s iniciado", settings.PROJECT_NAME, settings.VERSION)
    yield
    logger.info("⏹️  %s desligando...", settings.PROJECT_NAME)


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="API interna da Meta Consultoria",
    lifespan=lifespan,
    # HIGH-04: documentação interativa desabilitada em produção
    # Em produção (DEBUG=False), os endpoints /docs, /redoc e /openapi.json
    # retornam 404, evitando exposição do schema completo da API.
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{settings.API_V1_STR}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_V1_STR}/redoc" if settings.DEBUG else None,
)

# Integra rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# MED-04: CORS com allowlists explícitas (não mais allow_methods=["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Loga cada request com método, path e tempo de resposta."""
    start = time.monotonic()
    response = await call_next(request)
    elapsed_ms = round((time.monotonic() - start) * 1000, 1)
    logger.info(
        "%s %s → %s [%sms]",
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Adiciona headers de segurança HTTP em todas as respostas.

    Protege contra:
    - Clickjacking: X-Frame-Options DENY
    - MIME sniffing: X-Content-Type-Options nosniff
    - Referrer leakage: Referrer-Policy strict-origin-when-cross-origin
    - Permissões de browser: Permissions-Policy desabilita microfone, câmera etc.
    - HSTS (apenas em produção): força HTTPS por 1 ano
    """
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    if not settings.DEBUG:
        # HSTS: força HTTPS por 1 ano em produção
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Captura erros não tratados, loga e retorna 500 limpo."""
    logger.exception(
        "Erro não tratado em %s %s: %s",
        request.method,
        request.url.path,
        exc,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro interno do servidor. Tente novamente mais tarde."},
    )


app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME, "version": settings.VERSION}
