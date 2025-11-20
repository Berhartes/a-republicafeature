# Requisitos — real-data-integration-2

## Objetivo
Garantir migração limpa para dados reais e simplificação da base de páginas, sem alterar o spec original.

## Requisitos e Critérios de Aceite

1. Arquivar/remover specs obsoletos
- Critérios: decisão documentada; changelog atualizado; itens úteis migrados como issues ativas neste spec.

2. Unificação de páginas
- Critérios: `pages/` contém todas as rotas oficiais; duplicatas removidas de `src/client/pages`; navegação e SEO intactos.

3. Remoção de mocks
- Critérios: nenhum uso de `Math.random()` em produção nos arquivos listados; componentes exibem estados vazios/carregamento quando faltam dados;

4. Padronização de acesso aos caches
- Critérios: serviços e páginas usam `etlCacheService` e/ou `unifiedCacheManager`; redução de logs em produção; sem dependências de páginas antigas.

5. Build e Testes
- Critérios: `npm run build` passa; smoke tests das rotas-chave sem erros; comportamento estável sem dados falsos.

6. Documentação
- Critérios: resumo em `docs/monitordocs`; registro de descontinuação dos specs; instruções de migração onde aplicável.