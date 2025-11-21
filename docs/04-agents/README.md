# Multi-Agent Coordination Guide

This folder contains role-specific playbooks for AI agents working on the **A Republica Brasileira** monorepo. Always read `docs/tools/copilot-instructions.md` first for the global architecture, then follow the guide that matches your assignment.

## Roles

- `frontend-agent.md` - Next.js 14 interface and cache consumers.
- `api-agent.md` - Express + SQLite API that mirrors ETL datasets.
- `etl-agent.md` - Python ETL pipeline responsible for materializing datasets under `bancoDados/`.

## Shared Expectations

1. **Data integrity** - no mock data in production. Validate output using real Camara API data and existing caches.
2. **Command hygiene** - run `pnpm type-check`, `pnpm test`, and package-specific build steps after changes. Record the result in your summary.
3. **Status awareness** - consult `ESTADO-ATUAL-PROJETO.md` before large edits; it lists experimental services and pending migrations.
4. **Documentation updates** - if you change workflows, update the relevant agent guide and shared docs.
5. **Handoffs** - summarize work done, outstanding issues, and verification steps so the next agent can continue seamlessly.

## Workflow Template

When taking a task:
1. Confirm the latest cache/ETL state (manifest, DB path, data freshness).
2. Apply changes following your role guide.
3. Run required commands and capture output snippets (no raw logs if huge).
4. Update docs or TODOs impacted by the work.
5. Post a structured summary:
   - What changed
   - Validation commands and results
   - Follow-up actions or blockers

---

Need a new agent type? Create another markdown file in this directory and link it here.

## Bootstrapping Agents

Before an agent starts coding:
1. Read `docs/tools/copilot-instructions.md` to understand global architecture, data rules, and workflows.
2. Open the role guide in this folder that matches the assignment (frontend, api, etl, etc.).
3. Record in the session notes that both documents were reviewed.
4. Follow the command checklist from the role guide to set up local context.
5. Only then begin making code or data changes.

If you are orchestrating multiple agents, enforce this order programmatically so every instance loads the shared context before touching the repo.