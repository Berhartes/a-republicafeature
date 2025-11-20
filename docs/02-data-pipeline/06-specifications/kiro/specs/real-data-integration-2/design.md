# Design e Estratégia — real-data-integration-2

## Princípios
- Não modificar o spec original; atuar como trilho auxiliar de execução.
- Dados reais por padrão; mocks somente em desenvolvimento e nunca em produção.
- `pages/` como única fonte de rotas; componentes compartilham lógica.

## Estratégia de Migração
- Consolidar páginas em `pages/`, migrando lógicas para `src/components/*`.
- Substituir qualquer geração de dados por consumo de `GlobalDataContext`, `etlCacheService` e `unifiedCacheManager`.
- Ajustar `GlobalDataContext` para remover geração de alertas de exemplo em produção (manter apenas em `NODE_ENV=development`).

## Padrões de Implementação
- Estado vazio/carregamento em ausência de dados; evitar inventar transações.
- Serviços centralizam acesso aos caches; componentes não devem acessar diretamente fontes não padronizadas.
- Logs de cache (manager) silenciados ou minimizados em produção.

## Validação
- Build limpo e smoke test de rotas principais.
- Monitorar regressões visuais após remoção de mocks.