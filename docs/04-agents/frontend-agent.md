# Frontend Agent Playbook

Focus: Next.js 16 (App Router) application em `packages/monitor-despesas-next/` que consome caches materializados via Server Actions, expondo analytics de forma performática e consistente.

## Core Responsibilities

- Integrar novas features seguindo o padrão Server Action → Server Component → Client Component.
- Manter componentes em `src/app/gastos/**` (Server + Client) observando limites de tamanho e lazy loading.
- Garantir que as Server Actions em `app/gastos/actions/data-actions.ts` reflitam o layout real dos caches materializados.
- Monitor bundle health when adding heavy visualizations or dependencies.

## Key Paths

- `src/app/gastos/actions/data-actions.ts` - fonte única de acesso aos caches via Server Actions (React cache).
- `src/app/gastos/**/page.tsx` - Server Components (render) e `*Client.tsx` - Client Components (UI).
- `src/hooks/**` - hooks de UI/UX (sem fetch de dados).
- `public/cache/` - caches JSON entregues pelo ETL.
- `public/cache/` - static cache files delivered with the build.

## Command Checklist (PowerShell)

```pwsh
cd packages/monitor-despesas-next
pnpm install                        # only if deps changed
pnpm lint
pnpm type-check
pnpm test
pnpm dev                            # local development
pnpm build                          # verify production build
pnpm analyze                        # optional bundle inspection
cd ../..
```

When caches change, ensure `NEXT_PUBLIC_*` environment variables still resolve paths correctly (`NEXT_PUBLIC_CACHE_BASE_URL`, etc.).

For smoke testing against the local API, run the dev server alongside `pnpm dev:monitor`:

```pwsh
pnpm dev:backend
# in another terminal
pnpm dev:monitor
```

Todos os dados fluem: **ETL → `public/cache` → Server Actions → Server Component → Client Component**.

## Integration Pattern

```tsx
// Server Component (page.tsx)
export default async function DeputadosPage({ searchParams }) {
  const { deputados, total } = await getDeputados(searchParams)
  return <DeputadosPageClient deputadosPaginados={deputados} totalDeputados={total} />
}

// Client Component recebe dados prontos e mantém estado de UI
export function DeputadosPageClient({ deputadosPaginados }) {
  const [isPending, startTransition] = useTransition()
  // ... filtros e interações de UI
}
```

Nunca faça `fetch` direto para arquivos JSON no cliente; use apenas Server Actions.

## Validation Steps

1. Confirm new UI reads from real caches by inspecting network tab or logging the cache source (`network` vs `cache`).
2. Verifique regressões em hooks/contextos locais (UIStateContext, useOptimizedFilters); nenhum dado deve depender de stores externos.
3. Review `pnpm type-check` output; zero TypeScript errors are tolerated.
4. Run key scenarios manually: `/gastos/deputados`, `/gastos/fornecedores`, `/gastos/configuracoes`.
5. If bundle size grows, capture `pnpm analyze` output and document the impact.

Optional automated checks:

```pwsh
pnpm test --run                          # ensure vitest suite passes in CI mode
pnpm lint --max-warnings=0               # confirm no new warnings slipped in
node scripts/lighthouse-analysis.js      # run stored performance audit (if modified)
```

## Guardrails

- Never import `generateMock*` utilities in production code; fall back to empty states.
- Use `CategoryRegistry.normalizar` before comparing category strings.
- Prefer deterministic IDs (hashes) instead of `Math.random`; check existing helpers like `generateDeterministicId`.
- Maintain SSR safety: guard browser-only APIs behind `typeof window !== 'undefined'`.
- Update `MAPEAMENTO_PROJETO.md` when introducing new pages or major components.

## Handoff Notes

Include in your summary:
- Components/services touched and the caches they rely on.
- Test and build commands executed with results.
- Visual or UX follow-ups for design review.
- Any required API or ETL updates uncovered during work.
