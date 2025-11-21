## Objetivo
Deixar `src/components/monitor/Top5Fornecedores.tsx` completo em si mesmo, sem depender de `components/fornecedores/Top5FornecedoresRanking`, mantendo a API atual usada pela página `/monitor/fornecedores`.

## Situação Atual
- `Top5Fornecedores` (monitor) é apenas um invólucro de `<Card>` que delega toda a renderização para `Top5FornecedoresRanking` (fora do diretório monitor).
- A página `/monitor/fornecedores` usa: `Top5Fornecedores items={topItems}` e espera título/descrição default.

## Implementação
1. Tornar componente autônomo
- Remover a dependência do `Top5FornecedoresRanking` e incorporar internamente a lógica de renderização: cabeçalho com título/descrição, lista Top 5, barras de progresso, badge de categoria e botão “Ver Perfil”.
- Manter formatação de valores e cálculo de percentuais em relação ao total de referência (soma dos itens), como no ranking atual.

2. API do componente (compatível + extensível)
- Manter props existentes: `items: TopFornecedorItem[]`, `title?`, `description?`, `className?`, `height?`, `totalReferencia?`.
- Adicionar opcionais sem quebrar uso: `categorias?`, `categoriaSelecionada?`, `onCategoriaChange?`, `categorySelectMode? ('none' | 'dropdown' | 'button')`, `emptyMessage?`, `monetaryFormat? ('with-cents' | 'without-cents')`, `showDeputadosCount?`.
- Calcular `totalReferencia` quando não fornecido (soma de `valor`).

3. Estados e UX
- Implementar estados: loading (controlado por prop futura, default false) e vazio (items.length === 0) com mensagens amigáveis.
- Manter responsividade e truncamento de nomes longos.
- Chave estável baseada em índice para evitar hydration issues.

4. Roteamento
- Implementar navegação “Ver Perfil” via `router.push('/gastos/fornecedor/{cnpj}')` com limpeza de máscara do CNPJ.

5. Estilo e consistência
- Usar `Card`, `Button`, `Select` e utilitários já usados no projeto (shadcn + Tailwind), mantendo visual consistente com a seção Monitor.
- Reutilizar cores por categoria conforme o ranking original.

## Verificação
- Abrir `/monitor/fornecedores` e verificar:
  - Renderização dos 5 fornecedores com valores, percentuais, transações e categoria.
  - Botão “Ver Perfil” navega corretamente.
  - Responsividade: 1 coluna (mobile), 2 colunas (md), conforme layout.
- Ajustar caso haja warnings de hidratação.

## Impacto
- Não altera a API usada hoje na página; apenas internaliza a implementação.
- Facilita modularização: o componente fica autônomo no diretório `monitor` e pode evoluir sem dependências externas.

Confirma aplicar este plano? Após aprovação, faço as alterações e valido no ambiente local.