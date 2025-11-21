## Objetivo
- Implementar `BuscarFornecedores` em `packages/monitor-despesas-next/src/components/monitor/BuscarFornecedores.tsx` para uso em `/gastos/fornecedores`.

## Escopo
- Container de filtros com:
  - Busca por nome do fornecedor.
  - Select de categoria.
  - Select de UF.
  - Select de ordenação (maior gasto, nome, categoria, UF).
  - Botão "Limpar Filtros" quando houver query ativa.
- Layout responsivo (grid 4 colunas), usando os mesmos componentes de UI já utilizados.

## API
- Props:
  - `categorias: string[]`
  - `ufs: string[]`
  - `values: { search?: string; categoria?: string; uf?: string; sort?: string; page?: string }`
  - `onUpdate: (updates: Record<string, string | null>) => void`
  - `onSearch: (term: string) => void`
  - `onClear: () => void`
  - `isPending?: boolean`

## Implementação
- Client component (`'use client'`) com `Card`, `Input`, `Select`, `Button`, `Label` de `@/components/ui`.
- Sem uso de APIs variáveis para evitar problemas de hidratação.

## Integração futura
- Página `/gastos/fornecedores` poderá importar este componente, passando listas e handlers que atualizam a URL.

Posso criar o componente agora?