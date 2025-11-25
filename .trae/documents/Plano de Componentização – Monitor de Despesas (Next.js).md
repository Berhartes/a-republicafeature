## Visão Geral do Projeto
- Stack: `Next.js (app router)`, `React`, `TypeScript`, `Tailwind CSS`, `ESLint`, `Prettier`; testes com `Vitest` e `Playwright`.
- Organização por domínio em `src/app/gastos/*` com camadas `actions`, `services`, `hooks`, `lib`, `types`, `ui`.
- O diretório `gastos/monitor` já funciona como referência consolidada, mas há redundâncias e componentes soltos.

## 1. Análise Estrutural
- Remoção/Consolidação (candidatos):
  - `src/app/ErrorBoundary.tsx` → consolidar em `gastos/error-boundaries/*`.
  - `src/app/Status.tsx` → substituir por `src/app/gastos/ui/connection-status.tsx`.
  - `src/app/Loading.tsx`, `src/app/LoadingSkeleton.tsx` → manter apenas variantes por rota (`loading.tsx` locais) e um único skeleton reutilizável em `gastos/ui/`.
  - `src/app/NotificationCenter.tsx` → verificar uso; remover se não referenciado.
  - `src/app/TimelineGastos.tsx`, `src/app/AlertaCorrelacao.tsx`, `src/app/BuscaGlobal.tsx` → mover para `gastos/components` e eliminar cópias soltas.
  - `src/app/proxy.ts` → revisar; remover se legado/sem referência.
  - `src/app/gastos/monitor/monitor-redundancia/*` → unificar e remover pasta após migração.
- Modelo de referência: `src/app/gastos/monitor`
  - Boas práticas: separar dados (`fornecedores/data.ts`) da UI, navegação dedicada (`MonitorNavigation.tsx`), componentes de ranking e gráficos.
  - Ponto de melhoria: consolidar gráficos com `gastos/categoria/components/*` para evitar duplicações.
- Mapeamento de “arquivos soltos” para componentização:
  - Em `src/app/`: `AlertaCorrelacao.tsx`, `BuscaGlobal.tsx`, `ErrorBoundary.tsx`, `Loading*.tsx`, `NotificationCenter.tsx`, `Status.tsx`, `TimelineGastos.tsx`.
  - Em `gastos/monitor/`: `BuscarFornecedores.tsx`, `BuscarParlamentar.tsx`, `CardParlamentar.tsx`, `MiniCardStats.tsx`, `MonitorNavigation.tsx`, `RankingDeputadosCategoria.tsx`, `Top5Fornecedores.tsx`, `DistribuicaoGastosPorCategoria.tsx`.

## 2. Proposta de Componentes
- Categorias de Gastos (visualização e filtragem)
  - Finalidade: dashboards por categoria, filtros dinâmicos, distribuição e tendência.
  - Principais peças: `CategoryFilter`, `CategorySummaryCard`, `CategoryDistributionChart`, `CategoryTrendChart`.
  - Dados: abstrair em `gastos/categoria/lib` e providers em `gastos/actions`.
  - Reuso: basear gráficos em `gastos/graficos/BaseChart` e unificar com `monitor-redundancia`.
- Sistema de Ranking e Premiações
  - Finalidade: ranking de deputados/fornecedores com métricas (economia, regularidade, outliers) e badges.
  - Peças: `RankingTable`, `RankingBadgeLegend`, `RankingFilters`, `AwardsOverview`.
  - Dados: engine em `gastos/premiacoes/*` + selectors de cache em `gastos/cache`.
  - Indicadores visuais: cores de faixas, ícones, tooltips com explicações.
- Perfil do Fornecedor
  - Finalidade: visão 360° por CNPJ (histórico, categorias, valores, contratos relacionados).
  - Peças: `SupplierHeader`, `SupplierMetricsGrid`, `SupplierExpensesTimeline`, `SupplierCategoryBreakdown`, `SupplierRelatedDeputies`.
  - Dados: `gastos/services/fornecedores` + `fornecedores/data.ts` como referência.
