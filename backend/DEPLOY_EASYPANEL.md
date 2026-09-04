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
UPLOAD_DIR=/app/uploads
TV_META_MAX_UPLOAD_MB=500
```

Dois pontos que fazem o boot falhar se errados:

- **`SECRET_KEY`** — com `DEBUG=false` o `config.py` recusa subir se a chave
  tiver menos de 32 caracteres ou for a padrão. Gere uma nova no terminal do
  EasyPanel (`openssl rand -hex 32`) e cole. Ela assina os tokens JWT: quem
  tiver a chave forja token de admin, então ela não pode ter passado por chat,
  e-mail ou commit.
- **`ALLOWED_ORIGINS`** — precisa ser o domínio real do frontend. Com
  `localhost` ali, o navegador bloqueia toda chamada do app publicado por CORS.

## 2.1. Vídeo da TV Meta

O card da TV Meta, na Home, toca um vídeo MP4 em loop. Esse vídeo **não está no
repositório e não está no banco**: é um arquivo em disco no servidor, que quem
tem permissão de admin troca pela própria interface do app.

### Como isso funciona (o modelo mental)

Código e conteúdo são coisas separadas:

| | Onde vive | Como muda |
| --- | --- | --- |
| Código (telas, API) | Git → imagem Docker | Deploy |
| Vídeo da TV Meta | Pasta em disco no servidor | Upload pela interface |

Quando um admin clica em **Trocar vídeo**, o arquivo sai do computador dele e é
gravado no servidor da API — a mesma máquina que todo mundo consulta:

```
Navegador do admin  ──[ envia o MP4 ]──▶  Servidor da API  ──▶  /app/uploads/tv-meta/video.mp4
                                                                        │
