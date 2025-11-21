# Guia de Implementação – Ranking de Premiações

## Objetivo
Gerar automaticamente `premiacoes-cache.json` no mesmo ciclo em que `deputados.json` e `fornecedores.json` são produzidos pela ETL da Câmara.

## Escopo dos Prêmios
- **Coroas (fundo rosa)**: campeão histórico geral + por categoria + campeão histórico por UF.
- **Troféus (fundo azul)**: campeão anual por categoria e por UF.
- **Medalhas**: descontinuadas.

## Fluxo Alvo
1. `CamaraDataProcessor` consolida despesas e monta `deputados_resumo`.
2. `CongressoDataWriter` salva `deputados.json`/`fornecedores.json`.
3. **Novo passo**: reutilizar os dados carregados para calcular as premiações e gravar `premiacoes-cache.json` em `bancoDados/monitordespesas/congressoNacional/`.
4. O frontend lê somente esse cache (sem mocks).

## Estrutura do Cache
```json
{
  "premiacoes": {
    "coroas": [{ ... }],
    "trofeus": [{ ... }]
  },
  "metadata": {
    "anosDisponiveis": [2021, 2022, 2023],
    "categoriasDisponiveis": ["Geral", "Alimentação", ...],
    "ufsDisponiveis": ["AC", "AL", ...],
    "lastUpdate": "2025-11-10T00:00:00Z",
    "totalPremiacoes": 42
  }
}
```

Cada entrada precisa dos campos: `premio` (coroa/trofeu), `tipo` (categoria/estado), `categoria` ou `uf`, `ano` (para troféus), `id`, `nome`, `siglaPartido`, `siglaUf`, `total`.

## Passos Técnicos
1. **Coleta de métricas**: extender `BaseDataProcessor` para armazenar `gastos_por_ano`, `gastos_por_categoria` e `gastos_por_ano_categoria` por deputado.
2. **Builder reutilizável**: criar `etlpython.services.premiacoes_builder` para transformar `deputados_resumo + stats` em coroas/troféus + metadata.
3. **Integração**: após `writer.write_legisladores_resumo`, invocar o builder e chamar `writer.write_premiacoes`.
4. **Manifest/artefatos**: registrar o novo arquivo para auditoria/telemetria.
5. **Testes**: cobrir o builder com cenários simples garantindo campeões corretos por categoria/UF/ano.
6. **Frontend**: `/gastos/premiacoes` continua só lendo o cache (sem necessidade de mocks).

## Considerações Futuras
- Persistir histórico de geração para comparar campeões ao longo do tempo.
- Adicionar métricas extras (maior crescimento, maior número de fornecedores).
- Possibilitar geração incremental caso novos dados de um ano específico sejam importados isoladamente.
