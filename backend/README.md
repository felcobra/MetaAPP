# Meta App — Backend

API REST em **FastAPI** (Python) para a plataforma interna da Meta Consultoria.

## Stack

| Tecnologia | Uso |
|---|---|
| FastAPI 0.115+ | Framework web assíncrono |
| SQLAlchemy 2.x (async) | ORM |
| MySQL + aiomysql | Banco de dados |
| Alembic | Migrações |
| python-jose | JWT Auth (access + refresh + logout) |
| passlib[bcrypt] | Hash de senhas |
| Pydantic v2 | Validação/Schemas |
| slowapi | Rate limiting (anti força bruta) |

## Estrutura de Pastas

```
backend/
├── alembic/                # Migrações de banco
│   ├── versions/           # Arquivos de migração gerados
│   ├── env.py
│   └── script.py.mako
├── app/
│   ├── api/
│   │   ├── deps.py         # Dependências (auth, roles)
│   │   └── v1/
│   │       ├── router.py   # Router principal v1
│   │       └── endpoints/  # Um arquivo por recurso
│   │           ├── auth.py          # Login, refresh, logout
│   │           ├── users.py         # Usuários + /me/membro
│   │           ├── commercial.py    # CRM: leads, oportunidades
│   │           ├── financial.py     # Contratos, pagamentos, clientes
│   │           ├── project_tracking.py # Projetos + acompanhamentos
│   │           ├── hr.py            # Membros, orgchart, alocações
│   │           ├── dashboard.py     # Métricas, KPIs, alertas
│   │           ├── forms.py         # Formulários dinâmicos (PAPE)
│   │           └── portfolio.py     # Portfólio de serviços
│   ├── core/
│   │   ├── config.py           # Settings (pydantic-settings)
│   │   ├── database.py         # Engine + sessão async
│   │   ├── security.py         # JWT + bcrypt + JTI
│   │   └── logging_config.py   # Logging estruturado
│   ├── models/                 # SQLAlchemy models (tabelas)
│   │   ├── user.py
│   │   ├── auth.py             # RevokedToken (logout seguro)
│   │   ├── commercial.py
│   │   ├── financial.py        # Inclui status em Contrato
│   │   ├── project_tracking.py
│   │   ├── hr.py               # Inclui ativo em Membro (soft-delete)
│   │   ├── forms.py
│   │   └── service.py
│   ├── schemas/                # Pydantic schemas (request/response)
│   └── main.py                 # Entry point FastAPI
├── scripts/
│   └── seed_admin.py       # Cria primeiro usuário admin
├── .env                    # Variáveis de ambiente (não commitar em produção!)
├── alembic.ini
└── requirements.txt
```

## Como rodar

### 1. Instalar dependências
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# ou: source venv/bin/activate  (Linux/Mac)
pip install -r requirements.txt
```

### 2. Configurar ambiente
```bash
# Edite .env com suas credenciais MySQL
# Mude SECRET_KEY para uma chave segura em produção!
```

### 3. Rodar migrações
```bash
alembic upgrade head
```

### 4. Criar usuário admin inicial
```bash
python -m scripts.seed_admin
```

### 5. Iniciar o servidor
```bash
uvicorn app.main:app --reload --port 8000
```

Acesse a documentação interativa em: **http://localhost:8000/api/v1/docs**

---

## Endpoints por Módulo

### 🔐 Autenticação (`/api/v1/auth`)
| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| POST | `/auth/login` | Login (rate limit: 10/min por IP) | Público |
| POST | `/auth/refresh` | Renovar access token | Público |
| POST | `/auth/logout` | Logout — invalida refresh token | Público |

### 👤 Usuários (`/api/v1/users`)
| Método | Endpoint | Descrição | Auth |
|---|---|---|---|
| GET | `/users/me` | Usuário autenticado | Autenticado |
| GET | `/users/me/profile` | Perfil para TopBar/Sidebar | Autenticado |
| GET | `/users/me/membro` | Membro vinculado ao usuário | Autenticado |
| GET | `/users/` | Listar usuários | Admin |
| POST | `/users/` | Criar usuário | Admin |
| PATCH | `/users/{id}` | Atualizar usuário | Admin |
| DELETE | `/users/{id}` | Desativar usuário | Admin |

### 💼 Comercial / CRM (`/api/v1/comercial`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/comercial/leads` | Leads (filtro: nome, empresa) |
| PATCH | `/comercial/leads/{id}` | Atualizar lead |
| DELETE | `/comercial/leads/{id}` | Deletar lead (admin) |
| GET/POST | `/comercial/oportunidades` | Oportunidades (filtro: status, coordenacao_id) |
| PATCH | `/comercial/oportunidades/{id}` | Atualizar (auto-log de fase) |
| DELETE | `/comercial/oportunidades/{id}` | Deletar (admin) |
| GET/POST | `/comercial/oportunidades/{id}/historico` | Histórico de fases |

