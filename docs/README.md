# 🏛️ A República - Monitor de Despesas Parlamentares

> Sistema completo de ETL, análise e visualização de gastos da Câmara dos Deputados do Brasil

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)

---

## 📊 Visão Geral

**A República** é uma plataforma de transparência que extrai, processa e visualiza dados de despesas parlamentares da Câmara dos Deputados, permitindo análise detalhada de gastos públicos, identificação de padrões suspeitos e comparação entre deputados e fornecedores.

### 🎯 Objetivos

- ✅ **Transparência**: Tornar dados públicos acessíveis e compreensíveis
- ✅ **Análise**: Identificar padrões, anomalias e tendências
- ✅ **Performance**: Processar milhões de transações eficientemente
- ✅ **Acessibilidade**: Interface intuitiva para qualquer cidadão

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 1: FONTE DE DADOS                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  API Câmara dos Deputados (dados abertos)             │     │
│  │  https://dadosabertos.camara.leg.br/api/v2            │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 2: ETL (Python)                        │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  packages/etlpython/                                   │     │
│  │  ├─ Extração: API → JSON bruto                        │     │
│  │  ├─ Transformação: Normalização + Agregação           │     │
│  │  ├─ Validação: Pydantic models                        │     │
│  │  └─ Carga: bancoDados/monitordespesas/               │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA 3: DATALAKE                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  bancoDados/monitordespesas/                           │     │
│  │  ├─ deputados.json (agregados)                        │     │
│  │  ├─ fornecedores.json (agregados)                     │     │
│  │  ├─ deputadosFederais/{id}/dados_completos.json       │     │
│  │  └─ manifest.json (metadados)                         │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│              CAMADA 4: MATERIALIZAÇÃO (Python)                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  materialize_unified_v2.py                             │     │
│  │  ├─ Agregação por ano                                 │     │
│  │  ├─ Cálculo de rankings                               │     │
│  │  ├─ Geração de caches otimizados                      │     │
│  │  └─ Compressão gzip                                   │     │
│  │                                                         │     │
│  │  materialize_paginated.py                              │     │
│  │  ├─ Paginação de transações                           │     │
│  │  ├─ Separação por ano                                 │     │
│  │  └─ Índices de navegação                              │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA 5: CACHE LAYER                           │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  packages/monitor-despesas-next/public/cache/          │     │
│  │  ├─ suppliers-cache.json (+ .gz)                      │     │
│  │  ├─ deputies-cache.json (+ .gz)                       │     │
│  │  ├─ categories-cache.json (+ .gz)                     │     │
│  │  ├─ rankings-cache.json                               │     │
│  │  ├─ premiacoes-cache.json                             │     │
│  │  └─ transactions/                                      │     │
│  │      ├─ deputy-{id}-transactions-{ano}-page{n}.json   │     │
│  │      └─ supplier-{id}-transactions-{ano}-page{n}.json │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│           CAMADA 6: SERVER ACTIONS (Next.js 16)                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  React.cache() + data-actions.ts                       │     │
│  │  ├─ Deduplicação de leituras                           │     │
│  │  ├─ Tipagem no servidor                                │     │
│  │  ├─ Paginação/ordenação server-side                    │     │
│  │  └─ Entrega via ISR (revalidate 3600)                  │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CAMADA 7: FRONTEND (React)                      │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  packages/monitor-despesas-next/                       │     │
│  │  ├─ Dashboard                                          │     │
│  │  ├─ Lista de Deputados                                │     │
│  │  ├─ Perfil do Deputado                                │     │
│  │  ├─ Lista de Fornecedores                             │     │
│  │  ├─ Perfil do Fornecedor                              │     │
│  │  ├─ Categorias                                         │     │
│  │  ├─ Premiações                                         │     │
│  │  ├─ Alertas                                            │     │
│  │  └─ Comparar Deputados                                │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAMADA 8: USUÁRIO                             │
│                    (Navegador Web)                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+ e **pnpm**
- **Python** 3.9+
- **Git**

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/Berhartes/aRepublica.git
cd aRepublica

# 2. Checar branch (release atual)
git fetch --tags
git checkout frontend-page-cleanup

# 3. Instalar dependências Node
pnpm install

# 4. Instalar dependências Python (opcional, apenas para ETL)
cd packages/etlpython
pip install -e .
cd ../..
```

### Executar ETL (Extração de Dados)

```bash
cd packages/etlpython

# Extrair dados de 10 deputados (teste)
pnpm run etl:despesasdeputados:pc 57 10

# Extrair todos os deputados da legislatura 57
pnpm run etl:despesasdeputados:pc 57
```

### Gerar Caches Otimizados

```bash
cd packages/etlpython

