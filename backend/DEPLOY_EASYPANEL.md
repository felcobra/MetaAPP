# Deploy do backend no EasyPanel

O backend roda como um serviço App no **mesmo projeto EasyPanel do banco**.
Serviços do mesmo projeto se enxergam pelo nome do container na rede interna —
é por isso que `DB_HOST=banco_de_dados_bd` funciona e nada precisa ser exposto
na internet. Nenhum passo aqui roda na máquina de ninguém: tudo acontece no
EasyPanel.

> **O serviço já existe.** `frontend/meta-app/.env.local` aponta para
> `https://banco-de-dados-metaapp-backend.d86ysa.easypanel.host/api/v1`, e essa
> URL responde `{"status":"ok","app":"Meta App","version":"2.0.0"}` — ou seja,
> projeto `banco-de-dados`, serviço `metaapp-backend`, no ar. A seção 1 abaixo
> serve para recriar do zero ou conferir a configuração; o que falta de fato é
> a seção 4 (migration) em diante.
>
> `/api/v1/docs` responder 404 é o esperado: `main.py` desativa Swagger, ReDoc
> e OpenAPI quando `DEBUG=false`, para não expor o schema da API.

## 1. Criar o serviço (ou conferir o existente)

No projeto onde já vive o `banco_de_dados_bd`: **+ Service → App**.

| Campo | Valor |
|---|---|
| Nome | `metaapp-api` |
| Source | GitHub → `felcobra/MetaAPP`, branch `main` |
| Build path / Root directory | `backend` |
| Build method | Dockerfile (`backend/Dockerfile`) |
| Port | `8000` |

O `Build path = backend` é o que importa: o repositório é um monorepo, e sem
isso o EasyPanel tenta buildar a raiz e não acha o Dockerfile.

## 2. Variáveis de ambiente

Cole em **Environment**. Os valores reais ficam só aqui — nunca no Git.

```
DEBUG=false
SECRET_KEY=<gerar, ver abaixo>
DB_HOST=banco_de_dados_bd
DB_PORT=3306
DB_USER=meta
DB_PASSWORD=<senha do usuario meta>
DB_NAME=banco_de_dados
ALLOWED_ORIGINS=["https://<dominio-do-frontend>"]
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7
```

Dois pontos que fazem o boot falhar se errados:

- **`SECRET_KEY`** — com `DEBUG=false` o `config.py` recusa subir se a chave
  tiver menos de 32 caracteres ou for a padrão. Gere uma nova no terminal do
  EasyPanel (`openssl rand -hex 32`) e cole. Ela assina os tokens JWT: quem
  tiver a chave forja token de admin, então ela não pode ter passado por chat,
  e-mail ou commit.
- **`ALLOWED_ORIGINS`** — precisa ser o domínio real do frontend. Com
  `localhost` ali, o navegador bloqueia toda chamada do app publicado por CORS.

## 3. Domínio

Em **Domains**, aponte algo como `api.metaconsultoria.com` para a porta 8000.
O EasyPanel emite o certificado HTTPS. Sem domínio o frontend não alcança a API.

Confira que subiu: `https://<dominio-da-api>/api/v1/docs`.

## 4. Migration — criar as tabelas do MetaApp

**Só depois do serviço subir.** Use a aba **Terminal** do `metaapp-api`.

Backup primeiro, no terminal do serviço do banco:

```
mysqldump -u meta -p --single-transaction banco_de_dados > /tmp/backup_pre_metaapp.sql
```

Depois, no terminal do `metaapp-api`, gere o SQL **sem aplicar** e revise:

```
alembic upgrade head --sql
```

A migration `a1b2c3d4e5f6` foi escrita sem nunca ter tocado o banco real. Ela
cria só tabelas novas (`users`, `revoked_tokens`, `membro_perfil_metaapp`,
`org_divisao`, `org_no`, formulários) e não altera nenhuma das 27 tabelas de
negócio — mas se algum desses nomes já existir, o upgrade quebra no meio.
Revise a saída antes de aplicar:

```
alembic upgrade head
```

## 5. Seed

Primeiro admin (a senha vai para a saída do comando — anote e troque no primeiro
login):

```
python -m scripts.seed_admin
```

Perfis dos membros. O banco da empresa só guarda `membro.id/nome/email`; este
script cria a linha correspondente em `membro_perfil_metaapp` para cada membro
que ainda não tem, deixando telefone/foto/aniversário em NULL para a própria
pessoa preencher no app:

```
python -m scripts.seed_perfis --dry-run
python -m scripts.seed_perfis
```

## O que isto NÃO resolve

Com tudo acima pronto, o backend lê e escreve no banco de produção e os
endpoints funcionam. **As telas do frontend continuam mostrando dados fixos**,
porque hoje só `lib/auth-context.tsx` chama a API — as 9 páginas leem de
`src/mocks/`. Trocar esses mocks por `apiFetch` é um trabalho separado, e é ele
que faz o front refletir o banco.
