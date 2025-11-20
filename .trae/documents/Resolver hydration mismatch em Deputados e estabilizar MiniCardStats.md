## Problema
- O HTML cacheado pelo servidor (ISR revalidate=3600) diverge do markup novo do cliente após a troca para MiniCardStats, gerando hydration mismatch.

## Correções
- Desativar cache ISR na página de deputados em ambiente de desenvolvimento:
  - Alterar `packages/monitor-despesas-next/src/app/gastos/deputados/page.tsx` de `export const revalidate = 3600` para `export const revalidate = 0`.
  - Opcional: adicionar `export const dynamic = 'force-dynamic'` para garantir renderização dinâmica.
- Manter o componente `MiniCardStats` sem fontes de variação não determinísticas (sem `Date.now()`/`Math.random()`), usando `formatCompactCurrencyBRL`/`formatCurrencyBRL` para consistência SSR/CSR.
- Após alterar o revalidate, executar hard reload no navegador para sincronizar HTML e JS.

## Passos
1. Editar `page.tsx` e definir `revalidate = 0` (e `dynamic = 'force-dynamic'` opcional).
2. Reiniciar o servidor (se necessário) e atualizar o navegador.
3. Verificar em `http://localhost:3000/gastos/deputados` que não há mais mismatches e os minicards estão corretos.

Posso aplicar essas mudanças agora?