## Objetivos
- Padronizar componentes autônomos (self-contained) do diretório `components/monitor` como referência para o projeto.
- Organizar `src` em domínios claros, separar primitivos (UI), componentes de features e utilitários.
- Reduzir acoplamento, remover/arquivar código não usado e facilitar reuso.

## Diretrizes de Arquitetura
- Componentes de domínio (“features”) devem ser autônomos: trazem sua UI, lógica de negócio leve, navegação e integração de contexto.
- Primitivos `ui/*` mantêm API estável, sem regras de negócio.
- Contextos por domínio (`contexts/*`) expostos com hooks e Provider dedicados.
- Imports via aliases estáveis (`@/components`, `@/features`, `@/lib`, `@/contexts`, `@/pages`).
- Client vs Server: marcar explicitamente (`'use client'` apenas onde necessário), e isolar chamadas de navegador.

## Estrutura de Pastas Proposta
- `src/app/`
  - Rotas Next (RSC), páginas e layouts por domínio.
- `src/features/`
  - `monitor/` (migração do atual `components/monitor` mantendo padrão autônomo)
  - `category/` (migrar `components/category` como pacote de gráficos de categorias)
  - `fornecedores/`, `deputados/` (containers por domínio quando aplicável)
- `src/components/`
  - `ui/` (primitivos shadcn/radix)
  - `common/` (componentes genéricos sem regra de negócio)
- `src/contexts/`
  - Providers e hooks (ex.: `FilterContext`) usados por features.
- `src/lib/`
  - Utilitários puros: `formatters`, `utils`, `categoria-icons`, `router/navigation`, `env`, `logger`.
- `src/services/`
  - Serviços de dados/cache e integração (ex.: `CacheService`).
- `src/examples/`
  - Demos como `DashboardComponentsPageClient.tsx` e `FormExample.tsx`.
- `src/tests/` (unit e e2e perto dos domínios quando possível).

## Padrão de Componentes Autônomos (Monitor)
- Cada componente conterá:
  - UI com primitivos (`ui/*`).
  - Integração de contexto (ex.: `FilterContext`).
  - Navegação (`next/navigation`) e rotas convenientes.
  - Utilitários específicos (cores, formatação) importados de `lib`.
- Exemplos de referência:
  - `MiniCardStats` em `src/components/monitor/MiniCardStats.tsx:1` (formatação e KPIs prontos).
  - `Top5Fornecedores` em `src/components/monitor/Top5Fornecedores.tsx:1` (filtro, ranking, navegação).
  - `DistribuicaoGastosPorCategoria` em `src/components/monitor/DistribuicaoGastosPorCategoria.tsx:1` (gráficos e seleção).

## Reorganização por Domínio
- `components/monitor` → mover para `features/monitor` mantendo APIs e caminhos públicos via barrel (`features/monitor/index.ts`).
- `components/category` → `features/category` com barrel; atualizar import em `FornecedoresPageClient.tsx:26`.
- Páginas que consomem features ficam em `app/<domínio>/...` e importam de `@/features/*`.

## Padronização de Imports e Aliases
- Confirmar/ajustar `tsconfig.json` paths:
  - `@/features/*`, `@/components/*`, `@/contexts/*`, `@/lib/*`, `@/services/*`.
- Atualizar imports existentes (ex.: `Navigation.tsx:8` usa `NotificationCenter` — manter em `components/common` se for genérico).

## Limpeza de Código e Auditoria
- Catalogar arquivos não referenciados:
  - Exemplos e v4: `FormExample.tsx`, `PredictiveAnalytics.tsx`, `NetworkGraph.tsx`, `AnimatedStats.tsx`, `Favoritos.tsx`, `DataProcessor.tsx`, `StatsCard.tsx`, `v4/*`, `filters/category-icons.tsx`.
  - Hooks sem uso: `useNavigationState.ts`, `useDataWorker.ts`, `useServerAction.ts`, `useParliamentaryObservability.ts`, `useOptimizedFilters.ts`, `useLocalStorage.ts`, `useAnaliseGastos.ts`.
  - Libs sem uso: `monitoring.ts`, `performance.ts`, `enhanced-batching.ts`, `observability/metrics.ts`, `supplier-badges.ts`, `transacao-utils.ts`, `runtime-env.ts`, `mocks/global-mocks.ts`, `firebase-config.ts`.
- Ação:
  - Mover para `examples/` ou `archive/` quando forem demos.
  - Remover do bundle/rota e abrir relatório (sem quebrar `app`).
  - Ferramentas: `knip`, `ts-prune`, `depcheck` (execução posterior à aprovação).

## Migração Gradual (Fases)
- Fase 1: criar diretórios `features/*`, barrels e ajustar aliases em `tsconfig.json`.
- Fase 2: mover `components/monitor` → `features/monitor` e atualizar imports nas páginas:
  - `src/app/monitor/fornecedores/page.tsx:5-7`.
- Fase 3: mover `components/category` → `features/category` e ajustar `FornecedoresPageClient.tsx:26,228`.
- Fase 4: mover exemplos para `src/examples/`; retirar do menu principal.
- Fase 5: rodar auditorias e excluir/arquivar arquivos não usados.

## Validação e Testes
- Rodar type-check e lint após cada fase.
- Smoke test das rotas principais:
  - `/gastos/fornecedores` usa `features/monitor` e `features/category` (ver `src/app/monitor/fornecedores/page.tsx:83-97`).
  - `/gastos/premiacoes` valida `lib/categoria-icons` (`src/app/gastos/premiacoes/PremiacoesPageClient.tsx:9`).
- E2E critico (playwright) para navegação e interação básica.

## Entregáveis
- Estrutura de pastas organizada e padronizada.
- Documentação curta de padrões (no repositório de dev docs existente), sem criar novos READMEs.
- Relatório de itens removidos/arquivados e impacto nulo em rotas existentes.

Confirma que posso iniciar pela Fase 1 (criar `features/*`, atualizar aliases e preparar barrels) e seguir com migração do `monitor`? 