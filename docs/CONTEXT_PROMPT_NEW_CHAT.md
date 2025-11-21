# 🤖 Prompt de Contexto - A República

> **Use este prompt no início de QUALQUER nova conversa sobre o projeto**

---

## 📋 Prompt Completo (Copie e Cole)

```
Você é um agente IA especializado trabalhando no projeto A República.

PROJETO: Sistema de transparência de gastos parlamentares do Brasil
- Extrai dados da API da Câmara dos Deputados
- Processa com Python (ETL)
- Materializa em caches otimizados
- Visualiza em frontend React/Next.js

STACK TÉCNICO:
- Backend: Python 3.9+ (ETL, Pydantic, Requests)
- Frontend: React 19 + Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui
- Dados: JSON caches materializados → Server Actions (React cache + ISR)
- Arquitetura: 8 camadas (API → ETL → Datalake → Materialização → Cache JSON → Server Actions → Frontend → Usuário)

ESTRUTURA DO PROJETO:
```
a-republica/
├── packages/
│   ├── etlpython/              # Pipeline ETL Python
│   │   └── src/etlpython/cli/
│   │       ├── materialize_unified_v2.py    # Caches com separação por ano
│   │       └── materialize_paginated.py     # Transações paginadas
│   └── monitor-despesas-next/  # Frontend React/Next.js
│       ├── src/
│       │   ├── app/gastos/actions/  # Server Actions (acesso ao cache)
│       │   ├── app/gastos/**/page.tsx  # Server Components
│       │   └── app/gastos/**/[*]Client.tsx  # Client Components (UI)
│       └── public/cache/       # Caches estáticos (materialize)
├── bancoDados/monitordespesas/ # Datalake (gerado)
└── docs/                       # Documentação organizada
    ├── 00-overview/           # Índices e mapas
    ├── 01-architecture/       # Arquitetura e caches
    ├── 04-agents/            # Manuais para IA
    └── 07-planning/          # Roadmaps
```

CONCEITOS-CHAVE (⭐ CRÍTICOS):
1. Server Actions usam `readMaterializeCache` + `React.cache()` para deduplicar e tipar dados
2. Separação por Ano: Todos dados têm campos *PorAno (gastosPorAno, totalRecebidoPorAno)
3. Paginação: Transações em arquivos de 100 itens (deputy-{id}-transactions-{ano}-page{n}.json)
4. Materialização: Scripts Python transformam datalake em caches JSON em `public/cache`

PADRÕES OBRIGATÓRIOS:
✅ TypeScript strict - NUNCA use 'any'
✅ Funções < 50 linhas
✅ Componentes < 200 linhas
✅ Busque dados via Server Actions (nunca fetch direto no cliente)
✅ Use campos *PorAno para filtros temporais
✅ Use Server Components para preparar dados e passar props aos Client Components
✅ Commits semânticos (feat/fix/docs/refactor)

DOCUMENTAÇÃO ESSENCIAL:
📍 Localização: C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\docs\

DOCUMENTOS ATIVOS (Use estes):
1. docs/00-overview/INDEX.md - Índice central de navegação
2. docs/01-architecture/ARQUITETURA.md - Arquitetura detalhada
3. docs/01-architecture/GUIA_COMPLETO_CACHES.md - Sistema de caches
4. docs/04-agents/AI_AGENT_MANUAL.md - Manual completo para IA
5. docs/07-planning/OPTIMIZATION_ROADMAP.md - Roadmap de otimizações

DOCUMENTOS NA RAIZ (Também importantes):
- README.md - Visão geral e quick start
- CONTRIBUTING.md - Como contribuir
- .ai-guidelines.md - Padrões de código
- QUICK_START_PROMPT.md - Prompts de inicialização
- COMANDOS_ETL.md - Referência de comandos

COMANDOS PRINCIPAIS:
```powershell
# ETL - Extrair dados
cd packages\etlpython
pnpm run etl:despesasdeputados:pc 57 10

# Materializar caches
pnpm run etl:materialize:all

# Frontend
cd packages\monitor-despesas-next
pnpm dev
```

ANTES DE COMEÇAR QUALQUER TAREFA:
1. ✅ Confirme que entendeu o contexto
2. ✅ Pergunte se há dúvidas sobre a tarefa
3. ✅ Verifique se há código similar para reutilizar
4. ✅ Siga os padrões em .ai-guidelines.md

Pronto para trabalhar! Qual é a tarefa?
```

---

## 🗂️ Análise da Documentação Atual

### ✅ DOCUMENTOS ATIVOS (Manter e Usar)

#### Raiz do Projeto
| Arquivo | Status | Propósito |
|---------|--------|-----------|
| README.md | ✅ ATIVO | Visão geral principal |
| CONTRIBUTING.md | ✅ ATIVO | Guia de contribuição |
| AI_AGENT_MANUAL.md | ✅ ATIVO | Manual para IA |
| QUICK_START_PROMPT.md | ✅ ATIVO | Prompts de inicialização |
| OPTIMIZATION_ROADMAP.md | ✅ ATIVO | Roadmap de otimizações |
| .ai-guidelines.md | ✅ ATIVO | Padrões de código |
| COMANDOS_ETL.md | ✅ ATIVO | Referência de comandos |
| DOCUMENTATION_STRUCTURE.md | ✅ ATIVO | Estrutura de docs |

