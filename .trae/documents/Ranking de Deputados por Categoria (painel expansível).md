## Objetivo
- Em Distribuição de Gastos por Categoria, quando uma categoria é selecionada (as demais somem), ocupar o espaço com uma aba expansível que mostra o ranking de deputados com maiores gastos naquela categoria.
- Ranking com: foto, nome eleitoral, número de transações, valor gasto, e nome da empresa onde mais gastou.
- Não alterar a URL; manter integração com Top 5 e Lista por meio do estado de categoria já compartilhado.

## Dados e Server Actions
- Criar uma server action `getTopDeputadosPorCategoria(categoria)` em `@/app/gastos/actions/data-actions` (ou `analytics`) que:
  1. Lê o cache ETL (via `loadSuppliersCache` / `parseSuppliersCache`).
  2. Filtra transações pela `categoria` selecionada.
  3. Agrega por deputado: `totalGasto`, `numeroTransacoes`, e determina `fornecedorTop` (fornecedor com maior gasto por deputado na categoria).
  4. Retorna ranking ordenado por `totalGasto` desc com campos: `{ deputadoId, nomeEleitoral, foto, numeroTransacoes, totalGasto, fornecedorTopNome }`.
- Page server continua igual; os dados do ranking serão carregados sob demanda quando o painel for expandido.

## Componente Client (UI)
- `RankingDeputadosCategoria.tsx` (client):
  - Props: `categoriaSelecionada` (string).
  - Estado: `open` (expandido/recolhido), `loading`, `data`.
  - Ao abrir (primeiro clique), chama a server action e exibe skeleton até carregar.
  - Renderiza lista em `Card` com cada item mostrando:
    - Avatar/foto (se disponível), nome eleitoral (link para `/gastos/perfil/[id]`).
    - Badge com número de transações.
    - Valor total gasto (formatado BRL).
    - Linha auxiliar com “Fornecedor mais gasto: <nome>”.
  - A11Y: `aria-expanded`, `aria-controls`, botão “Mostrar ranking”/“Ocultar ranking”.

## Integração em Distribuição
- `DistribuicaoGastosPorCategoria.tsx`:
  - Após aplicar o filtro (quando `selectedCategory` não está vazio), renderizar o painel expansível abaixo da barra selecionada.
  - O painel substitui visualmente o espaço das barras ocultas, mantendo o layout.
  - Estado de toggle do painel é local ao componente; não altera URL.

## Vínculo com os demais componentes
- O Provider de filtros (já existente) permanece como elo:
  - Top 5 e Lista continuam reagindo à `selectedCategory`.
  - O ranking usa a mesma `selectedCategory`, garantindo consistência de categoria.

## Tratamento de casos
- Sem dados: exibir estado vazio “Nenhum deputado encontrado para a categoria”.
- Muitos itens: limitar a 10 por padrão, com botão “Ver mais” (opcional).
- Performance: carregar apenas ao expandir; memoizar por categoria; usar formatação leve (sem logs sensíveis).

## Validação
- Selecionar uma categoria, verificar:
  - As barras somem, resta a selecionada.
  - A aba aparece; ao clicar, expande e lista corretamente o ranking.
  - Navegação para perfil do deputado funciona.
  - Top 5 e Lista continuam sincronizados.

## Entregáveis
- Server action `getTopDeputadosPorCategoria`.
- Componente `RankingDeputadosCategoria` com UI e interação.
- Integração em `DistribuicaoGastosPorCategoria` (render condicional quando há `selectedCategory`).