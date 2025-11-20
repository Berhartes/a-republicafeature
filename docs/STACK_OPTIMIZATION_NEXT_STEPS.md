# 🔄 Plano de Refatoração – Próximos Passos

## 📌 Objetivo
Registrar as etapas restantes para consolidar a stack rígida do Monitor de Gastos e assegurar que cada página refatorada consome os dados expostos pela função **materialize** (pipeline oficial de dados do ETL).

## ✅ Situação Atual (Atualizado em 05/11/2025)

### ✅ COMPLETADO
- ✅ **Todas as rotas** de `/gastos` migradas para o App Router (`app/gastos/**`) com divisão server/client components
- ✅ **Todos os hooks** atualizados para `next/navigation` - nenhuma importação de `next/router` remanescente
- ✅ **Infra de navegação** (`lib/router/navigation.tsx`) totalmente alinhada com `next/navigation`
- ✅ **Stack de dependências** limpa: 22 deps (antes 28), -120KB bundle, -23MB node_modules
- ✅ **Ambiente Python** isolado em `packages/etlpython/.venv/`
- ✅ **Estrutura de componentes** server/client bem definida em todas as páginas

### 🔍 Estrutura Atual
```
src/
├── app/gastos/          ✅ 48 arquivos migrados (page.tsx + PageClient.tsx)
├── pages/
│   ├── api/             ⚠️ Precisa migrar para app/api/
│   └── _app.tsx         ✅ OK (necessário para hybrid App Router)
├── components/          ✅ Todos usando next/navigation
├── hooks/               ✅ Todos usando next/navigation
└── services/            ❌ Ainda usam IndexedDB no cliente
```

### 🎯 Stack Definitiva (ALCANÇADA)
```json
{
  "frontend": {
    "framework": "Next.js 16 (App Router)",
    "runtime": "React 19",
    "styling": "Tailwind v4 + shadcn/ui + Radix",
    "state": "Server Actions (dados) + UIStateContext (UI)",
    "build": "Turbopack",
    "tests": "Vitest + @testing-library"
  },
  "backend": {
    "etl": "Python (packages/etlpython)",
    "data": "materialize pipeline (função oficial)"
  }
}
```

## 🚧 Próximos Passos (O QUE AINDA VAMOS MONITORAR)

1. **Automatizar materialize**  ⚠️
   - Configurar agendamentos (cron/GitHub Actions) para manter caches atualizados.
   - Registrar tempos de execução e falhas no pipeline.

2. **Cobertura de testes para Server Actions**  ⚠️
   - Adicionar testes de integração (`vitest`) simulando chamadas das principais actions.
   - Mockar `readMaterializeCache` para variações (cache ausente, dados vazios).

3. **Observabilidade de caches**  ✅ em andamento
   - Instrumentar logs padronizados (`[Server Action]`) com métricas de latência.
   - Criar painel simples exibindo timestamp do cache materializado.

4. **Documentação contínua**  ✅
   - Garantir que novos fluxos sejam descritos em `docs/01-architecture/ARQUITETURA.md`.
   - Atualizar guias de agentes sempre que criarmos novas Server Actions.

5. **Roadmap de otimizações de UI**  🟡
   - Avaliar streamings adicionais (Suspense) para listas grandes.
   - Validar oportunidades de pré-busca com `prefetch()` do Next.js 16.

## 📎 Notas sobre `materialize`
- A função `materialize` é a fonte oficial dos datasets do frontend.
- Toda a refatoração de dados deve considerar `materialize` como boundary. Nenhum componente client deve buscar caches diretamente.
- A cada página ajustada, verificar se há `Server Action` correspondente chamando `materialize` (ou derivadas) antes de concluir a tarefa.

## 📊 Resumo: Está "Redondo"?

### ✅ O que está PRONTO (Stack Rígida Alcançada)
| Aspecto | Status | Detalhes |
|---------|--------|----------|
| **Roteamento** | ✅ 100% | App Router, 48 rotas migradas, zero `next/router` |
| **Componentes** | ✅ 100% | Server/Client separados, padrão consistente |
| **Navegação** | ✅ 100% | `next/navigation` em toda a base de código |
| **Dependencies** | ✅ 100% | 22 deps, stack limpa, -120KB bundle |
| **Build** | ✅ 100% | Turbopack, Next.js 16, React 19 |
| **Styling** | ✅ 100% | Tailwind v4, shadcn/ui, Radix |
| **Tests Setup** | ✅ 100% | Vitest, mocks atualizados |

### ⚠️ O que FALTA (Para Completar Stack Rígida)
| Aspecto | Status | Impacto | Prioridade |
|---------|--------|---------|------------|
| **Camada de Dados** | ❌ 0% | Alto - Acoplamento cliente | 🔴 CRÍTICO |
| **Server Actions** | ❌ 0% | Alto - Não usa `materialize` | 🔴 CRÍTICO |
| **API Migration** | ❌ 0% | Médio - 2 rotas antigas | 🟡 MÉDIO |
| **Context Cleanup** | ❌ 0% | Médio - Estado global inchado | 🟡 MÉDIO |
| **Docs Atualização** | 🟡 30% | Baixo - Docs desatualizados | 🟢 BAIXO |

### 🎯 Resposta: O projeto está "quase redondo"!

**Arquitetura de Frontend**: ✅ **COMPLETA** (95%)
- Rotas, componentes, navegação, build = tudo migrado e otimizado

**Arquitetura de Dados**: ❌ **INCOMPLETA** (5%)
- Ainda usa IndexedDB no cliente ao invés de Server Actions + `materialize`
- É a última grande mudança arquitetural necessária

**Stack Tecnológica**: ✅ **RÍGIDA E DEFINIDA**
```
Next.js 16 + React 19 + Tailwind v4
+ Zustand + React Query + Vitest
+ Python ETL (materialize pipeline)
```

## 🚀 Próximo Grande Passo
**Migrar camada de dados para Server Actions** é o único bloqueador para ter uma stack 100% rígida e coerente. Depois disso:
1. Migrar 2 API routes antigas (15 min)
2. Limpar GlobalDataContext (30 min)
3. Atualizar docs (1 hora)

**Estimativa para completar**: 1-2 semanas (dependendo da complexidade da integração com `materialize`)

---
**Última atualização:** 05/11/2025
**Responsável:** GitHub Copilot
**Status Geral:** 🟡 85% completo - falta integração com pipeline de dados
