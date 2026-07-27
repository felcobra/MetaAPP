"""
Configuração de Logging Estruturado — Meta App

Usa logging padrão do Python com formatação legível.
Em produção, pode ser trocado por structlog ou loguru sem mudar a interface.
"""
import logging
import sys
from app.core.config import settings


def setup_logging() -> None:
    """Configura o logging global da aplicação."""
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO

    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Handler para stdout
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Logger raiz da aplicação
    root_logger = logging.getLogger("metaapp")
    root_logger.setLevel(log_level)
    root_logger.handlers.clear()
    root_logger.addHandler(handler)

    # Reduzir verbosidade do SQLAlchemy em produção
    if not settings.DEBUG:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    root_logger.info("Logging configurado — nível: %s", logging.getLevelName(log_level))


# Logger pronto para import direto em qualquer módulo
logger = logging.getLogger("metaapp")
