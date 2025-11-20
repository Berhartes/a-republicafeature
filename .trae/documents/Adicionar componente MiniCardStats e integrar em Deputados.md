## Objetivo
- Criar `MiniCardStats` em `packages/monitor-despesas-next/src/components/monitor/MiniCardStats.tsx` exibindo os quatro indicadores coloridos com borda.
- Integrar na página `/gastos/deputados`, substituindo o grid de estatísticas atual por `MiniCardStats`.

## Componente
- Props: `{ totalFiltrados: number; mediaGasto: number; totalGasto: number; totalCadastrados: number }`.
- Renderização: quatro cartões simples com borda, cor de fundo suave e texto destacado.
- Utiliza `Card` de `@/components/ui/card` e `formatCompactCurrencyBRL` de `@/lib/formatters`.
- Caminho do arquivo: `src/components/monitor/MiniCardStats.tsx`.

## Integração na página
- Em `src/app/gastos/deputados/DeputadosClient.tsx`, importar `MiniCardStats`.
- Substituir o bloco "Estatísticas" (linhas ~235–264) por `<MiniCardStats totalFiltrados={total} mediaGasto={stats.mediaGasto} totalGasto={stats.totalGasto} totalCadastrados={stats.total} />`.

## Estilo
- Tailwind classes: borda (`border`), fundo suave (`bg-gradient-to-r from-blue-50 to-blue-100/50`), cantos arredondados (`rounded-lg`), tipografia forte (`font-bold`).
- Layout responsivo em grid 1/4 cols.

## Validação
- Iniciar dev server já ativo; abrir `http://localhost:3000/gastos/deputados` para ver os quatro cartões.

Posso criar o componente e integrar na página agora?