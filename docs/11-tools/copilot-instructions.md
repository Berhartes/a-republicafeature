# GitHub Copilot Instructions - A República Brasileira

## Project Overview

**A República Brasileira** is a transparency platform monitoring Brazilian Congressional expenses (Câmara dos Deputados). The system uses a complete ETL pipeline processing official government data into structured caches consumed by a Next.js 14 frontend.

**Architecture**: Monorepo with 4 packages - Python ETL backend, Next.js frontend, shared utilities, and an Express API that serves the same processed datasets.

## Critical Architecture Concepts

### 1. **Hybrid ETL: Python + TypeScript**
- **Python (`packages/etlpython/`)**: Extracts raw data from Câmara API → materializes datasets under `bancoDados/`
- **TypeScript (`packages/api/`)**: Serves read-only endpoints backed by `bancoDados/monitordespesas/monitordespesas.db`
- **Data flow**: `Câmara API → bancoDados/congressoNacional/ → bancoDados/monitordespesas/ → (a) packages/api/src/services via SQLite (b) packages/monitor-despesas-next/public/cache/`

**Never generate mock data in production**. The system uses real data from 95 deputies with R$ 88.8M in tracked expenses.

### 2. **Cache-First Frontend Architecture**
All data loading follows this pattern:
```typescript
// 1. Check manifest for cache metadata
const manifest = await fetchManifest()
// 2. Load specific cache file
const data = await fetchDeputiesCache(manifest)
// 3. Apply optional compression (gzip/brotli)
const compressed = await fetchWithCompression('/cache/file.json.gz')
```

**6 core cache types** (see `packages/monitor-despesas-next/src/data-access/monitordespesas.ts`):
- `deputies-cache.json` - All deputies with aggregated stats
- `rankings-cache.json` - Pre-computed rankings by category
- `suppliers-cache.json` - Consolidated supplier data
- `premiacoes-cache.json` - Awards/achievements system
- `transacoes-cache.json` - Transaction details
- `categorias-cache.json` - Category aggregations

### 3. **Service Layer Pattern**
Services are singletons exporting class instances:
```typescript
export class EtlCacheService {
  private cache: Map<string, any> = new Map()
  // ... methods
}
export const etlCacheService = new EtlCacheService()
```

**Key services**:
- `etl-cache.service.ts` - Core data loading (1789 lines, most critical)
- `fornecedores-data.service.ts` - Supplier filtering/aggregation
- `categoria-*.service.ts` - Category-specific business logic

**Import pattern**: Use `@/` path alias for all internal imports (configured in `tsconfig.json`).

