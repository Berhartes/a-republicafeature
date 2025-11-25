## Resultado da análise
- Base de comparação: `src/features/monitor/*` (Top5Fornecedores, DistribuicaoGastosPorCategoria, MiniCardStats, RankingDeputadosCategoria, MonitorNavigation, BuscarFornecedores, BuscarParlamentar, CardParlamentar)
- Arquivos redundantes (lógica/estrutura similares):
  1) `src/components/fornecedores/Top5FornecedoresRanking.tsx` → similar a `features/monitor/Top5Fornecedores.tsx` (ranking, seleção de categoria, formatação e navegação)
  2) `src/components/category/CategoryDistributionChart.tsx` → similar a `features/monitor/DistribuicaoGastosPorCategoria.tsx` (pizza/barras, legenda, toggle)
  3) `src/components/unified/UnifiedRankingDisplay.tsx` → similar a `features/monitor/RankingDeputadosCategoria.tsx` (UI de ranking de deputados, badges, métricas)
  4) `src/components/Navigation.tsx` → similar a `features/monitor/MonitorNavigation.tsx` (estrutura de navegação por rotas, estado de item ativo)
  5) `src/components/graficos/GraficosEspecializados.tsx` → sobreposição com `DistribuicaoGastosPorCategoria` e widgets de fornecedores/partidos/estados (mesma família de análises/visualizações)
- Observações: itens em `src/examples/*` também replicam padrões do Monitor (StatsCard, RankingDisplay v4, CategorySelector), úteis para consolidação futura, mas não impactam rotas.

## Proposta de organização (sem quebrar rotas)
- Criar `src/features/monitor-redundancia/` e mover redundâncias para revisão:
  - `Top5FornecedoresRanking.tsx` → `features/monitor-redundancia/Top5FornecedoresRanking.tsx`
  - `CategoryDistributionChart.tsx` → `features/monitor-redundancia/CategoryDistributionChart.tsx`
  - `UnifiedRankingDisplay.tsx` → `features/monitor-redundancia/UnifiedRankingDisplay.tsx`
  - `Navigation.tsx` → `features/monitor-redundancia/Navigation.tsx`
  - `GraficosEspecializados.tsx` → `features/monitor-redundancia/GraficosEspecializados.tsx`
- Manter wrappers/ponte temporários nos caminhos originais se necessário (reexport) para evitar quebra durante migração de imports.

## Plano de consolidação
1) Normalizar APIs dos pares (props, nomes, formatos) para facilitar merge:
   - Ranking fornecedores: comparar props (`fornecedores`, `totalReferencia`, filtros) e unificar em `Top5Fornecedores`.
   - Distribuição por categoria: alinhar toggles/legend e consolidar em `DistribuicaoGastosPorCategoria`.
   - Ranking deputados: unificar badges/estatísticas em `RankingDeputadosCategoria` e deprecar `UnifiedRankingDisplay`.
   - Navegação: manter `MonitorNavigation` para rotas /monitor e usar `Navigation` apenas para /gastos (sem duplicações internas).
   - Gráficos especializados: extrair partes comuns para `lib/formatters` ou `components/common` e referenciar desde Monitor.
2) Atualizar imports nas páginas para usar definitivos em `@/features/monitor`.
3) Remover arquivos redundantes após estabilização (sem wrappers).

## Validação
- Type-check, lint, build dev.
- Smoke test: `/monitor/fornecedores`, `/monitor/deputados`, `/gastos/fornecedores`.
- Monitorar HMR e limpar `.next` se preciso.

## Prompt para a próxima conversa (consolidação)
- Escolha por par qual deve ser o componente “fonte de verdade”:
  - Top5 Fornecedores: manter `features/monitor/Top5Fornecedores` e incorporar diferenças de `components/fornecedores/Top5FornecedoresRanking`?
  - Distribuição por Categoria: manter `features/monitor/DistribuicaoGastosPorCategoria` e portar features de `components/category/CategoryDistributionChart`?
  - Ranking de Deputados: manter `features/monitor/RankingDeputadosCategoria` e descontinuar `components/unified/UnifiedRankingDisplay`?
  - Navegação: manter `features/monitor/MonitorNavigation` apenas para /monitor e evitar duplicação?
  - Gráficos Especializados: extrair helpers para `lib` e referenciar em Monitor?

Se aprovar, executo os movimentos para `src/features/monitor-redundancia`, adiciono pontes temporárias e preparo diffs de consolidação componente a componente para sua revisão.