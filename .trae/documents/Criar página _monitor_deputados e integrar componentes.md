## Objetivo
- Adicionar a página `packages/monitor-despesas-next/src/app/monitor/deputados/page.tsx` acessível em `http://localhost:3000/monitor/deputados`.
- Renderizar os dados reais dos deputados e importar os componentes `BuscarParlamentar` e `MiniCardStats` (via `DeputadosClient`).

## Implementação
- Server component `page.tsx` com:
  - `export const revalidate = 0` e `export const dynamic = 'force-dynamic'` para evitar mismatches.
  - Busca SSR via `getDeputados` de `@/app/gastos/actions/data-actions`.
  - Renderização de `DeputadosClient` de `@/app/gastos/deputados/DeputadosClient` (que já importa `BuscarParlamentar` e `MiniCardStats`).
- Mantém a lógica de filtros, URL e estatísticas existente.

## Validação
- Abrir `http://localhost:3000/monitor/deputados` e confirmar:
  - Minicards com os quatro indicadores.
  - Componente de busca/filtros funcionando (partido, UF, ordenação, buscar e limpar).
  - Lista e paginação carregando com dados reais.

Posso criar a página e integrar agora?