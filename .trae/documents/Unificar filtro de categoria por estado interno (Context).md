## Objetivo
- Tornar o filtro de categoria interno ao componente (estado gerenciado no client), sem alterar a URL.
- Manter o vínculo funcional entre Top 5, Distribuição de Gastos e Lista de Fornecedores.
- Preservar ordenação por valor e demais funcionalidades existentes.

## Estratégia de Estado Compartilhado
- Criar `FilterContext` (Client Component) com estado e setters para o filtro de categoria (`selectedCategory`).
- Inicialização: opcionalmente ler o valor inicial da categoria de `resolvedSearchParams` (sem manter sincronização com a URL após o primeiro render).
- Escopo: envolver os três componentes com `<FilterProvider>` dentro da página `src/app/monitor/fornecedores/page.tsx`.

## Alterações por Componente
- `DistribuicaoGastosPorCategoria` (client):
  - Remover uso de `useNavigate`/`useLocation` para categoria.
  - No clique da barra, chamar `setSelectedCategory(categoria)` do contexto.
  - Manter renderização e comportamento atuais (tooltips, pizza/barras, cálculo de cores), apenas substituir navegação por atualização de estado.

- `Top5Fornecedores` (client):
  - No dropdown de categoria, substituir `router.push(...)` por `setSelectedCategory(nova)`.
  - A lista exibida já filtra por `categoriaSelecionada`; passar a ler `selectedCategory` do contexto (com fallback ao prop atual para compatibilidade).
  - Manter demais funcionalidades (ver perfil, descrição, ordenação dos itens).

- `FornecedoresClient` + `BuscarFornecedores` (client):
  - Continuar tratando `search`, `uf`, `sort`, `page` via URL como hoje.
  - Para `categoria`, ler de `FilterContext` e aplicar filtro client-side sobre `fornecedores` recebidos do servidor (preservar ordenação por `totalRecebido`).
  - Quando o usuário alterar categoria no `BuscarFornecedores`, atualizar também `selectedCategory` do contexto; opcionalmente evitar atualizar a URL para `categoria` (mantendo a restrição de não modificar a URL base para categoria).

## Fluxo de Dados
- Página (`page.tsx`) obtém dados do servidor como hoje.
- `<FilterProvider>` torna `selectedCategory` disponível aos três componentes.
- A seleção na Distribuição ou Top 5 muda `selectedCategory` e os componentes reagem:
  - Top 5: filtra itens (já implementado) usando `selectedCategory`.
  - Lista: filtra fornecedores client-side por `tipoDespesaPrincipal`/`categorias` mantendo ordenação por `totalRecebido`.
  - Buscar/controles: continuam operando para outros filtros; categoria atual mostra o estado do contexto.

## Preservação de Comportamento
- Não alterar o título da página, nem o caminho base `http://localhost:3000/monitor/fornecedores`.
- Ordenação dos fornecedores permanece por valor total transacionado.
- Manter todos os componentes responsivos a mudanças de categoria via contexto.

## Pontos Técnicos
- Provider: `packages/monitor-despesas-next/src/contexts/FilterContext.tsx` (novo arquivo client), expondo `useFilter()`.
- `page.tsx`: envolver `Top5Fornecedores`, `DistribuicaoGastosPorCategoria` e `FornecedoresClient` com o Provider, passando estado inicial opcional da categoria.
- `Top5Fornecedores.tsx`: ler `selectedCategory` do contexto (prioritário) e manter prop como fallback; trocar `router.push` por setter.
- `DistribuicaoGastosPorCategoria.tsx`: trocar navegação por setter.
- `FornecedoresClient.tsx`: aplicar filtro client-side quando `selectedCategory` estiver definido.

## Validação
- Dev server: navegar até `/monitor/fornecedores`, clicar em barras/pizza e dropdown de categoria; verificar que:
  - A URL não muda ao alterar categoria.
  - Top 5 e Lista respondem imediatamente.
  - Ordenação por valor permanece.
- Rodar checagem A11Y para garantir que mudanças não introduziram regressões.

## Observações
- Restringimos a internalização apenas ao filtro de categoria, mantendo os demais via URL, para minimizar impacto e preservar o fluxo atual.
- Caso desejado, podemos posteriormente migrar os demais filtros para o mesmo contexto mantendo compatibilidade com deep-linking por URL.