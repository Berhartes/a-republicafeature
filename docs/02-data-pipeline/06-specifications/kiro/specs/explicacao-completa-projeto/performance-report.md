# Relatório de Performance - Sistema "A República"

## 📊 Resumo Executivo

**Data da Análise:** 2025-10-26T21:42:47.175Z

### 🎯 Principais Descobertas

### ⚠️ Problemas Identificados

- 🟡 **ETL Misto** - Python e JavaScript no mesmo projeto

### ✅ Pontos Positivos

- ✅ **Bundle Aceitável** - First Load JS < 100KB


## 🏗️ Análise do Frontend

### Bundle Size Analysis

### ⚠️ Status do Build

**❌ Build Failed:** Erros de TypeScript impedem a compilação
**Análise:** Continuando com análise do código fonte

### 📁 Análise do Código Fonte

| Categoria | Quantidade | Observações |
|-----------|------------|-------------|
| **Componentes** | 34 | ✅ Aceitável |
| **Páginas** | 20 | ✅ Normal |
| **Hooks** | 48 | ⚠️ Muitos hooks |
| **Arquivos Tipos** | 3 | - |
| **Total Arquivos** | 198 | - |
| **Tamanho Fonte** | 1.44 MB | - |

### 🔄 Componentes Duplicados Detectados

- **categoria** similar a: categoria-fornecedores
- **categoria-fornecedores** similar a: categoria, fornecedor, fornecedores
- **comparar-deputados** similar a: deputado
- **deputado** similar a: comparar-deputados, lista-deputados, perfil-deputado
- **fornecedor** similar a: categoria-fornecedores, fornecedores, perfil-fornecedor

*... e mais 6 grupos duplicados*

### 📏 Componentes Grandes (>10KB)

| Componente | Tamanho | Caminho |
|------------|---------|----------|
| BuscaGlobal.tsx | 10 KB | components\BuscaGlobal.tsx |
| DataProcessor.tsx | 11 KB | components\DataProcessor.tsx |
| DeputadoHeader.tsx | 15 KB | components\deputado\components\DeputadoHeader.tsx |
| DeputadoCard.tsx | 12 KB | components\DeputadoCard.tsx |
| FornecedorHeader.tsx | 11 KB | components\fornecedor\components\FornecedorHeader.tsx |
| FornecedoresFilters.tsx | 11 KB | components\fornecedores\components\FornecedoresFilters.tsx |
| FornecedoresGrid.tsx | 12 KB | components\fornecedores\components\FornecedoresGrid.tsx |
| DeputadosFilters.tsx | 14 KB | components\lista-deputados\components\DeputadosFilters.tsx |
| ListaDeputadosHeader.tsx | 11 KB | components\lista-deputados\components\ListaDeputadosHeader.tsx |
| PerfilDeputadoHeader.tsx | 10 KB | components\perfil-deputado\components\PerfilDeputadoHeader.tsx |

*... e mais 1 componentes grandes*

### ⚠️ Problemas Identificados

- 11 potential duplicate component groups found.
- 11 large components (>10KB) may impact performance.



## 🔄 Análise do ETL

### 📁 Estrutura do Projeto

- **Diretórios:** 30
- **Arquivos Python:** 62
- **Arquivos JavaScript:** 0
- **Arquivos de Configuração:** 2
- **Total de Arquivos:** 72

### 🔄 Dependências Mistas

- Python: pyproject.toml
- JavaScript: package.json

### 💡 Recomendações

- 🟡 ESTRUTURA: Estrutura de diretórios muito profunda (>4 níveis)


## 📱 Tempos de Carregamento das Páginas

**ℹ️ Nenhuma página analisada** - Execute o build primeiro

## 🚀 Core Web Vitals (Estimativas)

| Métrica | Valor Estimado | Threshold | Status |
|---------|----------------|-----------|--------|
| **LCP** (Largest Contentful Paint) | 2500ms | < 2500ms | Good |
| **FID** (First Input Delay) | 100ms | < 100ms | Good |
| **CLS** (Cumulative Layout Shift) | 0.1 | < 0.1 | Needs Measurement |

### 📦 Impacto do Bundle

- **First Load JS:** 0 KB
- **Bundle Total:** 0 KB
- **Recomendação:** Bundle size is acceptable

**Nota:** Valores estimados baseados no tamanho do bundle. Para métricas reais, use Lighthouse em produção.

## 📋 Recomendações Prioritárias

🟡 **IMPORTANTE:** Padronizar ETL
  - Escolher uma linguagem principal (Python recomendado)
  - Migrar lógica JavaScript para Python
✅ **GERAL:** Implementar monitoramento
  - Configurar Lighthouse CI
  - Adicionar métricas de performance em produção
  - Criar alertas para degradação de performance

## 🔧 Próximos Passos

1. **Imediato (1-2 dias):**
   - Implementar bundle analyzer no build
   - Configurar métricas de performance em produção

2. **Curto prazo (1 semana):**
   - Otimizar componentes com maior impacto no bundle
   - Implementar lazy loading para rotas pesadas

3. **Médio prazo (2-4 semanas):**
   - Reestruturar ETL para eliminar duplicações
   - Implementar code splitting avançado

---

*Relatório gerado automaticamente pelo Performance Analyzer*
