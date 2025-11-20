## Objetivo
Implementar exclusivamente a metodologia de entrega de dados via Server Actions do Next.js, integrando caches ETL e removendo todas as alternativas (APIs REST, GraphQL, acesso direto a banco), mantendo 100% das funcionalidades atuais com performance igual ou superior.

## Estado Atual (Pontos de Acesso)
- Backend Express: `packages/api/src/server.ts:12-36`, rotas `gastos/*` e SQLite via `better-sqlite3`.
- Next API (cache): `packages/monitor-despesas-next/src/app/api/cache/[name]/route.ts:37-171`, `.../stats/route.ts:7-31`, `.../invalidate/route.ts:11-57`.
- Server Actions existentes: `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts:164-361,580-700` com loaders de cache.
- Caches ETL: `packages/monitor-despesas-next/src/lib/cache/cache-sources.ts:34-74,92-153` e `CacheService` `.../services/cache-service.ts:67-300`.

## Arquitetura Alvo (Única Metodologia)
- Único caminho: Páginas SSR/ISR chamam Server Actions que leem caches ETL via `CacheService` e `cache-sources`.
- Nenhum endpoint HTTP interno para dados; rotas `app/api/*` eliminadas.
- Nenhum consumo do `packages/api`; remoção completa do pacote e dependências.

## Fase 1: Mapeamento e Bloqueio de Vias Alternativas
1. Inventariar todos os usos de acesso a dados fora de Server Actions:
   - Busca por `fetch('/api')`, `axios`, `graphql`, `better-sqlite3`, `cors`, `express`, importações de `app/api/*` e `packages/api`.
2. Definir regra interna: apenas importações de `data-actions.ts` e `cache-sources.ts` são válidas em páginas e componentes.
3. Planejar substituição por Server Actions equivalentes para cada caso de uso:
   - Fornecedores, Deputados, Perfil, Dashboards, Premiações.

## Fase 2: Refatoração para Server Actions
1. Consolidar Server Actions como camada única:
   - `getFornecedores` → `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts:173-236`.
   - `getDeputados`, `getDeputadoById`, `getTransacoesDeputado` → `data-actions.ts:253-520`.
   - `getPremiacoes`/rankings → `data-actions.ts:580-700`.
   - Criar `invalidateCacheAction` e `getCacheStatsAction` substituindo rotas `app/api/cache/*`.
2. Atualizar páginas para chamar apenas Server Actions:
   - Fornecedores: `packages/monitor-despesas-next/src/app/gastos/fornecedores/page.tsx:39-77`.
   - Deputados: `.../gastos/deputados/page.tsx`.
   - Perfil: `.../gastos/perfil/[id]/page.tsx`.
   - Demais páginas: `dashboards`, `analise-avancada`, `premiacoes`.
3. Remover qualquer `fetchJson` cliente para dados e mover lógica para server actions.
4. Garantir validação com `zod` em todas as entradas das actions.

## Fase 3: Integração com Caches ETL
1. Centralizar leitura via `CacheService`: `.../services/cache-service.ts:67-300`.
2. Configurar fontes em `cache-sources.ts:34-74,92-153` e padronizar nomes/paths dos caches ETL `bancoDados/monitordespesas/congressoNacional/cache/*`.
3. Definir TTLs, revalidate tags e políticas de atualização nos componentes SSR.
4. Ajustar `compression.ts` para Brotli correto (remover fallback deflate): `.../utils/compression.ts:98-106`.

## Fase 4: Testes de Integração
1. Testes de páginas SSR consumindo server actions (Playwright/puppeteer) verificando dados renderizados.
2. Testes de servidor: invocar server actions diretamente e validar filtros/ordenação/paginação.
3. Performance:
   - Medir P50/P95 de cada action com payloads reais.
   - Comparar com baseline anterior (Express/Next API).
4. Observabilidade: habilitar métricas do `CacheService` e spans OTEL nas actions.

## Fase 5: Remoção de Legado
1. Remover `packages/api` e referências no workspace (scripts, deps `better-sqlite3`, `cors`).
2. Remover rotas Next `app/api/cache/*` e substituir por actions.
3. Eliminar utilitários HTTP cliente para dados (`fetchJson`) quando não necessários.
4. Limpar dependências e scripts em `package.json` dos pacotes afetados.

## Fase 6: Segurança e Políticas
1. Invalidação de cache apenas via `invalidateCacheAction` com token em env validado por `zod`.
2. Limites de `pageSize` e sanitização de filtros nas actions.
3. Sem CORS/rate-limiting de API, pois não haverá endpoints de dados; foco em proteção de recursos internos.

## Critérios de Aceitação
- 100% dos acessos a dados ocorrem via Server Actions (auditoria por busca de padrões e revisão de importações).
- Nenhum outro método permanece (Express removido, `app/api/*` removido, sem `fetch('/api')/axios/graphql`).
- Performance igual ou superior: P50 <150 ms, P95 <300 ms por action em payloads típicos.
- Todos casos de uso existentes funcionam: fornecedores, deputados, perfil, dashboards, premiações.

## Diagrama de Fluxo Final
```
[Browser]
  |
  v
[Next.js (Server Actions)]
  |-- CacheService (mem) -> cache-sources -> ETL JSON local
  |-- valida/normaliza (zod)
  v
[SSR/ISR] -> props mínimos -> [Client Components]
  |
  v
[Observabilidade] métricas de cache + spans OTEL
[Invalidação] invalidateCacheAction (token)
```

## Verificações e Auditoria
- Busca por padrões proibidos: `fetch('/api')`, `axios`, `graphql`, importações de `app/api/*`, `packages/api`.
- Grep por `better-sqlite3`, `express`, `cors` para confirmar remoção.
- Lista de páginas confirmando chamadas apenas às Server Actions.

## Cronograma Sugerido
- Semana 1: Mapeamento + refatoração inicial de páginas principais.
- Semana 2: Criação/ajuste de actions faltantes + remoção de `app/api/*`.
- Semana 3: Remoção de `packages/api` + testes de integração/performance.
- Semana 4: Observabilidade, hardening e auditoria final.
