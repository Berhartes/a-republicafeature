# ETL Agent Playbook

Focus: Python pipeline that extracts, transforms, and materializes data from the Camara dos Deputados API into `bancoDados/` and frontend caches.

## Core Responsibilities

- Keep `packages/etlpython/` scripts aligned with the documented three-step flow (extract, transform, load).
- Ensure the data lake layout under `bancoDados/` matches `docs/etldocs/GUIA-RAPIDO-3-PASSOS.md`.
- Regenerate caches and SQLite artifacts consumed by the API and frontend.
- Validate outputs before handing off to other agents.

## Key Paths

- `packages/etlpython/` - Python ETL source.
- `bancoDados/congressoNacional/` - raw extracts (one folder per deputado).
- `bancoDados/monitordespesas/` - processed aggregates + `monitordespesas.db`.
- `packages/monitor-despesas-next/public/cache/` - static caches for the frontend.

## Command Checklist (PowerShell)

```pwsh
cd packages/etlpython
pnpm install                          # only if deps changed
pnpm run etl:despesasdeputados:pc -- 57 10
pnpm run etl:materialize:unified -- --cache-output ..\monitor-despesas-next\public\cache
cd ../..
```

After changes to TypeScript helpers (if any), also run:

```pwsh
pnpm type-check
pnpm test
```

Monitor data lake freshness with the provided scripts when diagnosing issues:

```pwsh
node ..\..\validate-data-structure.js              # Verify folder layout and schemas
python ..\..\validate_performance_testing.py       # Track extraction timing regressions
node ..\..\performance_reports\etl-performance-analysis.js  # Optional historical benchmarking
```

## Validation Steps

1. Inspect `bancoDados/congressoNacional/deputados/*/despesas.json` for fresh timestamps.
2. Confirm `bancoDados/monitordespesas/monitordespesas.db` was regenerated (modified time, schema).
3. Open `bancoDados/monitordespesas/manifest.json` and verify version, record counts, totals.
4. Run `validate-data-structure.js` or `validate_performance_testing.py` if structure changed.
5. Note any anomalies in `ESTADO-ATUAL-PROJETO.md` and alert downstream agents.

## Guardrails

- Never write mock or placeholder data into the data lake.
- Keep file paths portable; use relative paths as shown in the quick-start guides.
- Respect rate limits: adjust `--limit` flag instead of removing throttling.
- When touching experimental scripts, label them clearly in commit summaries and docs.

## Handoff Notes

Provide a summary with:
- Commands executed and whether they passed.
- Location of regenerated artifacts (DB, caches).
- Any rows filtered out or issues encountered with upstream APIs.
- Follow-up tasks for API or frontend agents.
