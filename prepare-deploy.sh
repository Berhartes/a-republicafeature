#!/bin/bash

# Script de Preparação para Deploy na Vercel
# A República Brasileira - Monitor de Despesas

echo "🚀 Preparando projeto para deploy na Vercel..."
echo ""

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do repositório"
    exit 1
fi

echo -e "${BLUE}📦 Verificando estrutura do projeto...${NC}"
if [ -d "packages/monitor-despesas-next" ]; then
    echo "✅ Diretório monitor-despesas-next encontrado"
else
    echo "❌ Erro: Diretório monitor-despesas-next não encontrado"
    exit 1
fi

# 2. Verificar arquivos de configuração
echo ""
echo -e "${BLUE}⚙️  Verificando arquivos de configuração...${NC}"

if [ -f "packages/monitor-despesas-next/vercel.json" ]; then
    echo "✅ vercel.json encontrado"
else
    echo "⚠️  vercel.json não encontrado (será criado pela Vercel)"
fi

if [ -f "packages/monitor-despesas-next/.vercelignore" ]; then
    echo "✅ .vercelignore encontrado"
else
    echo "⚠️  .vercelignore não encontrado"
fi

# 3. Verificar caches
echo ""
echo -e "${BLUE}💾 Verificando arquivos de cache...${NC}"

CACHE_DIR="packages/monitor-despesas-next/public/cache"
if [ -d "$CACHE_DIR" ]; then
    CACHE_COUNT=$(ls -1 "$CACHE_DIR"/*.json 2>/dev/null | wc -l)
    echo "✅ Diretório de cache encontrado"
    echo "   📊 $CACHE_COUNT arquivos de cache encontrados"
    
    # Listar principais caches
    if [ -f "$CACHE_DIR/rankings-cache.json" ]; then
        echo "   ✅ rankings-cache.json"
    else
        echo "   ⚠️  rankings-cache.json não encontrado"
    fi
    
    if [ -f "$CACHE_DIR/deputies-cache.json" ]; then
        echo "   ✅ deputies-cache.json"
    else
        echo "   ⚠️  deputies-cache.json não encontrado"
    fi
    
    if [ -f "$CACHE_DIR/suppliers-cache.json" ]; then
        echo "   ✅ suppliers-cache.json"
    else
        echo "   ⚠️  suppliers-cache.json não encontrado"
    fi
else
    echo "⚠️  Diretório de cache não encontrado"
    echo "   Execute a materialização antes do deploy:"
    echo "   python3 -m etlpython.cli.materialize_monitordespesasDf ..."
fi

# 4. Verificar dependências
echo ""
echo -e "${BLUE}📚 Verificando dependências...${NC}"

cd packages/monitor-despesas-next

if [ -f "pnpm-lock.yaml" ]; then
    echo "✅ pnpm-lock.yaml encontrado (Vercel usará pnpm)"
elif [ -f "package-lock.json" ]; then
    echo "✅ package-lock.json encontrado (Vercel usará npm)"
elif [ -f "yarn.lock" ]; then
    echo "✅ yarn.lock encontrado (Vercel usará yarn)"
else
    echo "⚠️  Nenhum lock file encontrado"
fi

cd ../..

# 5. Verificar Git
echo ""
echo -e "${BLUE}🔧 Verificando Git...${NC}"

if [ -d ".git" ]; then
    echo "✅ Repositório Git inicializado"
    
    # Verificar branch
    BRANCH=$(git branch --show-current 2>/dev/null)
    if [ ! -z "$BRANCH" ]; then
        echo "   📍 Branch atual: $BRANCH"
    fi
    
    # Verificar mudanças não commitadas
    if [ -n "$(git status --porcelain)" ]; then
        echo "   ⚠️  Existem mudanças não commitadas"
        echo ""
        echo -e "${YELLOW}   Mudanças pendentes:${NC}"
        git status --short | head -10
        echo ""
        echo "   Execute: git add . && git commit -m 'feat: Preparar para deploy'"
    else
        echo "   ✅ Nenhuma mudança pendente"
    fi
    
    # Verificar remote
    REMOTE=$(git remote get-url origin 2>/dev/null)
    if [ ! -z "$REMOTE" ]; then
        echo "   ✅ Remote configurado: $REMOTE"
    else
        echo "   ⚠️  Remote não configurado"
    fi
else
    echo "❌ Repositório Git não inicializado"
    exit 1
fi

# 6. Teste de build local (opcional)
echo ""
echo -e "${BLUE}🔨 Teste de build local (opcional)${NC}"
echo "   Para testar o build antes do deploy:"
echo "   cd packages/monitor-despesas-next"
echo "   pnpm install"
echo "   pnpm build"

# 7. Resumo e próximos passos
echo ""
echo -e "${GREEN}✅ Verificação concluída!${NC}"
echo ""
echo -e "${BLUE}📋 Próximos passos para deploy na Vercel:${NC}"
echo ""
echo "1. Commitar mudanças (se houver):"
echo "   git add ."
echo "   git commit -m 'feat: Sistema de rankings e premiações'"
echo "   git push origin main"
echo ""
echo "2. Acessar Vercel:"
echo "   https://vercel.com"
echo ""
echo "3. Importar projeto:"
echo "   - Clique em 'Add New Project'"
echo "   - Selecione o repositório: Berhartes/arepublica-brasileira"
echo "   - Configure Root Directory: packages/monitor-despesas-next"
echo "   - Clique em 'Deploy'"
echo ""
echo "4. Configurar variáveis de ambiente:"
echo "   NEXT_PUBLIC_CACHE_BASE_URL=/cache"
echo "   NEXT_PUBLIC_USE_LOCAL_CACHE=true"
echo ""
echo -e "${GREEN}🎉 Boa sorte com o deploy!${NC}"
echo ""

