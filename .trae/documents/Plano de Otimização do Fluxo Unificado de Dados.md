## Objetivo
Elevar a performance em cada etapa do fluxo unificado (ETL → Cache Sources → CacheService → Server Actions → SSR/ISR → Client Components → Invalidação/Revalidação → Observabilidade) mantendo a metodologia única via Server Actions, com metas claras de latência, throughput, uso de memória e integridade dos dados.

## Metas de Desempenho
- Latência Server Actions: P50 ≤ 150 ms, P95 ≤ 300 ms por rota principal
- Hit rate do CacheService: ≥ 85% em produção
- Payload por página SSR: ≤ 300 KB por resposta
- Uso de memória do CacheService: ≤ 50 MB (com alertas acima de 40 MB)
- Revalidação (ISR) previsível: janelas ≤ 1h em páginas de dados semi-estáticos

## Otimizações por Etapa

### ETL Materialize
- Reduzir payloads com estruturas enxutas por domínio (somente campos necessários para o frontend atual)
- Introduzir pré-agregações críticas (ex.: somatórios por ano/categoria) para minimizar computação em Server Actions
- Manifests consistentes e indexação por chave para leitura rápida
- Validações de schema e consistência (Pydantic) antes de publicar caches
- Ações: consolidar caches por página; garantir `caches-manifest.json` atualizado

### Cache Sources Resolver
- Manter leitura exclusiva do ETL (env `ETL_OUTPUT_DIR` e caminho canônico) e resolver aliases canônicos
- Medir e registrar latência e tamanho por cache para priorização de otimizações
- Ações: revisar cobertura de aliases, alinhar nomes canônicos e garantir fallback apenas entre diretórios ETL

### CacheService
- Aplicar limiar mais conservador para armazenamento em memória por entrada (ex.: 6–8 MB)
- Implementar política simples de evicção (LRU leve) quando `getMemoryUsage()` indicar > 50 MB
- Consolidar métricas: hits/misses, latência, tamanho e última fonte por chave
- Alertas de memória e entradas grandes; bypass em dev já suportado
- Ações: garantir TTLs adequados a cada domínio, expor utilitários de estatísticas por chave

### Server Actions
- Limitar `pageSize` padrão (ex.: 50) e validar filtros com `zod` em todas as actions
- Ordenar/paginar antes de computações pesadas; evitar mapeamentos/filters redundantes
- Preparar props mínimos para SSR (evitar campos não exibidos)
- Separar ações por domínio (lista/detalhe) e usar invariantes claras
- Ações: refatorar pontos de filtragem/ordenação críticos, introduzir deduplicação quando aplicável

### SSR/ISR
- Definir `revalidate` consistente por página; usar tags específicas por domínio de dados
- Reduzir tamanho de props e evitar serialização desnecessária
- Suspense e boundaries de erro em páginas críticas
- Ações: auditar páginas para props enxutos e revalidate previsível

### Client Components
- Consumir apenas props vindas do SSR; nenhum fetch de dados
- Virtualizar listas longas quando necessário; limitar re-renderizações
- Ações: revisar componentes que mapeiam listas grandes; aplicar memoização leve quando útil

### Invalidação/Revalidação
- Usar `invalidateCache` + `revalidateTag(key, 'max')` para domínios de dados
- Garantir que todas as páginas relacionadas usem tags corretas (`_cached-loaders.ts`)
- Ações: criar utilitário único de invalidação por domínio (fornecedores/deputados/analyses/premiações) e cobertura de tags

### Observabilidade/Métricas
- Expor página interna de métricas (consumindo `getCacheStats`) para auditoria rápida
- Registrar tempos em pontos críticos nas Server Actions
- Ações: coletar amostras de P50/P95 por rota; acompanhar hit rate e tamanho médio por chave de cache

## Diagrama Alvo
```
[ETL Materialize]
   |
   v
[Cache Sources Resolver]
   |
   v
[CacheService (TTL + métricas + memória)]
   |
   v
[Server Actions (filtros/ordenação/paginação/normalização)]
   |
   v
[SSR/ISR (props mínimos + tags)]
   |
   v
[Client Components]

[Invalidate] -> [revalidateTag] -> [SSR/ISR]
[Observabilidade] <- [CacheService.getStats] & [Server Actions timings]
```

## Critérios de Aceitação
- Metas de latência atendidas (P50/P95 por rota principal)
- Hit rate ≥ 85% e memória ≤ 50 MB com alertas acima de 40 MB
- Payloads por página ≤ 300 KB
- Nenhum fetch de dados no cliente; somente Server Actions
- Integridade dos dados (validação `zod` nas entradas das actions; schema ETL consistente)

## Plano de Validação
- Benchmarks de Server Actions com payloads reais (medir P50/P95)
- Auditoria do CacheService: tamanho por entrada, total em memória e hit/miss por chave
- E2E nas páginas principais (fornecedores, deputados, perfil, premiações)
- Testes de invalidação por domínio (garantir revalidação previsível)

## Cronograma Sugerido
- Semana 1: ajustes ETL e CacheService (limiares/tags/aliases), auditoria de páginas SSR
- Semana 2: refino Server Actions (limites, ordenação/paginação), criação de página de métricas
- Semana 3: validação de performance e ajustes finais (observabilidade e tuning)

## Riscos & Mitigação
- Caches grandes impactando memória: evicção LRU e limites por entrada
- Revalidações incompletas: padronização de tags e utilitário de invalidação por domínio
- Regressões de dados: testes de integração com `zod` e snapshots por domínio
