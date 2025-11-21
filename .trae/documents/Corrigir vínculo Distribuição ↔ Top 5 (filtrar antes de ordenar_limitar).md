## Resumo do problema
- Distribuição → Top 5 está inconsistente porque o Top 5 filtra após limitar a 5 itens, e com rótulos de categorias heterogêneos. Isso deixa o Top 5 vazio em muitas seleções.

## Papel do “componente” de filtros
- Já existe um elo leve que criamos: `FilterContext` (um Provider/hook). Ele pode e deve ser o vínculo único entre:
  - Distribuição de Gastos (clique em categoria)
  - Top 5 Fornecedores (dropdown de categoria)
  - Lista de Fornecedores (aplicação do filtro)
- Ele é modular (um único módulo client) e pode evoluir para gerenciar outros filtros (uf, ordenação etc.), mantendo cada componente autocontido.

## Plano de correção do Top 5 (com o Provider como vínculo)
1. Remover o `slice(0, 5)` do Top 5 (o componente deve receber a lista completa e decidir o Top 5 após filtrar).
2. Normalizar categorias:
   - `norm()` (remove acentos, uppercase, trim)
   - `groupCategory()` (mapeia sinônimos: PASSAGENS AÉREAS, DIVULGAÇÃO, LOCAÇÃO/FRETAMENTO DE VEÍCULOS, TELEFONIA).
3. Lógica de dados no Top 5:
   - Filtrar primeiro por categoria ativa do `FilterContext` (fallback ao prop `categoriaSelecionada`).
   - Ordenar por `valor` desc.
   - Limitar em 5.
   - Calcular `total` e percentuais a partir do conjunto filtrado.
4. Página (`page.tsx`):
   - Passar o ranking completo ao Top 5 (sem `slice` no server) — mantém componente autocontido.
5. UX
   - Dropdown do Top 5 usa o valor do Provider (sem mudar URL).
   - Empty state claro quando não houver fornecedores na categoria.

## Modularização opcional
- Renomear `FilterContext` para `FornecedorFiltersProvider` e `useFornecedorFilters` para clareza.
- Extrair normalização para um util compartilhado (sem alterar URL ou títulos), garantindo alinhamento com Distribuição.

## Validação
- Selecionar categorias no gráfico e no dropdown e verificar que:
  - Top 5 sempre traz os 5 maiores da categoria filtrada.
  - Percentuais refletem o conjunto filtrado.
- Garantir que Lista continue reagindo e que a URL não seja alterada para categoria.

## Resultado esperado
- Vínculo perfeito entre os três componentes via Provider.
- Top 5 consistente e autocontido: filtra, ordena e limita corretamente, com rótulos heterogêneos suportados.