Navegador de todo mundo  ◀──[ pede o vídeo ]───────────────────────────┘
```

Existe **um único arquivo**, e todos os navegadores apontam para ele. Não há
"versão do admin" e "versão dos outros", porque nunca houve cópias. Por isso a
troca vale para a empresa inteira sem deploy, sem rebuild e sem commit.

O que decide se a troca é local ou vale para todos é **qual endereço você está
usando**: no site publicado, o navegador fala com o servidor da API e o vídeo
muda para todo mundo; rodando o projeto na própria máquina (`localhost:3000` +
`localhost:8000`), o "servidor" é o seu notebook e o arquivo fica só ali.

### A. Configurar (uma vez só, por quem faz o deploy)

**1. Volume.** Em **Mounts**, no serviço `metaapp-api`:

| Campo | Valor |
| --- | --- |
| Type | Volume |
| Name | `tv-meta-uploads` |
| Mount path | `/app/uploads` |

Sem volume o upload continua funcionando — só não sobrevive ao próximo deploy.
Container é descartável: o EasyPanel joga fora o antigo e cria um novo, limpo, e
o vídeo iria junto. O volume é um pedaço de disco que fica **fora** do container
e é reconectado a cada versão nova.

**2. Variáveis.** Já estão na lista da seção 2, confira que batem:

```
UPLOAD_DIR=/app/uploads          # o mesmo caminho do Mount path acima
TV_META_MAX_UPLOAD_MB=500        # teto aceito pela API
```

`UPLOAD_DIR` e o *Mount path* **precisam ser idênticos** — é assim que a
aplicação e o volume se encontram. Se divergirem, o upload grava numa pasta
comum dentro do container e some no deploy seguinte.

**3. Tamanho do upload no proxy.** A API aceita até `TV_META_MAX_UPLOAD_MB`, mas
uma camada na frente pode cortar antes. O proxy do EasyPanel (Traefik) não impõe
limite por padrão, então provavelmente não há nada a fazer. Só investigue se o
upload falhar com **413**, e nessa ordem: Cloudflare (o plano gratuito corta em
100 MB e não tem como aumentar — a saída é comprimir o vídeo), depois um nginx
próprio, se houver (`client_max_body_size 500m;`).

**4. Deploy dos dois lados.** As variáveis e o volume só passam a valer no
próximo deploy do `metaapp-api`. O **frontend também precisa de um deploy**: o
card com o player e a liberação do vídeo na política de segurança do navegador
(`media-src`, em `next.config.ts`) vêm do build dele. Sem esse deploy, o
navegador bloqueia o vídeo mesmo com o backend correto.

### B. Publicar uma edição nova (o dia a dia, sem terminal)

1. Entre no site publicado — não em `localhost` — com um usuário **admin**.
2. Na **Home**, passe o mouse sobre o card da TV Meta. Os controles aparecem, e
   no canto superior direito fica **Trocar vídeo** (esse botão só existe para
   admin; quem não é nem enxerga).
3. Clique, escolha o `.mp4` e clique em **Publicar vídeo**.
4. Acompanhe a barra de progresso. Num arquivo grande isso leva alguns minutos —
   não feche a aba nem clique fora até terminar.
5. Ao terminar, o card já mostra o vídeo novo, e embaixo aparece o nome do
   arquivo, o tamanho e quem publicou.

Quem já estava com a Home aberta continua vendo o vídeo antigo até recarregar a
página. É de propósito: cada endereço de vídeo carrega uma marca de versão que
muda junto com o arquivo, então um F5 traz o novo sem risco de o navegador
servir o antigo do cache.

**Antes de subir, comprima.** O vídeo toca em loop na Home de todo mundo; cada
MB pesa em banda. Um MP4 de 720p em H.264 com 15–25 MB fica visualmente igual
num card desse tamanho e custa quatro vezes menos que um arquivo de 80 MB.

### C. Conferir que deu certo

Pelo terminal do serviço `metaapp-api`:

```
ls -lh /app/uploads/tv-meta/
```

Deve aparecer `video.mp4` com o tamanho esperado e `video.json` com os dados de
quem publicou. Se `ls` mostra o arquivo mas a Home não, o problema é no
navegador (cache/recarregar), não no servidor.

A prova real do volume é sobreviver a um deploy: publique o vídeo, faça um
deploy qualquer e rode o `ls` de novo. Se o arquivo continuar lá, está correto.

### D. Primeira publicação

Em produção a pasta começa vazia — o vídeo de junho existe só na máquina de
desenvolvimento, e 78 MB não entram no Git. Até alguém publicar, o card diz
"Nenhum vídeo publicado ainda" (e oferece o botão de envio para quem é admin).
Essa primeira vez é o próprio fluxo do item B funcionando, não um passo extra.

Se preferir colocar o arquivo direto no servidor — útil se o upload esbarrar em
limite de proxy — dá para baixar pelo terminal do serviço:

```
mkdir -p /app/uploads/tv-meta
curl -L -o /app/uploads/tv-meta/video.mp4 "<url-do-mp4>"
```

Nesse caminho não existe `video.json`, então a legenda do card mostra
`video.mp4` e a data do arquivo, sem o nome de quem publicou. O próximo upload
pela interface corrige isso.

### E. Quem pode trocar

Só usuários com `role = admin`. O primeiro sai do `python -m scripts.seed_admin`
(seção 5); depois, um admin promove outra pessoa por
`PATCH /api/v1/users/{id}` com `{"role": "admin"}`. `director` e `member`
assistem ao vídeo normalmente, mas não veem o botão — e, se tentarem chamar a
API na mão, levam 403.

### F. Problemas comuns

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| "Nenhum vídeo publicado ainda" | Ninguém publicou, ou o volume trocou de lugar | Publique pelo item B; confira o `ls` do item C |
| O vídeo sumiu depois de um deploy | Volume ausente ou `UPLOAD_DIR` ≠ *Mount path* | Refaça o item A e publique de novo |
| Erro **413** no envio | Arquivo acima do teto da API, ou proxy cortando | Compare com `TV_META_MAX_UPLOAD_MB`; veja o item A.3; comprima o vídeo |
| "Envie um arquivo .mp4" | Formato diferente (MOV, AVI, MKV) | Converta para MP4/H.264 |
| Não aparece o botão "Trocar vídeo" | Usuário não é admin | Item E |
| Publicou, mas ainda vejo o antigo | Página aberta desde antes da troca | Recarregue (F5) |
| O vídeo não toca numa aba deixada aberta de um dia para o outro | O link assinado do vídeo expira depois de ~12 h | Recarregue (F5) |
| Falhou no meio do envio | Queda de rede | O vídeo anterior continua no ar, intacto — a gravação só substitui o arquivo depois de receber tudo. Tente de novo |

## 3. Domínio

Em **Domains**, aponte algo como `api.metaconsultoria.com` para a porta 8000.
O EasyPanel emite o certificado HTTPS. Sem domínio o frontend não alcança a API.

Confira que subiu: `https://<dominio-da-api>/api/v1/docs`.

## 4. Migration — criar as tabelas do MetaApp

**Deploy primeiro, migration depois.** A ordem importa e é contraintuitiva: a
migration é um arquivo do repositório, então ela só existe dentro do container
depois que o deploy levou o código novo até lá. Rodar antes faz o Alembic
enxergar um `head` desatualizado e não aplicar nada do que se esperava.

Confira em que revisão o banco está — este comando **conecta**, e portanto diz
a verdade:

```
alembic current
```

Para revisar o SQL antes de aplicar, informe o intervalo explicitamente:

```
alembic upgrade <revisao_atual>:head --sql
```

O intervalo é obrigatório porque `--sql` roda em modo offline, sem conectar no
banco. Sem ele, o Alembic assume banco vazio e gera o SQL de todas as migrations
desde o início — incluindo tabelas que já existem, o que falharia em
"table already exists". Foi o que aconteceu na primeira tentativa de aplicar a
`b2c3d4e5f6a7`.

Use a aba **Terminal** do serviço.

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
