## Diagnóstico
- O componente `BuscarFornecedores` hoje é apenas UI de filtros e **não** renderiza a lista nem faz fetch: `src/components/monitor/BuscarFornecedores.tsx:13–29, 43–122`.
- A lista real com banners e mecanismo (filtros + paginação + cards) já existe em `FornecedoresPageClient`: `src/app/gastos/fornecedores/FornecedoresPageClient.tsx:299–375`.
- O fetch dos dados reais vem de `getFornecedores`: `src/app/gastos/actions/data-actions.ts:193–261`, lendo o cache ETL via `CacheService`.
- Mismatch de parâmetros na URL: Monitor usa `search`, `sort`, `uf`; o fetch usa `searchTerm`, `sortBy`, `scoreMinimo` e não há `uf` direto em `FornecedorResumo` (`packages/shared/src/types/fornecedor.ts:29–44`).

## Plano de Implementação
1. Página do Monitor com dados reais
- Em `src/app/monitor/fornecedores/page.tsx`, receber `searchParams` (como na rota `/gastos/fornecedores`: `page.tsx:39–51`).
- Normalizar e mapear:
  - `searchTerm` ← `search`
  - `categoria` ← `categoria`
  - `scoreMinimo` ← (não controlado hoje, deixar vazio)
  - `sortBy` ← mapear de `sort`: `gasto`→`totalRecebido`, `nome`→`nome`
  - `page` ← `page`
- Chamar `getFornecedores({ searchTerm, categoria, scoreMinimo, sortBy, page, pageSize: 100 })` (`data-actions.ts:193–261`).
- Manter os gráficos do Monitor (Top 5 e Distribuição) como estão.

2. Render da lista e banners abaixo dos filtros
- Reusar `FornecedoresPageClient` para exibir:
  - Banner “FONTE DE DADOS” (`FornecedoresPageClient.tsx:178–206`).
  - Cards e paginação (`FornecedoresPageClient.tsx:299–375`).
- Renderizar `FornecedoresPageClient` logo abaixo de `FornecedoresClient` (que já contém `BuscarFornecedores`). Passar `fornecedores`, `total`, `pageSize: 100`, e `searchParams` normalizados.

3. Unificar parâmetros de filtros no cliente
- Em `src/app/monitor/fornecedores/FornecedoresClient.tsx`, atualizar `updateURL` para usar as chaves do fetch:
  - `searchTerm` (em vez de `search`)
  - `sortBy` (em vez de `sort`)
  - `categoria` mantém
  - `page` mantém
- Observação: `uf` não tem suporte nativo em `getFornecedores`; manter no UI por ora, mas não afetará o backend. Opcional: futuro filtro por `deputadosAtendidos[].siglaUf`.

4. Opcional (reduzir duplicação)
- Se preferir que o próprio `BuscarFornecedores` contenha a lista, extrair o bloco de lista de `FornecedoresPageClient` para um novo componente (`SuppliersList`) e usá-lo dentro de `BuscarFornecedores`. Isso evita duplicar marcação e lógica.

## Detalhes Técnicos
- Tipos: `FornecedorResumo` não possui `uf` direto; estado aparece em `deputadosAtendidos.siglaUf` (`packages/shared/src/types/fornecedor.ts:29–44`).
- Página `/gastos/fornecedores` usa `pageSize: 100` (`page.tsx:62–63`) e normaliza `searchParams` (`page.tsx:39–51`).
- Layout do Monitor já ajustado para gráficos lado a lado (`src/app/monitor/fornecedores/page.tsx:55–61`).

## Verificação
- Rodar em dev e validar:
  - Filtros atualizam a URL com chaves esperadas (`searchTerm`, `categoria`, `sortBy`, `page`).
  - Lista renderiza com total, paginação e banners.
  - Gráficos continuam corretos.
- Testar combinações de filtros e paginação; garantir que o cache ETL está sendo usado (`CacheService`).

Confirma aplicar este plano? Após aprovação, faço as alterações e entrego já com validação local.