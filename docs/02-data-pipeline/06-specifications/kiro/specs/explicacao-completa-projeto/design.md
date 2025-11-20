# Design Completo do Projeto "A República"

## Overview

O projeto "A República" é como uma grande fábrica digital que funciona em 3 andares principais:

1. **Andar do Porão (ETL Python)**: Onde os dados "sujos" chegam e são limpos
2. **Andar do Meio (Backend Node.js)**: Onde os dados limpos ficam organizados e prontos para usar
3. **Andar de Cima (Frontend Next.js)**: Onde as pessoas veem os dados de forma bonita

É como se fosse uma padaria: o porão recebe o trigo sujo, o meio transforma em farinha limpa, e o andar de cima faz os pães bonitos que as pessoas compram.

## Architecture

### Arquitetura Geral (Monorepo)

```
a-republica/
├── packages/
│   ├── etlpython/          # 🏭 Fábrica de dados (Python)
│   ├── monitor-despesas-next/ # 🖥️ Site bonito (Next.js)
│   └── shared/             # 📦 Coisas compartilhadas
├── backend/                # 🏪 Loja de dados (Node.js)
└── bancoDados/            # 💾 Arquivo dos dados
```

### Fluxo de Dados (Como uma linha de produção)

1. **Extração** (ETL Python pega dados da internet)
2. **Transformação** (ETL Python limpa e organiza)
3. **Carregamento** (ETL Python salva no banco SQLite)
4. **Servir** (Backend Node.js pega do banco e entrega)
5. **Visualizar** (Frontend Next.js mostra bonito na tela)

## Components and Interfaces

### 1. ETL Pipeline (Python) - O "Aspirador de Dados"

**Responsabilidades:**
- Buscar dados da API oficial da Câmara dos Deputados
- Limpar dados inconsistentes
- Calcular estatísticas e rankings
- Salvar tudo em arquivos SQLite organizados

**Estrutura Principal:**
```
etlpython/
├── sources/congresso_nacional/  # Onde busca os dados
├── extract/                     # Como pega os dados
├── transform/                   # Como limpa os dados
├── load/                       # Como salva os dados
└── cli/                        # Comandos para rodar
```

**Problemas Identificados:**
- ❌ **Redundância**: Tem pastas `src/extract`, `src/load`, `src/transform` E também `extract/`, `load/`, `transform/` na raiz
- ❌ **Inconsistência**: Alguns arquivos estão em Python, outros em JavaScript no mesmo contexto
- ❌ **Complexidade**: Muitos arquivos de configuração diferentes (pyproject.toml, package.json)

### 2. Backend API (Node.js) - O "Garçom dos Dados"

**Responsabilidades:**
- Receber pedidos do frontend
- Buscar dados no banco SQLite
- Entregar dados formatados
- Gerenciar cache para velocidade

**Estrutura:**
```
backend/
├── src/
│   ├── routes/          # Caminhos da API
│   ├── services/        # Lógica de negócio
│   ├── db/             # Conexão com banco
│   └── types/          # Definições de tipos
└── dist/               # Código compilado
```

**Problemas Identificados:**
- ✅ **Bem organizado**: Estrutura clara e simples
- ⚠️ **Limitado**: Só tem rota para fornecedores, faltam outras
- ⚠️ **Tipos vazios**: Pasta `types/` existe mas está vazia

### 3. Frontend (Next.js) - O "Site Bonito"

**Responsabilidades:**
- Mostrar dados de forma visual
- Permitir navegação fácil
- Criar gráficos e tabelas
- Funcionar bem no celular e computador

**Estrutura (MUITO COMPLEXA):**
```
monitor-despesas-next/
├── src/
│   ├── components/      # 130+ componentes (!!)
│   ├── pages/          # 23 páginas diferentes
│   ├── hooks/          # Lógica reutilizável
│   ├── services/       # Comunicação com backend
│   ├── lib/            # Utilitários
│   └── types/          # Definições TypeScript
```

**GRANDES PROBLEMAS IDENTIFICADOS:**

#### 🚨 Redundância Extrema de Componentes:
- **3 versões do mesmo perfil**: `perfil/`, `perfil-v2/`, `perfil-modular/`
- **2 sistemas de premiação**: `premiacoes/`, `premiacoes2/`
- **Fornecedores duplicados**: `fornecedores/`, `fornecedor/`, `fornecedor-modular/`
- **Múltiplas versões de filtros**: `FornecedorFilters`, `FornecedorFiltersOptimized`

