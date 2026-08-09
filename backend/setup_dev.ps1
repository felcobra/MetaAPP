# ============================================================
#  MetaAPP — Setup Rápido para Desenvolvimento
#  Execute este script UMA VEZ para preparar o ambiente local.
#
#  Pré-requisitos:
#    - MySQL rodando na porta 3306 (root sem senha ou configure .env)
#    - Banco de dados "metaapp" criado no MySQL
#    - Python 3.10+ instalado
#
#  Como rodar (PowerShell):
#    cd backend
#    .\setup_dev.ps1
# ============================================================

Write-Host "`n🚀 MetaAPP — Setup do ambiente de desenvolvimento" -ForegroundColor Cyan
Write-Host "=" * 55 -ForegroundColor DarkGray

# 1. Verificar se o venv existe
if (-not (Test-Path ".\venv\Scripts\Activate.ps1")) {
    Write-Host "`n📦 Criando virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Falha ao criar venv. Verifique se Python está instalado." -ForegroundColor Red
        exit 1
    }
}

# 2. Ativar venv
Write-Host "`n✅ Ativando virtual environment..." -ForegroundColor Green
.\venv\Scripts\Activate.ps1

# 3. Instalar dependências
Write-Host "`n📦 Instalando dependências (requirements.txt)..." -ForegroundColor Yellow
pip install -r requirements.txt -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha ao instalar dependências." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependências instaladas." -ForegroundColor Green

# 4. Verificar conexão com MySQL
Write-Host "`n🔌 Testando conexão com MySQL..." -ForegroundColor Yellow
python -c "
import asyncio, sys
async def test():
    try:
        from app.core.database import AsyncSessionLocal
        async with AsyncSessionLocal() as s:
            from sqlalchemy import text
            await s.execute(text('SELECT 1'))
        print('OK')
    except Exception as e:
        print(f'FAIL:{e}')
asyncio.run(test())
" 2>&1 | Tee-Object -Variable mysqlTest | Out-Null

if ($mysqlTest -notmatch "^OK") {
    Write-Host "❌ Não foi possível conectar ao MySQL!" -ForegroundColor Red
    Write-Host "   Verifique se:" -ForegroundColor Yellow
    Write-Host "   1. O MySQL está rodando (porta 3306)"
    Write-Host "   2. O banco 'metaapp' existe: CREATE DATABASE metaapp CHARACTER SET utf8mb4;"
    Write-Host "   3. As credenciais no .env estão corretas (DB_USER, DB_PASSWORD)"
    Write-Host ""
    Write-Host "   Erro: $mysqlTest" -ForegroundColor DarkGray
    exit 1
}
Write-Host "✅ MySQL conectado com sucesso." -ForegroundColor Green

# 5. Rodar migrations
Write-Host "`n🗄️  Rodando migrations (alembic upgrade head)..." -ForegroundColor Yellow
alembic upgrade head
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Falha nas migrations." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Banco de dados atualizado." -ForegroundColor Green

# 6. Criar usuário admin
Write-Host "`n👤 Criando usuário admin de teste..." -ForegroundColor Yellow
$env:ADMIN_PASSWORD = "Naoparamos1234"
python -m scripts.seed_admin
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aviso: seed_admin retornou erro (usuário pode já existir)." -ForegroundColor Yellow
}

# 7. Resultado final
Write-Host "`n" + "=" * 55 -ForegroundColor DarkGray
Write-Host "🎉 Setup concluído! Para iniciar o backend:" -ForegroundColor Cyan
Write-Host ""
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "   uvicorn app.main:app --reload --port 8000" -ForegroundColor White
Write-Host ""
Write-Host "📋 Credenciais de teste:" -ForegroundColor Cyan
Write-Host "   Email : admin@metaconsultoria.com" -ForegroundColor White
Write-Host "   Senha : Naoparamos1234" -ForegroundColor White
Write-Host ""