- Perfil do Deputado
  - Finalidade: visão financeira e desempenho (evolução de gastos, categorias, rankings, comparativos).
  - Peças: `DeputyHeader`, `DeputyMetricsGrid`, `DeputyExpensesTimeline`, `DeputyCategoryBreakdown`, `DeputyRankingPosition`, `DeputyComparisons`.
  - Dados: `gastos/services/deputados` com cache seletivo.

## 3. Padrões de Implementação
- Autocontido
  - Cada componente em pasta própria com `index.tsx`, `styles.(css|ts)`, `hooks.ts`, `types.ts`, `__tests__/` e `README.md` (ou página demo em `(docs)` se preferível ao invés de MDX).
- Testabilidade
  - Unit (Vitest): lógica, filtros, seletores; mocks em `gastos/lib/mocks`.
  - Integração (Vitest/RTL): render de componentes com providers.
  - E2E (Playwright): páginas `perfil/[id]`, `fornecedor/[cnpj]`, `monitor/*` com cenários chave.
- Documentação
  - JSDoc nos `props`; exemplos de uso via páginas `src/app/(docs)/components/*` com stories simples.
- Responsivo e Acessível
  - Grid responsivo com Tailwind; navegação por teclado; ARIA; contraste; focos visíveis; `prefers-reduced-motion` em gráficos.

## 4. Plano de Evolução
- Prioridade por dependência
  1) Categorias de Gastos (base para gráficos e filtros)  
  2) Ranking e Premiações (depende de métricas/categorias)  
  3) Perfil do Fornecedor (usa gráficos e ranking)  
  4) Perfil do Deputado (usa gráficos, ranking, comparativos)
- Critérios de Aceitação (por componente)
  - Carrega dados com estados (`loading`, `empty`, `error`), sem blocos.
  - Filtros persistem e são compartilháveis (URL query ou contexto controlado).
  - Acessibilidade nível AA, navegação teclado e leitores de tela.
  - Performance: render < 200ms com cache, gráficos com downsampling.
  - Testes: cobertura > 80% unit/integração; cenários críticos e2e.
  - Docs: página exemplo com props e casos comuns.
- Fluxo Contínuo
  - Trilha por domínio: `feature/{domínio}/{componente}` + PR com checklist de acessibilidade, performance e testes.
  - Releases incrementais com changelog por componente.

## 5. Melhorias Arquiteturais
- Estrutura de Pastas Otimizada
  - `src/app/gastos/(features)/categorias/*`
  - `src/app/gastos/(features)/ranking/*`
  - `src/app/gastos/(features)/fornecedor/*`
  - `src/app/gastos/(features)/deputado/*`
  - Compartilhados: `src/app/gastos/components/*`, `src/app/gastos/ui/*`, `src/app/gastos/hooks/*`, `src/app/gastos/lib/*`, `src/app/gastos/types/*`, `src/app/gastos/services/*`.
  - Páginas permanecem em `app` com `page.tsx`; componentes não-roteáveis em `(features)` para organizar sem afetar rotas.
- Padrões de Nomenclatura
  - Componentes: `PascalCase` (ex.: `SupplierMetricsGrid`).
  - Hooks: `useX`; actions: `doXAction` em `gastos/actions`.
  - Tipos: `CategoriaGasto`, `FornecedorPerfil`, `DeputadoPerfil`.
  - Arquivos: nomes descritivos; evitar sufixos genéricos (`index.old.tsx`).
- Reutilização de Código
  - Unificar gráficos: `gastos/graficos/BaseChart` + builders em `gastos/categoria/lib`.
  - Seletores/cache: centralizar em `gastos/cache` e `gastos/lib/selectors`.
  - Componentes de ranking: um único `RankingTable` parametrizável (deputados/fornecedores).
  - Error boundaries: um ponto de entrada reutilizável.

## Entregáveis
- Lista de arquivos a remover/unificar com justificativa e impactos.
- Quatro componentes completos por domínio (categorias, ranking/premiações, fornecedor, deputado) com testes e docs.
- Migração de gráficos/rankings para evitar redundância e limpeza do diretório `monitor-redundancia`.
- Estrutura `(features)` aplicada sem quebrar rotas existentes.

## Próximos Passos
- Confirmar este plano; iniciar pela componentização de Categorias de Gastos, em paralelo à consolidação dos gráficos e remoção de duplicações no `monitor`.