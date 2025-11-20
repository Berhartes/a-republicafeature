# Quick Start: ETL_OUTPUT_DIR + Materialização + Frontend

Este guia ajuda a configurar rapidamente o ambiente para consumir caches diretamente do data lake usando `ETL_OUTPUT_DIR`.

## Passo 1 — Materialização dos dados

- Comando padrão (Windows):

```
cd packages/etlpython
.venv\Scripts\python.exe -m etlpython materialize --legislatura 57
```

- Opcional: materialização incremental por ano

```
.venv\Scripts\python.exe -m etlpython materialize --legislatura 57 --anos 2023,2024 --incremental
```

Os artefatos serão escritos em `bancoDados/monitordespesas/congressoNacional/cache` por padrão (no monorepo).

## Passo 2 — Configurar ETL_OUTPUT_DIR

Defina a variável de ambiente para apontar o diretório de saída dos caches:

```
setx ETL_OUTPUT_DIR "c:\Users\...\a-republica\bancoDados\monitordespesas\congressoNacional\cache"
```

- Em CI: configure `ETL_OUTPUT_DIR` via ambiente do job.
- Em produção: aponte para o bucket/diretório montado com os artefatos publicados.

## Passo 3 — Iniciar o frontend e validar

```
cd packages/monitor-despesas-next
npm run dev
```

- Abra a página de fornecedores (`/gastos/fornecedores`).
- A aplicação lerá `suppliers-cache.json` diretamente do data lake via Server Actions.
- O banner “Fonte de dados” deve indicar `Dados carregados do cache ETL.`

## Conveniência local (opcional)

Para servir os caches estaticamente sem alterar código, crie um symlink:

```
# Windows (PowerShell, executar como admin)
New-Item -ItemType SymbolicLink -Path "packages/monitor-despesas-next/public/cache" -Target "bancoDados/monitordespesas/congressoNacional/cache"
```

Com isso, rotas como `/cache/suppliers-cache.json` continuam funcionando localmente.

## Validação de qualidade

- Rode a validação de estrutura após cada materialização:

```
node scripts/validate-data-structure.mjs
```

- Testes simples no frontend podem verificar:
  - a leitura de `suppliers-cache.json` via Server Actions
  - presença mínima de campos esperados

## Observabilidade e auditoria

- Manifests e logs (ex.: `_etl-run.log.jsonl`, `caches-manifest.json`) vivem no data lake.
- Versione esses artefatos ou publique-os junto dos caches para auditoria.

## CI/CD

- Pipeline dedicado executa `materialize` com `ETL_OUTPUT_DIR` configurado.
- Publica os artefatos do data lake (JSON e manifestos, comprimidos se necessário).
- Agende ingestão/materialização diária quando usar dados reais.