### 💰 Financeiro (`/api/v1/financeiro`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/financeiro/clientes` | Clientes (filtro: nome) |
| DELETE | `/financeiro/clientes/{id}` | Remover cliente (admin) |
| GET/POST | `/financeiro/contratos` | Contratos (filtro: status, cliente_id) |
| PATCH | `/financeiro/contratos/{id}` | Atualizar contrato (inclui status) |
| DELETE | `/financeiro/contratos/{id}` | Remover contrato (admin) |
| GET | `/financeiro/resumo` | Totais por status de pagamento |
| GET | `/financeiro/fluxo-mensal` | Receita mês a mês (12 meses) |

### 📊 Projetos (`/api/v1/projetos`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/projetos/` | Listar projetos (filtro: status) |
| POST | `/projetos/` | Criar projeto |
| GET/PATCH | `/projetos/{id}` | Detalhe / atualizar |
| GET/POST | `/projetos/acompanhamentos/` | Health checks |
| DELETE | `/projetos/acompanhamentos/{id}` | Deletar (cascade) |
| GET/POST | `/projetos/acompanhamentos/{id}/impedimentos` | Impedimentos |
| GET/POST | `/projetos/acompanhamentos/{id}/orientador` | Orientador (1:1) |
| GET/POST | `/projetos/acompanhamentos/{id}/sprints` | Sprints |

### 👥 RH (`/api/v1/rh`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/rh/membros` | Listar membros (filtro: nome, apenas_ativos) |
| POST | `/rh/membros` | Criar membro |
| GET/PATCH | `/rh/membros/{id}` | Detalhe / atualizar |
| DELETE | `/rh/membros/{id}` | Desativar membro (soft-delete, admin) |
| GET | `/rh/membros/{id}/resumo` | Perfil completo com alocações |
| GET | `/rh/aniversariantes` | Aniversariantes do mês |
| GET | `/rh/orgchart` | Árvore hierárquica completa |
| GET | `/rh/orgchart/divisoes` | Lista divisões (rápido) |
| POST | `/rh/orgchart/divisoes` | Criar divisão |
| POST | `/rh/orgchart/nos` | Criar nó |
| DELETE | `/rh/orgchart/nos/{id}` | Remover nó (cascade) |

### 📈 Dashboard (`/api/v1/dashboard`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/dashboard/` | Métricas gerais |
| GET | `/dashboard/home` | Widget Home |
| GET | `/dashboard/kpis` | KPIs executivos |
| GET | `/dashboard/deliveries-by-month` | Entregas por mês |
| GET | `/dashboard/engagement-by-area` | Engajamento por coordenação |
| GET | `/dashboard/active-projects` | Projetos ativos (tabela) |
| GET | `/dashboard/alertas` | 🔔 Alertas: pagamentos atrasados, projetos sem acompanhamento, aniversários |

### 📝 Formulários (`/api/v1/formularios`)
| Método | Endpoint | Descrição |
|---|---|---|
| GET/POST | `/formularios/templates` | Templates de formulários |
| GET | `/formularios/templates/{id}` | Detalhes + steps |
| POST | `/formularios/templates/{id}/steps` | Adicionar step |
| POST | `/formularios/steps/{id}/fields` | Adicionar campo |
| GET/POST | `/formularios/submissoes` | Submissões do usuário |
| PATCH | `/formularios/submissoes/{id}` | Atualizar progresso/status |
| POST | `/formularios/submissoes/{id}/respostas` | Upsert de respostas |

---

## Segurança

- **JWT**: Access token (8h) + Refresh token (7 dias) com JTI único
- **Logout**: Refresh tokens são revogados na tabela `revoked_tokens`
- **Rate limiting**: Login limitado a 10 tentativas/minuto por IP (slowapi)
- **RBAC**: Roles `admin`, `director`, `member` — endpoints sensíveis exigem `admin`
- **Soft-delete**: Membros e Usuários nunca são deletados fisicamente
- **Integridade**: ON DELETE RESTRICT/CASCADE configurados em todas as FKs

## Changelog

### v2 (atual)
- ✅ Corrigido bug `strftime` (SQLite) → `DATE_FORMAT` (MySQL) no dashboard
- ✅ Corrigido path duplicado `/projetos/projetos` → `/projetos/`
- ✅ Corrigido crash no PATCH parcial de formulários
- ✅ Eliminado N+1 em `list_templates`
- ✅ Rate limiting no login/refresh
- ✅ Endpoint de logout (`POST /auth/logout`)
- ✅ Novo: `GET /users/me/membro`
- ✅ Novo: `GET /dashboard/alertas`
- ✅ Novo: `GET /rh/membros/{id}/resumo`
- ✅ Novo: `GET /rh/aniversariantes`
- ✅ Novo: `GET /financeiro/fluxo-mensal`
- ✅ Soft-delete em Membro e Usuário
- ✅ Campo `status` em Contrato
- ✅ DELETE com proteção em leads, oportunidades, clientes, contratos
- ✅ Filtros por nome/status em Membros, Leads, Contratos, Projetos
- ✅ Logging estruturado em todas as operações

### v1
- Versão inicial
