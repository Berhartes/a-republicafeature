# Guia de Melhores Práticas — Next.js + React Server Components

Este guia define padrões práticos para arredondar o projeto com Next.js (App Router) e React Server Components (RSC), alinhados ao monorepo pnpm e ao pipeline de dados Python ETL.

## Objetivos

- Reduzir JavaScript enviado ao cliente, priorizando Server Components.
- Centralizar acesso a dados via APIs/Server Actions, sem padrões amplos no build.
- Definir caching, revalidação e versionamento de dados claros (tags e manifest).
- Melhorar segurança, observabilidade e DX (developer experience) no monorepo.

## Arquitetura e Estrutura

- `src/app`: rotas App Router, `layout.tsx`, `page.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- `src/components`: componentes compartilhados; “ilhas” client com `use client` apenas quando necessário.
- `src/lib`: utilitários e gateways de dados (mappers, validação, fetchers).
- `src/server`: Server Actions e serviços com acesso a `fs`, secrets e ETL.
- `src/app/api`: Route Handlers (`GET/POST`) com `runtime = 'nodejs'` para I/O.
- `packages/shared`: tipos e contratos compartilhados entre apps no monorepo.

## Server vs Client Components

- Server por padrão: componentes `async` que carregam dados e retornam props serializáveis.
- Client apenas para interatividade (eventos, estado reativo, gráficos, mapas, inputs complexos).
- Encapsule Client Components em “ilhas” pequenas; minimize `useEffect` e estados globais.
- Não passe funções/instâncias não-serializáveis entre server/client; use IDs e dados puros.

## Data Fetching e Cache

- `fetch` com política explícita:
  - Estático: `fetch(url, { next: { revalidate: 3600 } })`.
  - Dinâmico: `fetch(url, { cache: 'no-store' })` ou `export const dynamic = 'force-dynamic'` no segmento.
  - Tagueado: use `next/cache` com `revalidateTag('caches:fornecedores')` após mutações.
- Revalidação granular:
  - `revalidatePath('/gastos/fornecedores')` ao atualizar filtros/server-side state.
  - Prefira `revalidateTag` quando várias páginas dependem dos mesmos dados.
- Evite ler `public/` no build: consuma arquivos estáticos via HTTP em runtime (ex.: `fetch('/cache/name.json')`).
- Manifesto de dados: publique `manifest.json` com nomes, versões e timestamps para invalidar com previsibilidade.

## APIs e Server Actions

- Route Handlers em `src/app/api/.../route.ts`:
  - Defina `export const runtime = 'nodejs'` para qualquer I/O.
  - Padronize respostas com `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
  - Evite padrões amplos: nada de glob/enumeração volumosa em código analisado pelo bundler.
- Server Actions:
  - Use para mutações seguras e acesso a secrets.
  - Valide entrada com `zod`/`valibot`; sanitize sempre.
  - Revalide com `revalidatePath`/`revalidateTag` após mutações.

## Integração com CDN e Compressão

- Suporte a `.json`, `.json.br` e `.json.gz` no CDN.
- Descompressão transparente no servidor antes de responder ao cliente.
- Mantenha cabeçalhos consistentes: `Content-Type: application/json; charset=utf-8`.
- Corrija `CACHE_CDN_BASE` para um endpoint válido (evite 404); considere GitHub Pages/Releases.

## Performance

- Streaming e Suspense: use `loading.tsx` e `Suspense` para dividir dependências pesadas de dados.
- Imagens e fontes: `next/image` com `sizes` adequados; `next/font` para evitar FOUT/FOIT.
- Reduza JS no cliente: prefira Server Components e evite estados desnecessários.
- Virtualização: listas longas com react-virtualized/react-window quando necessário.

## Segurança

- Validação de entrada consistente nas APIs e Actions (`zod`).
- Segregação de variáveis de ambiente:
  - Públicas: prefixo `NEXT_PUBLIC_*`.
  - Segredos: apenas no servidor (nunca em Client Components).
- Rate limiting básico em rotas sensíveis.
- Headers e CORS: defina `Content-Type`, `Cache-Control`, `ETag/Last-Modified` quando aplicável; evite CORS amplo.

## Observabilidade

- `src/instrumentation.ts`: configure logs, métricas e traces (OpenTelemetry quando aplicável).
- Logger central com níveis (`debug/info/warn/error`) e contexto por rota.
- Tratamento de erros:
  - `error.tsx` por segmento; `global-error.tsx` como fallback.
  - Alertas para falhas em APIs/Actions com correlação de requests.

## Monorepo e DX (pnpm)

- Scripts por pacote: `dev`, `build`, `test`, `lint`, `typecheck`.
- Tipos e contratos em `packages/shared`; evite duplicação.
- Referências TS para builds rápidos; `tsconfig.base.json` como base.
- Qualidade: husky + lint-staged para lint/format em pre-commit.

## Testes

- Unitários: utilitários e transformações em `src/lib`.
- Integração: Route Handlers e Server Actions com mocks de `fetch`/respostas.
- E2E: Playwright/Cypress para fluxos críticos (`/gastos/fornecedores`).
- Contratos de dados: testes validando schema e versão do `manifest`.

## Deploy e Configuração

- Ambientes: `development`, `preview`, `production` com `.env` específico.
- Variáveis principais:
  - `NEXT_PUBLIC_SITE_URL` para compor URLs client-side.
  - `CACHE_CDN_BASE` apontando para a base do CDN.
- Vercel/Turbopack: sem padrões amplos, logs limpos e cache control definido. Use `vercel.json` para headers por rota quando necessário.

## Checklist Acionável

1. Padronizar `fetch` com `revalidate`/tags e remover `no-store` onde não necessário.
2. Consolidar acesso a cache em `/api/cache/[name]` com allowlist e compressão.
3. Configurar `.env.local` com `NEXT_PUBLIC_SITE_URL` e `CACHE_CDN_BASE` válidos.
4. Adicionar `loading.tsx`, `error.tsx` e `not-found.tsx` nas rotas principais.
5. Introduzir `src/instrumentation.ts` e um logger central.
6. Criar testes E2E para `/gastos/fornecedores` (Server Actions) e páginas relacionadas.
7. Publicar `manifest.json` no CDN e integrar revalidação por tag.

## Notas sobre Implementações Já Feitas

- Fluxo unificado: Server Actions lendo caches ETL local com métricas e TTL.
- `readMaterializeCache` refatorado para usar a API em vez de ler `public/cache` direto, reduzindo avisos do Turbopack.
- Correção de imports/escopo em `FornecedoresPageClient` para build estável.

## Como Começar Agora

- Adicionar `.env.local` em `packages/monitor-despesas-next` com:
  - `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Removido `CACHE_CDN_BASE`; não há dependência de CDN nas páginas.
- Validar que páginas SSR carregam dados via Server Actions corretamente.
- Evoluir logs para um logger central e adicionar `loading.tsx`/`error.tsx` nas rotas principais.