# Gerar TODOS os caches (recomendado)
pnpm run etl:materialize:all

# Ou individualmente:
pnpm run etl:materialize:unified:v2  # Caches principais
pnpm run etl:materialize:paginated   # Transações paginadas
```

### Executar Frontend

```bash
cd packages/monitor-despesas-next

# Desenvolvimento
pnpm dev

# Produção
pnpm build
pnpm start -- -p 3000
```

Acesse: http://localhost:3000

---

## 📁 Estrutura do Projeto

```
a-republica/
├── packages/
│   ├── etlpython/                    # Pipeline ETL em Python
│   │   ├── src/etlpython/
│   │   │   ├── cli/                  # Scripts de linha de comando
│   │   │   │   ├── materialize_unified_v2.py
│   │   │   │   └── materialize_paginated.py
│   │   │   ├── extract/              # Extração de dados
│   │   │   ├── transform/            # Transformação
│   │   │   ├── load/                 # Carga
│   │   │   └── models.py             # Modelos Pydantic
│   │   └── package.json
│   │
│   ├── monitor-despesas-next/        # Frontend React/Next.js
│   │   ├── src/
│   │   │   ├── client/pages/         # Páginas da aplicação
│   │   │   ├── components/           # Componentes React
│   │   │   ├── hooks/                # React Hooks
│   │   │   ├── services/             # Serviços
│   │   │   │   └── global-cache.service.ts
│   │   │   ├── contexts/             # Contextos React
│   │   │   └── data-access/          # Acesso a dados
│   │   ├── public/cache/             # Caches estáticos
│   │   └── package.json
│   │
│   └── shared/                       # Código compartilhado
│       └── src/types/
│
├── bancoDados/                       # Datalake (gerado pelo ETL)
│   └── monitordespesas/
│       ├── deputados.json
│       ├── fornecedores.json
│       ├── deputadosFederais/
│       └── manifest.json
│
├── docs/                             # Documentação
│   ├── 00-overview/                  # Índice e mapa completo
│   │   ├── INDEX.md
│   │   └── DOCUMENTATION_STRUCTURE.md
│   ├── 01-architecture/              # Arquitetura e caches
│   │   ├── ARQUITETURA.md
│   │   ├── GUIA_COMPLETO_CACHES.md
│   │   └── REFERENCIA-VISUAL-ARQUITETURA.md
│   ├── 02-data-pipeline/             # ETL, materialização e specs
│   ├── 03-frontend/                  # Guias e notas do frontend
│   ├── 04-agents/                    # Materiais para agentes IA
│   ├── 05-governance/                # Processos de contribuição
│   ├── 06-guides/                    # Prompts e guias rápidos
│   ├── 07-planning/                  # Roadmaps e planos
│   ├── 08-status/                    # Relatórios de status
│   ├── 09-audits/                    # Auditorias
│   ├── 10-performance/               # Relatórios de performance
│   ├── 11-tools/                     # Guidelines para IA
│   ├── 12-validation/                # Validações de dados
│   └── 13-templates/                 # Templates operacionais
│
└── README.md
```

---

## 🔄 Fluxo de Dados Detalhado

### 1️⃣ Extração (ETL Python)

```python
# Extrai dados da API da Câmara
python -m etlpython.cli.despesas 57 10

# Resultado:
bancoDados/monitordespesas/
├── deputadosFederais/
│   └── {id}/dados_completos.json  # Todas as transações
├── deputados.json                  # Agregado
└── fornecedores.json              # Agregado
```

### 2️⃣ Materialização (Cache Generation)

```python
# Gera caches otimizados com separação por ano
python -m etlpython.cli.materialize_unified_v2

# Resultado:
public/cache/
├── suppliers-cache.json           # Com totalRecebidoPorAno
├── deputies-cache.json            # Com gastosPorAno
└── categories-cache.json          # Novo cache por categoria
```

### 3️⃣ Consumo (Frontend React)

```typescript
// Hook automático com cache global
const { data, loading } = useSuppliers()

