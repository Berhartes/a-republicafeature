## Objetivo
Executar melhorias para que cada etapa (ETL → Cache Sources → CacheService → Server Actions → SSR/ISR → Client Components → Invalidação/Revalidação → Observabilidade) entregue sua melhor performance, mantendo o método único via Server Actions.

## Metas Operacionais (KPIs)
- Server Actions: P50 ≤ 150 ms, P95 ≤ 300 ms
- CacheService: hit rate ≥ 85%, uso de memória ≤ 50 MB (alerta ≥ 40 MB)
- SSR payload por página ≤ 300 KB
- Revalidação previsível por rota (≤ 1 h em páginas semi-estáticas)

## Fase 1 — Server Actions
- Padronizar `pageSize` (padrão 50) e validar filtros com `zod`
- Antecipar ordenação/paginação antes de agregações pesadas
- Reduzir props SSR eliminando campos não utilizados
- Entregáveis: funções refinadas em `data-actions.ts`, testes de integração por rota

## Fase 2 — CacheService
- Limiar de armazenamento por entrada (6–8 MB) e alerta de memória ≥ 40 MB
- Evicção simples (LRU) quando uso total > 50 MB
- Expor estatísticas por chave (`getStats`) e utilitário para sumarização
- Entregáveis: ajustes em `cache-service.ts` + testes unitários

## Fase 3 — Tags & Invalidação
- Utilitário de invalidação por domínio (`fornecedores`, `deputados`, `analises`, `premiacoes`)
- Garantir cobertura de tags em `_cached-loaders.ts` e páginas associadas
- Entregáveis: funções em `cache-actions.ts`, revisão de tags e testes

## Fase 4 — Observabilidade
- Página interna de métricas consumindo `getCacheStats` (somente equipe)
- Instrumentar timings nas Server Actions (pontos críticos)
- Entregáveis: página `/monitor/metrics`, registros de tempo e latência por ação

## Fase 5 — ETL
- Confirmar schemas enxutos e pré-agregações necessárias para o frontend
- Atualizar `caches-manifest.json` e validar tamanhos
- Entregáveis: checklist de campos por domínio, validação do manifest

## Validação
- Benchmarks P50/P95 por rota
- Auditoria de memória e hit/miss no CacheService
- E2E em páginas principais (fornecedores, deputados, perfil, premiações)

## Cronograma
- Semana 1: Fase 1 + início Fase 3
- Semana 2: Fase 2 + Fase 4
- Semana 3: Fase 5 + validação geral e ajustes

## Riscos & Mitigação
- Memória alta: evicção LRU e limites por entrada
- Revalidações inconsistentes: padronização de tags por domínio
- Regressões de dados: `zod` em Server Actions e testes de integração

Confirme para iniciar a execução; após aprovação, começarei com Fase 1 (Server Actions).