## Objetivos

- Unificar ranking e premiações em um único método de Server Actions, garantindo consistência e desempenho em SSR.
- Reaproveitar o pipeline atual (loaders → parsers zod → normalização), eliminando fontes paralelas e duplicações.
- Manter a UX das páginas do Monitor e substituir quaisquer endpoints REST internos por Server Actions.

## Estado Atual (referências)

- Ranking utilitários: `packages/monitor-despesas-next/src/services/unified-ranking-service.ts` (ranking geral, por ano, por categoria, filtrado; estatísticas)
- Premiações: `packages/monitor-despesas-next/src/services/premiacao-unificada.ts` (coroas/troféus/medalhas/campeão geral e estatísticas)
- Pipeline dados: `packages/monitor-despesas-next/src/app/gastos/actions/_cached-loaders.ts`, `packages/monitor-despesas-next/src/app/gastos/actions/analytics.ts`, `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts`
- Páginas Monitor: `packages/monitor-despesas-next/src/app/monitor/fornecedores/page.tsx`, `packages/monitor-despesas-next/src/app/monitor/deputados/page.tsx`

## API Unificada (Server Actions)

- `getRankingAndAwards(filtros)` (Server Action)
  - Entrada: `{ ano?: number|'todos'; categoria?: string|'TODAS'; uf?: string|'TODAS'; limit?: number }`
  - Saída:
    - `ranking`: objeto com `{ geral, porCategoria, porAno }` (listas tipadas)
    - `estatisticas`: `{ totalDeputados, totalGastos, mediaGastos }` (do serviço unificado)
    - `premiacoes`: `{ coroas, trofeus, medalhas, estatisticas, campeaoGeral }`
    - `filtrado`: ranking após filtros (para telas específicas)
  - Responsabilidade: orquestrar loaders, parsers, normalização; aplicar funções do serviço unificado; gerar premiações a partir dos primeiros colocados de cada ranking.

## Contratos de Tipos

- Reusar tipos já adotados:
  - Deputado: `packages/monitor-despesas-next/src/types/etl-deputados.types.ts`
  - Saídas do ranking (lista de `DeputadoProcessado`) e estatísticas em `unified-ranking-service.ts`
  - Saída de premiações em `premiacao-unificada.ts`

## Fluxo Interno (Server Actions)

1. Carregar dados: `loadDeputiesCache` `src/app/gastos/actions/_cached-loaders.ts:14–16`
2. Validar/parsear: `parseDeputiesCache` `src/app/gastos/actions/analytics.ts:37–52`
3. Normalizar (quando necessário) e projetar para `DeputadoProcessado` (fonte: `data-actions.ts:58–143`)
4. Calcular rankings:
   - Geral: `getRankingGeral`
   - Por ano: `getRankingPorAno`
   - Por categoria: `getRankingPorCategoria`
   - Combinado: `getRankingFiltrado`
5. Calcular estatísticas: `calcularEstatisticasRanking`
6. Gerar premiações: `processarPremiacoes` + `identificarCampeaoGeral`
7. Retornar resultado único (ranking + premiações + estatísticas + filtrado)

## Migração dos Callers (sem alterar UX)

- Substituir quaisquer `fetch('/api/...')` por chamadas diretas à Server Action `getRankingAndAwards`:
  - `RankingDeputadosCategoria.tsx:40–46` (hoje usa REST); passa a chamar Server Action com `categoria` e `limit`, recebendo o ranking pronto.
- Páginas do Monitor continuam orquestrando Server Actions e repassando props aos componentes em `@/features/monitor`.

## Cache e Revalidação

- Manter `unstable_cache` e `revalidateTag` onde aplicável (em loaders) para dados materiais.
- Server Action não deve reimplementar cache; apenas orquestrar o pipeline já cacheado.

## Testes e Validação

- Unit tests: ranking (ordenação, filtros) e premiações (campeões, contagem, estatísticas) com amostras.
- Smoke tests: `/monitor/deputados` e ranking filtrado por categoria/ano com Server Actions.
- Tip-check (`tsc`) em todos os módulos tocados.

## Passos de Implementação

1. Implementar `getRankingAndAwards` (Server Action) em `src/app/monitor/actions/ranking-premiacoes.ts` com os contratos acima.
2. Adaptar `RankingDeputadosCategoria` para usar Server Action diretamente (sem REST), mantendo fallback de loading UI.
3. Remover/arquivar endpoints REST internos equivalentes.
4. Revisar outros componentes/páginas que consultem ranking/premiações para usar a nova Server Action.
5. Criar suíte de testes unitários para ranking/premiações.

## Critérios de Aceite

- Todas consultas de ranking/premiações passam exclusivamente por Server Actions.
- Resultados de ranking/premiações idênticos ou melhores em consistência (uma única fonte de verdade).
- Zero endpoints REST internos usados pelo Monitor.
- Testes unitários cobrindo ranking e premiações com alto nível de confiança.

## Observações

- Ranking e premiações são inseparáveis: os prêmios sempre derivam dos primeiros colocados; por isso, a unificação numa SA é o desenho ideal.
- Não altera UX nem a composição dos componentes canônicos em `@/features/monitor`; apenas substitui o modo de obter dados.