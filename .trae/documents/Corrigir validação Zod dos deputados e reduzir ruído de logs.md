## Diagnóstico
- Avisos do Turbopack por padrões amplos foram resolvidos; resta o erro de Zod em runtime.
- O `deputados-cache.json` está vindo como array na raiz, enquanto o código espera objeto com `deputados` ou `data.deputados`. Resultado: "Expected object, received array".
- Logs repetidos de "CacheService initialized" aumentam o ruído no build.

## Alterações no Schema/Parser
- Atualizar o schema e o parser dos deputados para aceitar múltiplos formatos e normalizar:
  - Em `packages/monitor-despesas-next/src/app/gastos/actions/analytics.ts:20-33`, ajustar `deputiesCacheSchema` para aceitar `z.union([z.array(deputadoItemSchema), z.object({ deputados: z.array(...).optional(), data: z.object({ deputados: z.array(...).optional() }).optional() })])`.
  - Em `packages/monitor-despesas-next/src/app/gastos/actions/analytics.ts:34-42`, atualizar `parseDeputiesCache(payload)` para:
    - Se `payload` é array, retornar `{ deputados: payload }`.
    - Caso contrário, usar `deputados` ou `data.deputados` quando presentes; retornar `{ deputados: [] }` como fallback sem lançar erro.
- Confirmar uso em `packages/monitor-despesas-next/src/app/gastos/actions/_cached-loaders.ts:12-19`, mantendo tipagem compatível.

## Testes
- Adicionar testes unitários cobrindo três formatos válidos:
  - Raiz como array (`[ { ... } ]`).
  - Objeto com `deputados: [...]`.
  - Objeto com `data.deputados: [...]`.
- Local: `packages/monitor-despesas-next/src/services/__tests__/deputies-parse.test.ts`.

## Limpeza de Logs
- Reduzir ruído do `CacheService`:
  - Em `packages/monitor-despesas-next/src/services/cache-service.ts:83-90`, emitir "CacheService initialized" apenas uma vez (guard) ou rebaixar para `debug` em produção.

## Verificação
- Rodar `pnpm -C packages/monitor-despesas-next build`.
- Confirmar ausência do erro de Zod e que rotas compilam normalmente.
- Opcional: verificar visualmente páginas dependentes de deputados (`/gastos/deputados`, perfis, dashboards).