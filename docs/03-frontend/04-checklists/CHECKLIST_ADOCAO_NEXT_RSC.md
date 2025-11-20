# Checklist de Adoção — Next.js + React Server Components

Use este checklist para aplicar as melhores práticas por etapas nas rotas principais.

## Base
- [ ] Adicionar `loading.tsx` e `error.tsx` na raiz e nas rotas críticas.
- [ ] Adicionar `not-found.tsx` na raiz e segmentos relevantes.
- [ ] Configurar `.env.local` com `NEXT_PUBLIC_SITE_URL` válido.

## Dados e Cache
- [ ] Centralizar acesso em Server Actions lendo caches ETL.
- [ ] Padronizar `fetch` com `{ next: { revalidate: 3600 } }` onde for estático.
- [ ] Integrar `manifest.json` no CDN para versionamento e invalidação previsível.

## Server/Client Boundaries
- [ ] Priorizar Server Components; isolar Client Components com `use client` só para interatividade.
- [ ] Evitar padrões amplos (glob/enumeração) em código analisado pelo bundler.

## Observabilidade
- [ ] Usar `src/lib/logger.ts` para logs com namespace e níveis.
- [ ] Criar `src/instrumentation.ts` para inicialização de métricas e traces, se aplicável.

## Testes
- [ ] Adicionar testes de integração para Server Actions de dados.
- [ ] Adicionar E2E para `/gastos/fornecedores` (carregamento, busca, filtros).

## Performance
- [ ] `next/image` com `sizes` corretos em páginas com imagens.
- [ ] Virtualização em listas longas quando necessário.
