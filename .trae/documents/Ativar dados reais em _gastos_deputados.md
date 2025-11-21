## Visão Geral
- Integrar os dados reais dos deputados no fluxo existente (Server Actions + caches ETL) e exibir valores corretos na UI.
- Remover valores mockados para "Alertas" e "Score" e usar fontes reais quando disponíveis.
- Garantir que o cache de deputados (32 registros) esteja sendo lido do data lake local.

## Diagnóstico
- Página: `packages/monitor-despesas-next/src/app/gastos/deputados/page.tsx:52–60` usa `getDeputados(...)` para SSR e envia ao cliente.
- Cliente: `packages/monitor-despesas-next/src/app/gastos/deputados/DeputadosClient.tsx:126–143` exibe "Total Gasto" a partir de `deputado.totalDespesas`; `40–43` fixa `numAlertas = 0` e `score = 0`.
- Server Action: `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts:283–397` calcula e pagina, carregando via `loadDeputiesCache()`.
- Loader de caches: `packages/monitor-despesas-next/src/app/gastos/actions/_cached-loaders.ts:18–20, 22–28` lê `deputies-cache` e `analysis-cache`.
- Serviço de cache: `packages/monitor-despesas-next/src/services/cache-service.ts:99–116` busca fonte ETL; em dev ignora o cache em memória.
- Fontes ETL: `packages/monitor-despesas-next/src/lib/cache/cache-sources.ts:41–51` procura `ETL_OUTPUT_DIR` e `bancoDados/monitordespesas/congressoNacional/cache` por `deputies-cache.json`/`deputados-cache.json`.

## Ações para Dados Reais
- Configurar a fonte de dados:
  - Definir `ETL_OUTPUT_DIR` para `c:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\cache` (ou garantir que o caminho canônico exista com os JSONs).
  - Validar que `deputies-cache.json` contém 32 deputados e estrutura compatível com `analytics.parseDeputiesCache`.
- Usar dados de análise (se disponíveis):
  - Ler `analysis-cache.json` via `loadAnalysisCache()` para contar alertas por deputado e derivar um score.

## Mudanças de Código
- Tipos compartilhados:
  - `packages/shared/src/types/deputado.ts`: adicionar campos opcionais em `DeputadoResumo` para `alertas?: number` e `scoreSuspeicao?: number`.
- Enriquecimento de Server Action:
  - `packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts`:
    - Em `getDeputados(...)`, carregar `analysis-cache` e criar um mapa `{ id → { alertas, scoreSuspeicao } }`.
    - Ao montar `DeputadoResumo` (linhas `375–394`), incluir `alertas` e `scoreSuspeicao` quando existirem.
- UI de Deputados:
  - `packages/monitor-despesas-next/src/app/gastos/deputados/DeputadosClient.tsx`:
    - Remover constantes `numAlertas` e `score` (`40–43`).
    - Exibir `deputado.alertas` e `deputado.scoreSuspeicao` nos blocos "Alertas" e "Score" (`133–143`).

## Execução
- Instalação e dev:
  - `cd packages/monitor-despesas-next`
  - `npm install`
  - `set ETL_OUTPUT_DIR=c:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\cache`
  - `npm run dev`
- Acesso: abrir `http://localhost:3000/gastos/deputados`.

## Verificação
- Contar cartões: devem exibir 32 quando sem filtros (`stats.total` e o card "Total cadastrados" em `DeputadosClient.tsx:261–263`).
- "Total Gasto": valores > R$ 0,00 com base em `totalDespesas` (calculado em `data-actions.ts:341–349`).
- "Alertas" e "Score": deixam de ser zero e refletem dados do `analysis-cache`.
- Filtragem e paginação: funcionam e atualizam URL (`DeputadosClient.tsx:189–211`).

## Fallbacks e Troubleshooting
- Se "Total Gasto" aparecer zero:
  - Verificar `ETL_OUTPUT_DIR` e presença dos arquivos no caminho canônico (`cache-sources.ts:41–71`).
  - Checar formato dos anos (`data-actions.ts:56–78`) e `totalDespesasRaw` (`121–124`).
- Se "Alertas"/"Score" não existirem nos dados, manter UI com zero ou esconder os blocos até haver definição oficial.

Confirma executar estas mudanças e subir o projeto com os dados reais?