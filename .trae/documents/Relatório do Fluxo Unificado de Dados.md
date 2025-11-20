# Relatório do Fluxo Unificado de Dados

## Etapas do Fluxo

1) ETL — Materialização de Caches
- Nome da etapa: ETL Materialize
- Função principal: Extrair, transformar e materializar dados em caches JSON canônicos.
- Entradas esperadas: Dados das fontes oficiais (Camara API), parâmetros de período, schema de saída.
- Processamento realizado: Normalização, agregações anuais, geração de arquivos em `bancoDados/monitordespesas/congressoNacional/cache`.
- Saídas geradas: `suppliers-cache.json`, `deputados-cache.json`, `rankings-cache.json`, `analysis-cache.json`, `premiacoes-cache.json`, índices de transações.
- Dependências: Base API externa; consumida por `cache-sources.ts`.
- Pontos críticos: Tamanho de arquivos; consistência de schema; geração de manifest.

2) Resolução de Fonte de Cache
- Nome da etapa: Cache Sources Resolver
- Função principal: Resolver onde ler o cache (ETL dir/env ou canônico do monorepo), garantindo exclusividade da fonte ETL.
- Entradas esperadas: `cacheKey` (ex.: `suppliers-cache`), `ETL_OUTPUT_DIR` opcional.
- Processamento realizado: Mapeamento de aliases, tentativa ordenada de leitura, instrumentação de latência e tamanho.
- Saídas geradas: Objeto JSON do cache; metadados de fonte (`etl-env` ou `etl-monorepo`), latência, tamanho.
- Dependências: Caches ETL gerados; utilizado por `CacheService`.
- Pontos críticos: Inexistência de arquivo; compatibilidade de nomes/aliases.
- Referências: `packages/monitor-despesas-next/src/lib/cache/cache-sources.ts:34-74,92-153`.

3) Serviço de Cache (memória + métricas)
- Nome da etapa: CacheService.getFromSources
- Função principal: Orquestrar leitura das fontes, aplicar TTL e armazenar em memória com métricas.
- Entradas esperadas: `cacheKey`, TTL opcional.
- Processamento realizado: Hit/miss detection, leitura via `loadCacheByKeyWithSource`, cálculo de tamanho, decisão de armazenar, registro de métricas.
- Saídas geradas: Dados JSON; métricas por chave (hits/misses, latência, tamanho, última fonte).
- Dependências: `cache-sources.ts` para leitura; Server Actions para consumo; `getStats` para observabilidade.
- Pontos críticos: Memória excedida por entradas grandes; bypass de cache em dev.
- Referências: `packages/monitor-despesas-next/src/services/cache-service.ts:101-152,234-300`.

4) Server Actions — Normalização e Filtros
- Nome da etapa: Data Server Actions
- Função principal: Centralizar o acesso a dados, aplicar filtros, ordenação, paginação e normalizar para props.
- Entradas esperadas: Opções de filtros/paginação (ex.: `pageSize`, `search`, etc.), tags de revalidação.
- Processamento realizado: Carregar caches via `CacheService`, filtrar/ordenar/paginar no servidor, preparar props enxutos.
- Saídas geradas: Estruturas prontas para SSR (listas, detalhes, métricas).
- Dependências: `CacheService`, validações `zod` internas; páginas SSR consomem essas actions.
- Pontos críticos: Operações em arrays grandes; limites de `pageSize`; memoização/deduplicação.
- Referências: `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts:173-236,253-520,580-700`.

5) Renderização SSR/ISR
- Nome da etapa: Next SSR/ISR
- Função principal: Renderizar páginas como Server Components, com revalidação periódica.
- Entradas esperadas: Props das Server Actions, `revalidate` onde aplicável.
- Processamento realizado: Montagem de páginas, Suspense, boundaries de erro; tags de cache para revalidação.
- Saídas geradas: HTML renderizado, assets estáticos, hydration mínimo.
- Dependências: Server Actions; `revalidateTag` para invalidação.
- Pontos críticos: Prop size; dados desnecessários em client; tempo de revalidação adequado.
- Referências: `packages/monitor-despesas-next/src/app/gastos/fornecedores/page.tsx:39-77`.

6) Camada de Apresentação (Client Components)
- Nome da etapa: UI Client Components
- Função principal: Renderizar interações; consumir apenas props vindas do SSR.
- Entradas esperadas: Props enxutos das Server Actions.
- Processamento realizado: UI, event handlers, navegação, sem fetch de dados.
- Saídas geradas: Interatividade e visualizações.
- Dependências: Páginas SSR; sem dependência direta de dados.
- Pontos críticos: Evitar re-fetch; manter componentes finos.
- Referências: `packages/monitor-despesas-next/src/components/cache/CacheSelector.tsx:51-72` (usa Server Action `listAvailableCaches`).

