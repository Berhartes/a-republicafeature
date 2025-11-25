## Objetivos e Escopo

* Migrar apenas a parte comprovadamente estável do Monitor para um novo projeto “monitor-correto”, preservando comportamento.

* Unificar o fluxo de dados (loaders → parsers → normalização → UI em features/monitor) e eliminar processamentos redundantes.

* Estabelecer base sólida de testes, qualidade e documentação técnica.

## Assunções e Restrições

* O novo projeto deve manter a UX e padrões das páginas `/monitor`, usando exclusivamente componentes de `src/features/monitor`.

* O pipeline de dados continuará via caches unificados (CDN/ETL/Repo/Public), com parsers (zod) e normalização.

* Evitar cronogramas temporais aqui; focar em escopo e entregáveis técnicos.

## Seleção de Artefatos Essenciais (origem → migrar)

* UI (fonte de verdade do Monitor):

  * `packages/monitor-despesas-next/src/features/monitor/index.ts`

  * `packages/monitor-despesas-next/src/features/monitor/BuscarFornecedores.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/BuscarParlamentar.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/CardParlamentar.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/DistribuicaoGastosPorCategoria.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/MiniCardStats.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/MonitorNavigation.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/RankingDeputadosCategoria.tsx`

  * `packages/monitor-despesas-next/src/features/monitor/Top5Fornecedores.tsx`

* Páginas Monitor (orquestração):

  * `packages/monitor-despesas-next/src/app/monitor/fornecedores/page.tsx`

  * `packages/monitor-despesas-next/src/app/monitor/fornecedores/FornecedoresClient.tsx`

  * `packages/monitor-despesas-next/src/app/monitor/fornecedores/data.ts`

  * `packages/monitor-despesas-next/src/app/monitor/deputados/page.tsx`

  * `packages/monitor-despesas-next/src/app/monitor/metrics/page.tsx`

* Pipeline de dados (mínimo necessário):

  * Loaders: `packages/monitor-despesas-next/src/app/gastos/actions/_cached-loaders.ts`

  * Parsers: `packages/monitor-despesas-next/src/app/gastos/actions/analytics.ts`

  * Normalização: `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts` (funções: `getFornecedores`, `getDeputados`)

  * Ranking utils: `packages/monitor-despesas-next/src/services/unified-ranking-service.ts`

  * Premiações: `packages/monitor-despesas-next/src/services/premiacao-unificada.ts`

  * Cache engine: `packages/monitor-despesas-next/src/lib/cache/cache-sources.ts`, `packages/monitor-despesas-next/src/services/cache-service.ts`, `packages/monitor-despesas-next/src/constants/cache.ts`

* Suporte (estritamente o que é usado pelos componentes acima):

  * UI primitives: `packages/monitor-despesas-next/src/components/ui/*`

  * Formatação: `packages/monitor-despesas-next/src/lib/formatters.ts`

  * Navegação utilitária (se referenciado): `packages/monitor-despesas-next/src/lib/router/navigation.tsx`

  * Contextos utilizados: `packages/monitor-despesas-next/src/contexts/FilterContext.tsx`

  * Tipos: `packages/monitor-despesas-next/src/types/*`, `packages/shared/src/types/*`

## Arquitetura Alvo (monitor-correto)

* Next.js + TypeScript para SSR/Server Actions (alinha com `/monitor`).

* Camadas:

  * `features/monitor`: UI canônica

  * `app/monitor/*`: páginas que orquestram dados e renderizam `features`

  * `data-pipeline`: loaders → parsers → normalização (módulos dedicados)

  * `services`: ranking/premiações/cache

  * `components/ui`: primitives reusáveis

  * `lib`: utilitários (formatters, router)

  * `contexts`: providers usados pelos features

## Estrutura de Pastas (proposta)

* `monitor-correto/`

  * `package.json`, `tsconfig.json`, `next.config.mjs`

  * `src/`

    * `app/monitor/fornecedores/{page.tsx, FornecedoresClient.tsx, data.ts}`

    * `app/monitor/deputados/page.tsx`

    * `app/monitor/metrics/page.tsx`

    * `features/monitor/*`

    * `data-pipeline/{_cached-loaders.ts, analytics.ts, data-actions.ts}`

    * `services/{unified-ranking-service.ts, premiacao-unificada.ts, cache-service.ts}`

    * `lib/{formatters.ts, router/navigation.tsx}`

    * `components/ui/*`

    * `contexts/{FilterContext.tsx}`

    * `types/*`

    * `public/cache/.gitkeep`

    * `tests/{unit,e2e}`

## Dependências e Configuração

* Dependências essenciais:

  * `next`, `react`, `react-dom`, `zod`, `lucide-react`

  * UI (se manter shadcn): `@radix-ui/*`, `tailwindcss`, `tailwindcss-animate`, `class-variance-authority`, `clsx`

  * Testes: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `playwright`

* Scripts: `dev`, `build`, `start`, `lint`, `test`, `test:e2e`

* Configurar aliases: `@/*`, `@/features/*`, `@/services/*`, `@/data-pipeline/*`

## Fluxo de Dados Unificado (padrão)

* Cache (CDN/ETL/Repo/Public) → `data-pipeline/_cached-loaders.ts` → `data-pipeline/analytics.ts` (zod) → `data-pipeline/data-actions.ts` (normalize/filtros/paginação) → `app/monitor/*` → `features/monitor/*`.

* Ranking/premiações em `services/*` chamadas pelas server actions quando necessário.

## Plano de Migração (passos)

1. Criar projeto `monitor-correto` (Next.js + TS) com estrutura mínima.
2. Copiar os artefatos essenciais listados, mantendo caminhos relativos e imports.
3. Ajustar `tsconfig` para aliases idênticos ao projeto atual.
4. Validar build (`next build`) e type-check (`tsc --noEmit`).
5. Rodar testes unitários mínimos para features migrados.

## Plano de Refatoração

* Núcleo funcional:

  * Migrar lógica principal intacta (features/monitor, páginas monitor, pipeline mínimo).

  * Configurar ambiente de desenvolvimento e scripts.

  * Criar testes unitários básicos para Top5/Distribuição/Ranking.

* Melhorias arquiteturais:

  * Isolar camada `data-pipeline` e remover acoplamentos.

  * Integrar serviços de ranking/premiações de forma única e documentada.

  * Documentar design de fluxo de dados e contratos de props.

* Otimizações:

  * Medir e otimizar performance de listas/gráficos.

  * Adicionar logging leve em serviços e métricas.

  * Configurar monitoramento básico (telemetria opcional).

## Critérios de Sucesso

* 100% da funcionalidade estável preservada nas páginas Monitor.

* Redução de complexidade (módulos duplicados eliminados, responsabilidades claras).

* Cobertura de testes ≥ 80% nos módulos migrados críticos.

* Documentação técnica cobrindo fluxo de dados, dependências e decisões.

## Riscos e Mitigações

* Divergência de dados por fallback ETL per-deputado: mitigar unificando fontes via cache; fallback apenas em páginas não-criticamente Monitor.

* Quebra de imports/aliases: usar configuração idêntica de `tsconfig` e scripts; validar com `tsc`/lint.

* UI primitives incompatíveis: migrar somente o subconjunto realmente usado; manter versões de libs.

## Próximos Passos Imediatos

* Listar e marcar (no repositório) os arquivos essenciais da lista como “in scope” da migração.

* Inicializar `monitor-correto` (Next+TS) com aliases equivalentes e dependências mínimas.

* Configurar testes básicos (unit) para 3 componentes do Monitor.

* Definir métricas de qualidade (cobertura, lint, type-check) e criar scripts.

