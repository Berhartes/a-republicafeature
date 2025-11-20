#!/bin/bash
# Script de Migração do Ambiente Virtual Python
# Este script move o ambiente virtual da raiz do projeto para dentro do pacote etlpython

set -e

echo "🔄 Iniciando migração do ambiente virtual Python..."

# Verificar se estamos no diretório correto
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Erro: Execute este script de dentro de packages/etlpython/"
    exit 1
fi

# Verificar se já existe um ambiente virtual local
if [ -d ".venv" ]; then
    echo "⚠️  Ambiente virtual .venv já existe neste diretório"
    read -p "Deseja recriá-lo? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Operação cancelada"
        exit 0
    fi
    rm -rf .venv
fi

# Criar novo ambiente virtual
echo "📦 Criando novo ambiente virtual..."
python3 -m venv .venv

# Ativar ambiente virtual
echo "🔌 Ativando ambiente virtual..."
source .venv/bin/activate

# Atualizar pip
echo "⬆️  Atualizando pip..."
python -m pip install --upgrade pip

# Instalar dependências do projeto
echo "📥 Instalando dependências do pyproject.toml..."
pip install -e .

# Instalar dependências de desenvolvimento
echo "🛠️  Instalando dependências de desenvolvimento..."
pip install -e ".[dev]"

# Gerar requirements.txt para lock de versões
echo "📝 Gerando requirements.txt..."
pip freeze > requirements.txt

echo ""
echo "✅ Migração concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Remover ambiente virtual da raiz do projeto:"
echo "   cd ../.."
echo "   rm -rf Lib Scripts python3 pyvenv.cfg"
echo ""
echo "2. Para ativar o ambiente virtual no futuro:"
echo "   cd packages/etlpython"
echo "   source .venv/bin/activate"
echo ""
echo "3. Atualizar scripts no package.json se necessário"