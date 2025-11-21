# Padronização de Dados dos Deputados

## Estrutura dos arquivos

- `bancoDados/monitordespesas/congressoNacional/camaraDeputados/deputados.json` agora inclui os campos:
  - `nomeEleitoral` (obrigatório, com fallback para `nome`)
  - `siglaPartido`
  - `siglaUf`
  - `totalDespesas` e `total_despesas`
  - `numeroDespesas` e `numero_despesas`
- Os arquivos detalhados gravados no ETL passam a garantir `metadata.legislador` como fonte única de metadados, preservando `totalDespesas` e `numeroDespesas` calculados.

## Ordem de resolução para perfis

Quando precisar carregar um perfil, utilize a seguinte ordem de prioridade dentro de `idDeputados/{id}`:

1. `{id}-id{legislatura}-dados_completos.json`
2. `{id}-dados_completos.json`
3. `dados_completos.json`

Todos os arquivos são gravados durante a materialização para manter compatibilidade com código legado.

## Frontend e cache

- O arquivo `packages/monitor-despesas-next/public/cache/deputies-cache.json` foi regenerado com os novos campos (`nomeEleitoral`, `siglaPartido`, `siglaUf`, `totalDespesas`).
- A função `resolveDeputadoData` em `src/data-access/monitordespesas.ts` aplica a ordem de busca acima e normaliza os metadados para garantir que `nomeEleitoral` esteja sempre disponível.
- Componentes e serviços devem utilizar `nomeEleitoral` como campo primário para exibição, com fallback para `nome` apenas em último caso (`getDeputadoDisplayName`).

## API

- A rota `/gastos/deputados/:id` usa o mesmo resolvedor e devolve `resumo.nomeEleitoral` diretamente, mantendo `nome` apenas para compatibilidade.
- A listagem `/gastos/deputados` expõe `nomeEleitoral`, `siglaPartido` e `siglaUf` normalizados.

Manter esta padronização garante que todos os fluxos usem o mesmo nome de exibição e evita divergências entre cache, detalhamento e API.