// Filtro por ano (dados já separados)
const fornecedores2024 = data?.fornecedores.map(f => ({
  ...f,
  total: f.totalRecebidoPorAno['2024']
}))
```

---

## 🎨 Funcionalidades Principais

### 📊 Dashboard
- Visão geral de gastos
- Gráficos de evolução temporal
- Rankings e estatísticas
- Filtros por ano, categoria, partido

### 👥 Deputados
- Lista completa com busca e filtros
- Perfil detalhado de cada deputado
- Histórico de gastos por ano
- Transações paginadas
- Comparação entre deputados
- Alertas de conformidade

### 🏢 Fornecedores
- Lista de fornecedores por categoria
- Perfil detalhado do fornecedor
- Deputados atendidos
- Transações paginadas por ano
- Análise de padrões

### 🏆 Premiações
- Rankings por categoria
- Coroas, troféus e medalhas
- Filtros por ano e categoria
- Evolução de posições

### 🚨 Alertas
- Detecção de anomalias
- Gastos acima da média
- Padrões suspeitos
- Filtros por gravidade

### 📈 Categorias
- Análise por tipo de despesa
- Evolução temporal
- Top fornecedores e deputados
- Distribuição de gastos

---

## 🔧 Tecnologias Utilizadas

### Backend (ETL)
- **Python 3.9+**: Linguagem principal
- **Pydantic**: Validação de dados
- **Requests**: HTTP client
- **Pandas**: Manipulação de dados (opcional)

### Frontend
- **React 19**: Framework UI
- **Next.js**: Framework React
- **TypeScript**: Type safety
- **Tailwind CSS v4**: Estilização
- **shadcn/ui**: Componentes
- **Recharts**: Gráficos
- **React Router v7**: Navegação

### Cache & Performance
- **IndexedDB**: Cache local do navegador
- **Gzip**: Compressão de arquivos
- **Global Cache Service**: Deduplicação de requisições
- **Paginação**: Carregamento incremental

---

## 📊 Dados e Métricas

### Exemplo de Dados Processados

- **Deputados**: 513 (legislatura completa)
- **Fornecedores**: ~2.500 únicos
- **Transações**: ~500.000 por ano
- **Valor Total**: ~R$ 500 milhões/ano
- **Categorias**: ~45 tipos de despesa

### Performance

- **Tempo de ETL**: ~5 minutos (10 deputados)
- **Tempo de Cache**: ~30 segundos (todos os caches)
- **Carregamento Frontend**: <1s (com cache)
- **Tamanho dos Caches**: ~5MB total (comprimido)

---

## 🛠️ Comandos Úteis

### ETL

```bash
# Extrair dados
pnpm run etl:despesasdeputados:pc 57 10

# Gerar todos os caches
pnpm run etl:materialize:all

# Apenas caches principais
pnpm run etl:materialize:unified:v2

# Apenas transações paginadas
pnpm run etl:materialize:paginated
```

### Frontend

```bash
# Desenvolvimento
pnpm dev

# Build
pnpm build

# Produção
pnpm start

# Lint
pnpm lint

# Type check
pnpm type-check
```

### Limpeza

```bash
# Limpar caches
rm -rf packages/monitor-despesas-next/public/cache/*

# Limpar datalake
rm -rf bancoDados/monitordespesas/*

# Limpar node_modules
pnpm clean
```

---

## 📚 Documentação

### 📖 Documentação Completa

**Índice Central:** [INDEX.md](00-overview/INDEX.md) - Navegue por toda a documentação

### 🎯 Documentos Principais

| Para | Documento | Descrição |
|------|-----------|-----------|
| 👨‍💻 **Desenvolvedores** | [CONTRIBUTING.md](05-governance/CONTRIBUTING.md) | Como contribuir |
| 🤖 **Agentes IA** | [AI_AGENT_MANUAL.md](04-agents/AI_AGENT_MANUAL.md) | Manual completo para IA |
| 🏗️ **Arquitetura** | [ARQUITETURA.md](01-architecture/ARQUITETURA.md) | Sistema detalhado |
| 💾 **Dados** | [GUIA_COMPLETO_CACHES.md](01-architecture/GUIA_COMPLETO_CACHES.md) | Sistema de caches |
| 🚀 **Otimização** | [OPTIMIZATION_ROADMAP.md](07-planning/OPTIMIZATION_ROADMAP.md) | Roadmap de melhorias |
| 📝 **Padrões** | [.ai-guidelines.md](11-tools/.ai-guidelines.md) | Guidelines de código |

### 🔗 Links Externos

- [API da Câmara](https://dadosabertos.camara.leg.br/swagger/api.html)
- [React 19 Docs](https://react.dev)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com)

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👥 Autores

- **A República Team** - *Trabalho Inicial*

---

## 🙏 Agradecimentos

- Câmara dos Deputados pela API de dados abertos
- Comunidade open source
- Todos os contribuidores

---

## 📞 Contato

- **Website**: [em breve]
- **Email**: [em breve]
- **GitHub**: [a-republica](https://github.com/seu-usuario/a-republica)

---

**Feito com ❤️ para mais transparência no Brasil** 🇧🇷