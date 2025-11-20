## Objetivo
- Implementar um componente reutilizável `MiniCardStats` que renderiza entre 2 e 15 minicards com layout padrão de 4 colunas, suportando modo completo e simplificado, responsivo e com propriedades individuais (cor, ícone, título, valor, variação).
- Integrar na página `/gastos/deputados` substituindo o bloco de estatísticas pelo novo componente.

## Implementação
- Local do arquivo: `packages/monitor-despesas-next/src/components/monitor/MiniCardStats.tsx`.
- Props:
  - `items: Array<{ title: string; value: number | string; variant?: 'full' | 'compact'; color?: string; icon?: React.ComponentType<{ className?: string }>; delta?: { value?: number | string; trend?: 'up' | 'down' | 'neutral' }; formatType?: 'currencyCompactBRL' | 'currencyBRL' | 'number' | 'raw' }>`
  - `columns?: number` (padrão: 4)
  - `className?: string`
- Recursos:
  - Valida tamanho de `items` (2–15), aplica layout em grid com classes Tailwind predefinidas por colunas.
  - Formatação de valores com `formatCompactCurrencyBRL` e `formatCurrencyBRL`; números usam `Intl.NumberFormat('pt-BR')`.
  - Gradiente e borda por cor com mapa fixo de cores Tailwind.
  - Modo `full`: ícone, título, valor e variação opcional com setas e cores.
  - Modo `compact`: valor destacado e título secundário.

## Integração
- Em `packages/monitor-despesas-next/src/app/gastos/deputados/DeputadosClient.tsx`:
  - Importar `MiniCardStats`.
  - Substituir o grid de estatísticas por `<MiniCardStats items={[{ title: 'Deputados filtrados', value: total, variant: 'compact', color: 'blue', icon: User }, { title: 'Média de gastos', value: stats.mediaGasto, variant: 'full', color: 'green', icon: TrendingUp }, { title: 'Total gasto', value: stats.totalGasto, variant: 'full', color: 'purple', icon: TrendingUp }, { title: 'Total cadastrados', value: stats.total, variant: 'compact', color: 'amber', icon: User }]} columns={4} />`.

## Validação
- Abrir `http://localhost:3000/gastos/deputados` e verificar os quatro minicards com valores esperados, responsividade e consistência visual.

Posso criar o componente e integrar agora?