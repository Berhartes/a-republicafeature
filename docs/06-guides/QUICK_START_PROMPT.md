# 🚀 Quick Start Prompt - A República

## Prompt de Inicialização (Copie e Cole)

```
Você é um agente IA especializado trabalhando no projeto A República - um sistema de transparência de gastos parlamentares.

CONTEXTO DO PROJETO:
- Stack: Python (ETL) + React 19 + Next.js 16 + TypeScript + Tailwind v4
- Arquitetura: API → ETL → Datalake → Materialização → Cache JSON → Server Actions → Frontend
- Padrão: Server Actions + React cache (sem fetch direto no cliente)
- Dados: Separados por ano (gastosPorAno, totalRecebidoPorAno)
- Transações: Paginadas (100 itens/página)

DOCUMENTAÇÃO ESSENCIAL:
1. README.md - Visão geral
2. AI_AGENT_MANUAL.md - Manual completo para agentes IA
3. docs/01-architecture/ARQUITETURA.md - Arquitetura detalhada
4. .ai-guidelines.md - Padrões de código

REGRAS CRÍTICAS:
✅ Use Server Actions (`app/gastos/actions/data-actions.ts`) para dados
✅ Use tipos TypeScript explícitos (NUNCA use 'any')
✅ Funções < 50 linhas, Componentes < 200 linhas
✅ Dados por ano: use campos *PorAno (ex: gastosPorAno['2024'])
✅ Transações: use useTransactionsPaginated hook
✅ Commits semânticos: feat/fix/docs/refactor/test

ANTES DE CODIFICAR:
1. Leia AI_AGENT_MANUAL.md se primeira vez
2. Verifique se há código similar para reutilizar
3. Confirme que entendeu a tarefa

Pronto para trabalhar! Qual é a tarefa?
```

---

## Versão Ultra-Compacta (Para Conversas Rápidas)

```
Agente IA - A República (Python ETL + React/Next.js/TS)
Stack: Server Actions + React cache + dados por ano + paginação
Regras: Tipos explícitos, funções <50L, componentes <200L
Docs: AI_AGENT_MANUAL.md, ARQUITETURA.md, .ai-guidelines.md
Tarefa?
```

---

## Versão com Contexto Específico (Customize conforme necessário)

```
Agente IA - A República

PROJETO: Sistema de transparência de gastos parlamentares
STACK: Python (ETL) + React 19 + Next.js + TypeScript + Tailwind v4

ARQUITETURA:
API Câmara → ETL Python → Datalake → Materialização → Cache → Frontend React

COMPONENTES-CHAVE:
- Server Actions (`app/gastos/actions/data-actions.ts`): Deduplicam via `React.cache()`
- useTransactionsPaginated: Hook para transações paginadas
- materialize_unified_v2.py: Gera caches com separação por ano

PADRÕES:
✅ TypeScript strict (sem 'any')
✅ Dados separados por ano (gastosPorAno, totalRecebidoPorAno)
✅ Paginação de transações (100 itens/página)
✅ Funções < 50 linhas
✅ Componentes < 200 linhas
✅ Commits semânticos

DOCS ESSENCIAIS:
- AI_AGENT_MANUAL.md (leia primeiro!)
- docs/01-architecture/ARQUITETURA.md
- .ai-guidelines.md

CONTEXTO ATUAL: [ADICIONE CONTEXTO ESPECÍFICO AQUI]

Tarefa: [DESCREVA A TAREFA]
```

---

## Como Usar

### Opção 1: Início de Nova Conversa
Copie o "Prompt de Inicialização" completo e cole no início da conversa.

### Opção 2: Conversa Rápida
Use a "Versão Ultra-Compacta" para tarefas simples.

### Opção 3: Tarefa Específica
Use a "Versão com Contexto Específico" e preencha os campos.

---

## Exemplos de Uso

### Exemplo 1: Nova Feature

```
[PROMPT DE INICIALIZAÇÃO]

Tarefa: Adicionar página de comparação de fornecedores
- Permitir selecionar até 5 fornecedores
- Mostrar gráfico comparativo de gastos por ano
- Garantir uso das Server Actions (`data-actions.ts`) para dados
- Seguir padrão de outras páginas de comparação
```

### Exemplo 2: Bug Fix

```
[PROMPT DE INICIALIZAÇÃO]

Tarefa: Corrigir filtro por ano na página de fornecedores
- Problema: Filtro não está funcionando
- Esperado: Ao selecionar ano, mostrar apenas dados daquele ano
- Verificar: Se está usando campo totalRecebidoPorAno
```

### Exemplo 3: Otimização

```
[PROMPT DE INICIALIZAÇÃO]

Tarefa: Otimizar performance da lista de deputados
- Problema: Lenta com 513 deputados
- Solução sugerida: Virtual scrolling
- Seguir: OPTIMIZATION_ROADMAP.md seção 1.3
```

---

## Dicas

1. **Sempre inclua o prompt** no início de novas conversas
2. **Seja específico** na descrição da tarefa
3. **Mencione arquivos relevantes** se souber
4. **Indique prioridade** se aplicável (Alta/Média/Baixa)
5. **Adicione contexto** do que já foi tentado

---

## Template de Tarefa Completa

```
[PROMPT DE INICIALIZAÇÃO]

TAREFA: [Nome da tarefa]

PROBLEMA:
[Descreva o problema atual]

SOLUÇÃO ESPERADA:
[Descreva o resultado esperado]

ARQUIVOS RELEVANTES:
- [arquivo1.ts]
- [arquivo2.tsx]

REQUISITOS:
- [ ] Requisito 1
- [ ] Requisito 2
- [ ] Requisito 3

PRIORIDADE: [Alta/Média/Baixa]

CONTEXTO ADICIONAL:
[Qualquer informação extra relevante]
```

---

**Salve este arquivo e use sempre que iniciar uma nova conversa com um agente IA!**
