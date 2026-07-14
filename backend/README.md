# Meta App — Backend

API REST em **FastAPI** (Python) para a plataforma interna da Meta Consultoria.

## Stack

| Tecnologia | Uso |
|---|---|
| FastAPI | Framework web assíncrono |
| SQLAlchemy 2.x (async) | ORM |
| MySQL + aiomysql | Banco de dados |
| Alembic | Migrações |
| python-jose | JWT Auth |
| passlib[bcrypt] | Hash de senhas |
| Pydantic v2 | Validação/Schemas |

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
│   │           ├── auth.py
│   │           ├── users.py
│   │           ├── members.py
│   │           ├── projects.py
│   │           ├── tasks.py
│   │           ├── financial.py
│   │           ├── recruitment.py
│   │           ├── documents.py
│   │           └── dashboard.py
│   ├── core/
│   │   ├── config.py       # Settings (pydantic-settings)
│   │   ├── database.py     # Engine + sessão async
│   │   └── security.py     # JWT + bcrypt
│   ├── models/             # SQLAlchemy models (tabelas)
│   ├── schemas/            # Pydantic schemas (request/response)
│   └── main.py             # Entry point FastAPI
├── scripts/
│   └── seed_admin.py       # Cria primeiro usuário admin
├── uploads/                # Arquivos enviados (auto-criado)
├── .env.example            # Template de variáveis de ambiente
├── alembic.ini
└── requirements.txt
```

## Como rodar

### 1. Instalar dependências
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### 2. Configurar ambiente
```bash
copy .env.example .env
# Edite .env com suas credenciais MySQL
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

Acesse a documentação em: **http://localhost:8000/api/v1/docs**

## Endpoints Principais

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Renovar token |
| GET | `/api/v1/dashboard` | Métricas gerais |
| GET/POST | `/api/v1/members` | Membros |
| GET/POST | `/api/v1/projects` | Projetos |
| GET/POST | `/api/v1/tasks` | Tarefas |
| GET/POST | `/api/v1/financial/transactions` | Financeiro |
| GET/POST | `/api/v1/recruitment/processes` | Processo Seletivo |
| POST | `/api/v1/documents/upload` | Upload de documentos |