### 4. **Real Data Integration Rules**
The codebase eliminated all `Math.random()` and mock generators from production code. When implementing features:
- ✅ Load from ETL caches via `etl-cache.service.ts`
- ✅ Use deterministic IDs (hash content, don't use random UUIDs)
- ✅ Implement graceful fallbacks (empty state, not fake data)
- ❌ Never use `generateMock*()` functions outside tests

**Observability**: The system includes a complete monitoring dashboard at `/gastos/configuracoes` showing ETL health, cache status, and data quality metrics.

## Development Workflows

### Build & Run Commands (pnpm workspace)
```bash
# Frontend dev server
pnpm dev:monitor              # Next.js dev mode with Turbo

# Full workspace
pnpm dev                      # Run all packages in parallel
pnpm build                    # Build all packages
pnpm type-check               # TypeScript validation (zero errors required)
pnpm lint:fix                 # ESLint auto-fix

# ETL operations (Windows PowerShell)
cd packages/etlpython
pnpm run etl:despesasdeputados:pc -- 57 10          # Extract raw data for 10 deputies
pnpm run etl:materialize:unified -- --cache-output ..\monitor-despesas-next\public\cache
cd ../..                                            # Return to repo root
```

### Key Files for Changes
- **Adding a page**: `packages/monitor-despesas-next/src/pages/gastos/[name].tsx`
- **New service**: `packages/monitor-despesas-next/src/services/[feature].service.ts`
- **Cache integration**: Always go through `etl-cache.service.ts`, never direct fetch
- **Types**: `src/types/etl-deputados.types.ts` for ETL schemas

### Testing & Validation
```bash
pnpm type-check              # Must pass before any commit
pnpm test                    # Run Vitest tests
pnpm format:check            # Prettier validation
```

**Pre-commit hooks** (Husky + lint-staged) enforce linting and formatting.

## Project-Specific Conventions

### Naming Patterns
- **Services**: `[feature]-[entity].service.ts` → `categoria-alertas.service.ts`
- **Hooks**: `use[Feature][Entity]Data.ts` → `usePerfilFornecedorData.ts`
- **Components**: PascalCase + feature folders → `components/fornecedores/FornecedorCard.tsx`
- **Pages**: Kebab-case routes → `/gastos/perfil-modular/[deputadoId]`

### State Management
- **Server state**: Server Actions + React cache (`readMaterializeCache`) abastecem os Server Components
- **Client UI state**: Contextos leves (`UIStateContext.tsx`) e hooks especializados para filtros/tema
- **Workloads pesados**: Web Workers (`data-processor.worker.ts`) somente para cálculos locais

### TypeScript Patterns
```typescript
// Strict mode enabled - handle all nulls/undefined explicitly
const deputado = deputies.find(d => d.id === id)
if (!deputado) {
  throw new Error(`Deputado ${id} não encontrado`)
}

// Use branded types for IDs when possible
type DeputadoId = string & { readonly brand: unique symbol }
```

### Category System (18 categories)
Categories use normalized names (`PASSAGENS_AEREAS`) + display names ("Passagens Aéreas"). See `src/lib/categorias.ts` for registry. Always normalize via `CategoryRegistry.normalizar()` before comparisons.

### Lazy Loading Strategy
Heavy components use React.lazy + Suspense:
```typescript
const PremiacoesPage = lazy(() => import('@/client/pages/PremiacoesPageModular'))
```
See `utils/lazy-imports.ts` for centralized lazy imports.

## External Dependencies & APIs

### Official Data Sources
- **Câmara API**: `https://dadosabertos.camara.leg.br/api/v2/`
- **Rate limiting**: 50 req/min (handled in Python ETL)
- **Legislature 57** (current): 2023-2027

- **Next.js 16 (App Router)**: Server Components + Server Actions em `src/app`
- **Radix UI**: Accessible component primitives
- **Recharts**: Data visualization (no D3)
- **date-fns**: Date manipulation (not moment.js)
- **Vitest + Testing Library**: Testes unitários e de UI

### Storage & Caching
- **Materialized JSON**: `/public/cache/` com caches gerados pelo ETL
- **Server cache**: `React.cache()` + ISR (`revalidate = 3600`) configurado nas páginas
- **Client storage**: Preferências leves (tema, filtros) em `localStorage`

## Common Pitfalls

1. **Não faça fetch direto no cliente**: Sempre use Server Actions de `app/gastos/actions/data-actions.ts` para acessar caches.

2. **Category normalization**: Always use `CategoryRegistry.normalizar(categoria)` - raw API strings vary.

3. **Fallback hierarchy**: `ETL cache → Context global → Empty state` (never mock data).

4. **TypeScript errors are blocking**: The codebase maintains zero type errors. Fix before committing.

5. **CNPJ handling**: Suppliers use CNPJ (14 digits) as primary key. Handle missing CNPJs gracefully (some suppliers only have names).

6. **Performance**: Check bundle size impact with `pnpm analyze` before adding heavy libraries.

## Quick Reference

**Documentation hub**: `docs/etldocs/README.md` + `ESTADO-ATUAL-PROJETO.md` for current status

**Component inventory**: `MAPEAMENTO_PROJETO.md` lists all 130+ components and 23 pages

**ETL troubleshooting**: See `docs/etldocs/GUIA-RAPIDO-3-PASSOS.md` for pipeline debugging

**Real data progress**: `PROGRESSO-MIGRACAO-DADOS-REAIS.md` tracks mock elimination

---

When in doubt, prioritize **real data integration** over quick fixes with mock data, and always check `ESTADO-ATUAL-PROJETO.md` for the latest system status.
