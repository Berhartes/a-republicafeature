## Objetivo
- Extrair toda a estrutura de busca e filtros da página `/gastos/deputados` para um componente reutilizável `BuscarParlamentar` em `packages/monitor-despesas-next/src/components/monitor/BuscarParlamentar.tsx`.

## Escopo do Componente
- Contém o contêiner visual e os controles:
  - Campo de busca por nome com botão "Buscar" e enter-to-search.
  - Select de partido.
  - Select de UF.
  - Select de ordenação (gasto, nome, partido, uf).
  - Botão "Limpar Filtros" quando houver query ativa.
- Responsivo em grid 4 colunas (mantém visuais atuais com componentes UI existentes).

## API
- `props`:
  - `partidos: string[]`
  - `ufs: string[]`
  - `values: { search?: string; partido?: string; uf?: string; sort?: string; page?: string }`
  - `onUpdate: (updates: Record<string, string | null>) => void` (aplica alterações, reseta página quando necessário)
  - `onSearch: (term: string) => void`
  - `onClear: () => void`
  - `isPending?: boolean`
- Implementação como Client Component (`'use client'`), usando `Card`, `Input`, `Select`, `Button`, `Label` já utilizados na página.

## Integração
- Em `src/app/gastos/deputados/DeputadosClient.tsx`:
  - Importar `BuscarParlamentar`.
  - Passar `partidos`, `ufs`, `values` baseados em `useSearchParams` (`search`, `partido`, `uf`, `sort`, `page`).
  - Encapsular a lógica atual de `updateURL`, `handleSearch`, `router.push('/gastos/deputados')` nas props `onUpdate`, `onSearch`, `onClear`.
  - Substituir o bloco atual de filtros (linhas ~247–345) por `<BuscarParlamentar ... />`.

## Considerações de SSR/Hidratação
- Não usar fontes variáveis (Date.now, Math.random) no componente.
- Reutilizar os mesmos UI components e classes Tailwind para evitar diferenças de markup.

## Validação
- Abrir `http://localhost:3000/gastos/deputados` e testar:
  - Digitar e buscar por nome.
  - Alterar partido/UF/ordenar.
  - Limpar filtros.
  - Verificar que a URL é atualizada e a lista/paginação reagem como antes.

Posso implementar o componente e integrar agora?