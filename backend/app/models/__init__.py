"""
Registro central de todos os models SQLAlchemy.
Importar aqui garante que o Alembic detecte todas as tabelas no autogenerate.

Ordem de importação respeita as dependências de FK:
  1. Tabelas de dimensão e auxiliares (sem FKs externas)
  2. Entidades independentes (users)
  3. Entidades com FK para as anteriores
  4. Tabelas associativas N:N
"""
from app.core.database import Base  # noqa: F401

# Usuários do sistema (autenticação)
from app.models.user import User  # noqa: F401

# Módulo Comercial
from app.models.commercial import (  # noqa: F401
    DimLeadOrigem,
    DimMotivoPerdida,
    Lead,
    Oportunidade,
    OportunidadePhaseHistory,
)

# Módulo de Acompanhamento de Projetos
from app.models.project_tracking import (  # noqa: F401
    ProjetoExterno,
    AcompanhamentoProjeto,
    AcompImpedimento,
    AcompOrientador,
    AcompSprint,
)

# Módulo Financeiro
from app.models.financial import (  # noqa: F401
    FormaPagamento,
    ContaBancaria,
    CategoriaTransacao,
    Cliente,
    Contrato,
    ContratoPagamento,
)

# Módulo de RH e Gestão Interna
from app.models.hr import (  # noqa: F401
    Celula,
    Coordenacao,
    Cargo,
    Membro,
    MembroCargo,
    MembroCelula,
    MembroCoordenacao,
    MembroProjeto,
)