#### 🚨 Estrutura Confusa:
- **130+ componentes** para um projeto que poderia ter 30-40
- **Pastas com nomes similares**: `categoria/`, `category/`, `categoria-fornecedores/`
- **Componentes órfãos**: Muitos componentes que não são usados

#### 🚨 Inconsistência de Padrões:
- Alguns componentes em português, outros em inglês
- Mistura de padrões de nomenclatura
- Arquivos com responsabilidades sobrepostas

## Data Models

### Modelo Principal de Dados

```typescript
// Deputado (Político)
interface Deputado {
  id: string
  nome: string
  partido: string
  uf: string
  gastoTotal: number
  transacoes: Transacao[]
}

// Fornecedor (Empresa que vende)
interface Fornecedor {
  cnpj: string
  nome: string
  categoria: string
  faturamentoTotal: number
  deputadosAtendidos: string[]
}

// Transação (Compra)
interface Transacao {
  id: string
  deputadoId: string
  fornecedorCnpj: string
  valor: number
  data: Date
  categoria: string
  descricao: string
}
```

### Fluxo de Dados

1. **ETL Python** → Gera arquivos `.sqlite` e `.json`
2. **Backend Node.js** → Lê SQLite e serve via API REST
3. **Frontend Next.js** → Consome API e exibe na interface

## Error Handling

### Estratégia de Tratamento de Erros

1. **ETL Level**: 
   - Logs detalhados em Python
   - Continuação mesmo com dados parciais corrompidos
   - Retry automático para falhas de rede

2. **Backend Level**:
   - Validação com Zod
   - Respostas HTTP padronizadas
   - Logs estruturados

3. **Frontend Level**:
   - Error Boundaries React
   - Fallbacks para componentes quebrados
   - Notificações user-friendly

## Testing Strategy

### Abordagem de Testes

1. **ETL Python**:
   - Testes unitários com pytest
   - Validação de integridade de dados
   - Testes de performance para grandes datasets

2. **Backend Node.js**:
   - Testes de API com supertest
   - Validação de schemas
   - Testes de integração com SQLite

3. **Frontend Next.js**:
   - Testes de componentes com Vitest
   - Testes de integração com Testing Library
   - Testes de acessibilidade

## Problemas Críticos Identificados

### 🔴 Problemas de Arquitetura

1. **Monorepo Mal Organizado**:
   - Backend fora da pasta `packages/`
   - Estruturas inconsistentes entre projetos
   - Dependências confusas

2. **Duplicação Massiva de Código**:
   - 3 versões do mesmo componente
   - Lógica repetida em múltiplos lugares
   - Componentes "otimizados" que fazem a mesma coisa

3. **Falta de Padrões**:
   - Mistura de português/inglês
   - Convenções de nomenclatura inconsistentes
   - Estruturas de pastas diferentes entre projetos

### 🟡 Problemas de Performance

1. **Bundle Size Gigante**:
   - 130+ componentes carregados
   - Múltiplas versões da mesma funcionalidade
   - Dependências desnecessárias

2. **Cache Complexo Demais**:
   - Múltiplos sistemas de cache sobrepostos
   - Lógica de invalidação confusa
   - Performance prejudicada pela complexidade

### 🟢 Pontos Positivos

1. **Funcionalidade Rica**:
   - Sistema completo de monitoramento
   - Múltiplas formas de visualizar dados
   - Interface responsiva

2. **Tecnologias Modernas**:
   - Next.js com TypeScript
   - React Query para cache
   - Tailwind CSS para styling

## Recomendações de Melhoria

### 1. Reestruturação do Monorepo
```
a-republica/
├── packages/
│   ├── etl/              # Python ETL (renomeado)
│   ├── api/              # Backend (movido)
│   ├── web/              # Frontend (renomeado)
│   └── shared/           # Tipos compartilhados
└── data/                 # Bancos de dados
```

### 2. Simplificação do Frontend
- **Reduzir de 130 para ~40 componentes**
- **Eliminar versões duplicadas**
- **Padronizar nomenclatura (tudo em português)**
- **Consolidar lógica similar**

### 3. Melhoria do ETL
- **Unificar estrutura de pastas**
- **Melhorar documentação**
- **Adicionar testes automatizados**

### 4. Otimização de Performance
- **Bundle splitting inteligente**
- **Cache unificado e simples**
- **Lazy loading real**