7) Invalidação/Revalidação
- Nome da etapa: Invalidate + revalidateTag
- Função principal: Limpar entradas do CacheService e acionar revalidação por tag.
- Entradas esperadas: `cacheKey` opcional; tags registradas.
- Processamento realizado: `clearCache` e `revalidateTag(key, 'max')` para forçar atualização.
- Saídas geradas: Próximo SSR carrega dados frescos; métricas reinicializadas.
- Dependências: `CacheService`, tags definidas em `_cached-loaders.ts`.
- Pontos críticos: Revalidação em cascata; garantir que todas as páginas associadas usam tags.
- Referências: `packages/monitor-despesas-next/src/app/gastos/actions/cache-actions.ts:36-44`, `.../_cached-loaders.ts:38-41`.

8) Observabilidade/Métricas
- Nome da etapa: Cache Stats
- Função principal: Expor métricas (hits/misses, latência, tamanho, fonte) para auditoria e tuning.
- Entradas esperadas: `cacheKey` opcional.
- Processamento realizado: `getStats` e agregação por chave.
- Saídas geradas: Relatórios por chave; base para dashboards internos.
- Dependências: `CacheService` registrando métricas em tempo de carga.
- Pontos críticos: Falta de exportação contínua; ausência de painéis automatizados.
- Referências: `packages/monitor-despesas-next/src/services/cache-service.ts:234-300`, `packages/monitor-despesas-next/src/app/gastos/actions/cache-actions.ts:69-85`.

## Avaliação de Desempenho (0–10)
- ETL Materialize: Eficiência 8; Confiabilidade 9; Tempo 7; Integridade 9; Alinhamento 8 → Média 8.2
- Cache Sources Resolver: Eficiência 9; Confiabilidade 9; Tempo 9; Integridade 8; Alinhamento 9 → Média 8.8
- CacheService getFromSources: Eficiência 9; Confiabilidade 8; Tempo 9; Integridade 8; Alinhamento 9 → Média 8.6
- Server Actions Normalização: Eficiência 7; Confiabilidade 8; Tempo 7; Integridade 8; Alinhamento 9 → Média 7.8
- SSR/ISR: Eficiência 9; Confiabilidade 9; Tempo 9; Integridade 9; Alinhamento 9 → Média 9.0
- Client Components: Eficiência 8; Confiabilidade 9; Tempo 9; Integridade 9; Alinhamento 9 → Média 8.8
- Invalidação/Revalidação: Eficiência 8; Confiabilidade 7; Tempo 8; Integridade 8; Alinhamento 9 → Média 8.0
- Observabilidade/Métricas: Eficiência 7; Confiabilidade 8; Tempo 9; Integridade 8; Alinhamento 8 → Média 8.0

## Diagrama de Interdependências
```
[ETL Materialize]
   |
   v
[Cache Sources Resolver (cache-sources.ts)]
   |
   v
[CacheService.getFromSources]
   |
   v
[Server Actions (data-actions.ts)]
   |
   v
[SSR/ISR Pages]
   |
   v
[Client Components]

[Invalidate (cache-actions.ts)] ---> [revalidateTag] ---> [SSR/ISR Pages]
              |
              v
       [CacheService.clear]

[Observabilidade] <--- [CacheService.getStats]
```

## Gargalos e Pontos de Melhoria
- Normalização em arrays grandes nas Server Actions (`data-actions.ts:173-236,253-520`): otimizar caminhos críticos (ordenar/paginar antes, limitar `pageSize`).
- Memória do processo em `CacheService` com entradas muito grandes (`cache-service.ts:101-152,251-278`): avaliar thresholds e streaming onde aplicável.
- Ausência de exportação de métricas para painel: conectar `getStats` a uma página interna/endpoint de diagnóstico.
- Tags de revalidação: garantir cobertura de todas as rotas que exibem dados correlatos (ver `_cached-loaders.ts:14-36` tags).

## Relatório Consolidado
- Média geral de desempenho: 8.4
- Melhor desempenho: SSR/ISR (9.0), seguido por Cache Sources e Client Components (8.8).
- Pior desempenho: Server Actions de normalização (7.8).
- Recomendações prioritárias:
  - Limitar `pageSize` padrão e mover paginação/ordenação para paths mais eficientes nas Server Actions.
  - Ajustar `CacheService` para não armazenar entradas acima de um limiar mais conservador e logar avisos (já há mecanismo em `cache-service.ts:118-127`).
  - Adicionar página interna de métricas consumindo `getCacheStats` (para inspeção rápida por chave).
  - Revisar e documentar tags por rota, e criar utilitário único de invalidação por domínio de dados.

## Observações Finais
- O método único (Server Actions + ETL caches) está coerente e elimina redundâncias; a performance observada tende a ser estável e previsível.
- A sustentação de longo prazo depende de disciplina nas Server Actions (limites de `pageSize`, filtros eficientes) e operação do ETL.
