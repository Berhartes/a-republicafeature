# Script de Migracao do Ambiente Virtual Python
# Este script move o ambiente virtual da raiz do projeto para dentro do pacote etlpython

Write-Host "Iniciando migracao do ambiente virtual Python..." -ForegroundColor Cyan

# Verificar se estamos no diretorio correto
if (-not (Test-Path "pyproject.toml")) {
    Write-Host "Erro: Execute este script de dentro de packages/etlpython/" -ForegroundColor Red
    exit 1
}

# Verificar se ja existe um ambiente virtual local
if (Test-Path ".venv") {
    Write-Host "Ambiente virtual .venv ja existe neste diretorio" -ForegroundColor Yellow
    $response = Read-Host "Deseja recria-lo? (s/N)"
    if ($response -ne "s" -and $response -ne "S") {
        Write-Host "Operacao cancelada" -ForegroundColor Red
        exit 0
    }
    Remove-Item -Recurse -Force .venv
}

# Criar novo ambiente virtual
Write-Host "Criando novo ambiente virtual..." -ForegroundColor Green
py -m venv .venv

if (-not $?) {
    Write-Host "Erro ao criar ambiente virtual" -ForegroundColor Red
    Write-Host "Certifique-se de que o Python esta instalado corretamente" -ForegroundColor Yellow
    exit 1
}

# Ativar ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Green
& .\.venv\Scripts\Activate.ps1

# Atualizar pip
Write-Host "Atualizando pip..." -ForegroundColor Green
py -m pip install --upgrade pip

# Instalar dependencias do projeto
Write-Host "Instalando dependencias do pyproject.toml..." -ForegroundColor Green
pip install -e .

# Instalar dependencias de desenvolvimento
Write-Host "Instalando dependencias de desenvolvimento..." -ForegroundColor Green
pip install -e ".[dev]"

# Gerar requirements.txt para lock de versoes
Write-Host "Gerando requirements.txt..." -ForegroundColor Green
pip freeze > requirements.txt

Write-Host ""
Write-Host "Migracao concluida com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos passos:" -ForegroundColor Cyan
Write-Host "1. Remover ambiente virtual da raiz do projeto:" -ForegroundColor White
Write-Host "   cd ..\.." -ForegroundColor Gray
Write-Host "   Remove-Item -Recurse -Force Lib, Scripts" -ForegroundColor Gray
Write-Host "   Remove-Item python3, pyvenv.cfg -ErrorAction SilentlyContinue" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Para ativar o ambiente virtual no futuro:" -ForegroundColor White
Write-Host "   cd packages\etlpython" -ForegroundColor Gray
Write-Host "   .\.venv\Scripts\Activate.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Atualizar scripts no package.json se necessario" -ForegroundColor White