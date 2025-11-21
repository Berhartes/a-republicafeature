## Objetivo
- Rodar o pipeline de dados completo (ETL → consolidação → materialização de caches) para que os 32 deputados e seus totais/anos cheguem à página `/gastos/deputados` com valores reais.

## Constatações
- O cache atual `bancoDados/monitordespesas/congressoNacional/cache/deputies-cache.json` tem só 5 deputados e todos com `totalDespesas = 0`.
- Há dados reais por-deputado nos arquivos `camaraDeputados/deputadosFederais/idDeputados/<id>/dados_completos.json` (ex.: id 204560 com R$ 1.282.020,17 e 613 despesas).
- O dataset consolidado `camaraDeputados/deputadosFederais/deputados.json` também tem apenas 5 registros, por isso os caches gerados ficam incompletos.

## Plano de Ação
1. Extrair e consolidar os 32 deputados
   - Comando (PowerShell):
     - `cd packages/etlpython`
     - `python src/etlpython/sources/congresso_nacional/camara_deputados/cli.py 57 32 --ano-inicio 2022 --ano-fim 2025 --workers 2 --wait-ms 150`
   - Saídas esperadas:
     - `bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados/<id>/dados_completos.json`
     - `bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/deputados.json` com 32 entradas
     - `bancoDados/monitordespesas/manifest.json` com métricas da execução

2. Materializar caches unificados (com agregações por ano)
   - Script: `packages/etlpython/src/etlpython/cli/materialize_unified_v2.py`
   - Comando (PowerShell):
     - `python packages/etlpython/src/etlpython/cli/materialize_unified_v2.py --suppliers-file bancoDados/monitordespesas/congressoNacional/camaraDeputados/fornecedores.json --deputies-dir bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputadosFederais/idDeputados --output-dir bancoDados/monitordespesas/congressoNacional/cache --anos 2022-2025`
   - Saídas esperadas em `congressoNacional/cache`:
     - `deputies-cache.json` com `metadata.totalDeputados = 32` e cada deputado com `gastosPorAno`, `transacoesPorAno`, `anosDisponiveis`, `totalGastos` > 0
     - `suppliers-cache.json`, `categories-cache.json` e `caches-manifest.json`

3. Configurar o frontend para ler os caches
   - Iniciar o app com `ETL_OUTPUT_DIR` apontando para `bancoDados/monitordespesas/congressoNacional/cache`.
   - Comando (PowerShell):
     - `cd packages/monitor-despesas-next`
     - `$env:ETL_OUTPUT_DIR='c:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\cache'`
     - `npm run dev` (ou `npm run dev:webpack` se preferir webpack)

## Verificação
- Ler `deputies-cache.json` e checar:
  - `metadata.totalDeputados = 32`
  - Cada objeto tem `totalGastos > 0`, `gastosPorAno` e `transacoesPorAno` preenchidos.
- Abrir `http://localhost:3000/gastos/deputados`:
  - Card “Total cadastrados” mostra 32
  - “Média de gastos” e “Total gasto” > R$ 0,00
  - Nos cards individuais, “Total Gasto” e, quando houver, “Alertas”/“Score” aparecem com valores reais.

## Observações e fallback
- Se após a etapa 1 o `deputados.json` continuar com menos de 32 entradas, repetir o comando sem `limit` para processar todo o conjunto:
  - `python src/etlpython/sources/congresso_nacional/camara_deputados/cli.py 57 --ano-inicio 2022 --ano-fim 2025 --workers 2 --wait-ms 150`
- Se preferir gerar caches para `public/cache`, existe o utilitário `packages/etlpython/materialize_caches_only.py`, mas o frontend atual lê do ETL (`congressoNacional/cache`), então manter `--output-dir` apontando para essa pasta.

Posso executar esses passos agora para materializar os dados e ativar o preview com os números corretos?