# Plano de Remoção e Migração — real-data-integration-2

Este spec secundário não modifica `real-data-integration`. Centraliza ações práticas para:
- Arquivar/remover specs obsoletos/indiferentes.
- Unificar páginas do frontend em `pages/` e remover duplicatas.
- Retirar mocks e dados sintéticos, conectando tudo ao cache real.

## Fases e Tarefas

1) Inventário e decisão de obsolescência
- Marcar para remoção: `sistema-producao-estavel` (redundante, sobreposição ampla)
- Absorver pelo plano atual: `frontend-page-cleanup` (limpeza de páginas duplicadas)
- Arquivar como concluído: `fix-typescript-build-errors` (ETL preserva `nomeEleitoral`/`siglaPartido` e frontend usa)
- Encerrar e arquivar após testes finais: `fix-categoria-fornecedores-data-flow`

2) Unificação de páginas (Next.js `pages/` como única fonte)
- Unificar `PerfilDeputadoModular` (duplicado em `src/client/pages` e em `src/client/pages/perfil-deputado/`) mantendo apenas rota em `pages/`
- Consolidar `FornecedoresPage` vs `FornecedoresPageModular` (mover lógica modular para componentes, manter uma página)
- `relatorios.tsx`: usar componentes, não importar páginas antigas; plugar em `GlobalDataContext`

3) Remoção de mocks e dados sintéticos
- Remover `Math.random()` e dados de exemplo nas seguintes áreas e substituir por dados do cache/serviços:
  - `src/components/deputado/hooks/useDeputadoData.ts`
  - `src/components/fornecedor/hooks/useFornecedorData.ts`
  - `src/services/categoria-transacoes.service.ts`
  - `src/components/fornecedores/TransacoesGlobais.tsx`
  - `src/components/categorias/pages/FornecedoresCategoriaPage.tsx`

4) Padronização de acesso aos caches
- Adotar `etlCacheService` e `unifiedCacheManager` como camada oficial de dados
- Ajustar `GlobalDataContext` para não gerar “alertas de exemplo” em produção durante `refetch`

5) Validação
- `npm run build` e smoke test das rotas principais (`/`, `/gastos/analise-avancada`, `/gastos/relatorios`, perfis de deputado e fornecedor)
- Garantir que páginas não quebram sem dados: estados vazios/carregamento, sem gerar dados falsos

6) Documentação
- Atualizar `docs/monitordocs` com resumo das mudanças
- Changelog claro e nota de descontinuação dos specs removidos

## Issues Objetivas (para este spec)

1. Unificação de páginas duplicadas do frontend
- Descrição: consolidar páginas em `pages/`, migrar lógicas para componentes e remover duplicatas em `src/client/pages`
- Escopo mínimo: `PerfilDeputadoModular`, `FornecedoresPage`/`FornecedoresPageModular`, `relatorios.tsx`
- Critérios de aceite: build passa; rotas funcionam; nenhuma importação direta de páginas antigas

2. Remover mocks/dados sintéticos em páginas e hooks críticos
- Descrição: substituir geração com `Math.random()` pelos dados de `GlobalDataContext`/`etlCacheService`
- Arquivos alvo: ver lista na Fase 3
- Critérios de aceite: nenhuma geração randômica em produção; estados vazios em falta de dados, sem erro

3. Padronizar acesso ao cache
- Descrição: usar `etlCacheService`/`unifiedCacheManager` em todos os serviços e componentes que consomem dados agregados
- Critérios de aceite: rotas principais renderizam com dados reais quando disponíveis; logs de cache reduzidos em produção

4. Ajustes no `relatorios.tsx`
- Descrição: remover dependência de `AlertasPage` como página; transformar em componente e consumir dados do `GlobalDataContext`
- Critérios de aceite: aba/relatórios renderiza sem acoplamento com páginas antigas; exportações e impressão funcionam

## Observações
- Não tocar no conteúdo do spec original `real-data-integration`.
- Todas as ações de remoção/arquivamento devem ser registradas em changelog.