#### docs/00-overview/
| Arquivo | Status | Propósito |
|---------|--------|-----------|
| INDEX.md | ✅ ATIVO | Índice central de navegação |
| DOCUMENTATION_STRUCTURE.md | ✅ ATIVO | Mapa de documentação |

#### docs/01-architecture/
| Arquivo | Status | Propósito |
|---------|--------|-----------|
| ARQUITETURA.md | ✅ ATIVO | Arquitetura detalhada |
| GUIA_COMPLETO_CACHES.md | ✅ ATIVO | Sistema de caches |
| REFERENCIA-VISUAL-ARQUITETURA.md | ✅ ATIVO | Diagramas visuais |

#### docs/04-agents/
| Arquivo | Status | Propósito |
|---------|--------|-----------|
| AI_AGENT_MANUAL.md | ✅ ATIVO | Manual completo para IA |
| README.md | ⚠️ REVISAR | Pode ter duplicação |
| api-agent.md | ⚠️ REVISAR | Específico para API |
| etl-agent.md | ⚠️ REVISAR | Específico para ETL |
| frontend-agent.md | ⚠️ REVISAR | Específico para Frontend |

#### docs/07-planning/
| Arquivo | Status | Propósito |
|---------|--------|-----------|
| OPTIMIZATION_ROADMAP.md | ✅ ATIVO | Roadmap de otimizações |
| MAPEAMENTO_PROJETO.md | ⚠️ REVISAR | Pode ter duplicação |
| PLANO-EXECUCAO-MELHORIAS.md | ⚠️ REVISAR | Pode estar obsoleto |

---

### ❌ DOCUMENTOS OBSOLETOS (Revisar/Consolidar)

#### Pastas Vazias ou com Conteúdo Desconhecido
- docs/02-data-pipeline/
- docs/03-frontend/
- docs/05-governance/
- docs/06-guides/
- docs/08-status/
- docs/09-audits/
- docs/10-performance/
- docs/11-tools/
- docs/12-validation/
- docs/13-templates/

**Ação Recomendada:** Verificar conteúdo e consolidar ou remover

---

## 🎯 Recomendações de Limpeza

### MANTER (Documentos Essenciais)

**Raiz:**
- ✅ README.md
- ✅ CONTRIBUTING.md
- ✅ AI_AGENT_MANUAL.md
- ✅ QUICK_START_PROMPT.md
- ✅ OPTIMIZATION_ROADMAP.md
- ✅ .ai-guidelines.md
- ✅ COMANDOS_ETL.md

**docs/00-overview/:**
- ✅ INDEX.md
- ✅ DOCUMENTATION_STRUCTURE.md

**docs/01-architecture/:**
- ✅ ARQUITETURA.md
- ✅ GUIA_COMPLETO_CACHES.md
- ✅ REFERENCIA-VISUAL-ARQUITETURA.md

**docs/04-agents/:**
- ✅ AI_AGENT_MANUAL.md

**docs/07-planning/:**
- ✅ OPTIMIZATION_ROADMAP.md

---

### REVISAR/CONSOLIDAR

**docs/04-agents/:**
- ⚠️ README.md - Verificar se duplica AI_AGENT_MANUAL.md
- ⚠️ api-agent.md - Consolidar em AI_AGENT_MANUAL.md?
- ⚠️ etl-agent.md - Consolidar em AI_AGENT_MANUAL.md?
- ⚠️ frontend-agent.md - Consolidar em AI_AGENT_MANUAL.md?

**docs/07-planning/:**
- ⚠️ MAPEAMENTO_PROJETO.md - Verificar duplicação com INDEX.md
- ⚠️ PLANO-EXECUCAO-MELHORIAS.md - Verificar se está atualizado

---

### VERIFICAR CONTEÚDO

Pastas que precisam ser verificadas:
- docs/02-data-pipeline/
- docs/03-frontend/
- docs/05-governance/
- docs/06-guides/
- docs/08-status/
- docs/09-audits/
- docs/10-performance/
- docs/11-tools/
- docs/12-validation/
- docs/13-templates/

---

## 📝 Estrutura Recomendada Final

```
docs/
├── README.md                    # Índice principal
├── ARQUITETURA.md              # Arquitetura completa
├── GUIA_COMPLETO_CACHES.md     # Sistema de caches
├── AI_AGENT_MANUAL.md          # Manual para IA
├── OPTIMIZATION_ROADMAP.md     # Roadmap
└── COMANDOS_ETL.md             # Referência de comandos
```

**Raiz do projeto:**
```
a-republica/
├── README.md                    # Visão geral
├── CONTRIBUTING.md              # Como contribuir
├── .ai-guidelines.md            # Padrões de código
├── QUICK_START_PROMPT.md        # Prompts de inicialização
└── docs/                        # Documentação técnica
```

---

## ✅ Próximos Passos

1. **Usar este prompt** em todas as novas conversas
2. **Revisar pastas vazias** em docs/
3. **Consolidar documentos** duplicados em docs/04-agents/
4. **Simplificar estrutura** para apenas docs essenciais
5. **Manter atualizado** conforme projeto evolui

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0
