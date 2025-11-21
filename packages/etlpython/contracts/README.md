# Contratos versionados da API da Câmara

Este diretório armazena snapshots em JSON Schema dos modelos críticos que
utilizamos na fase inicial do fluxo de dados (Fonte → ETL).

## Como gerar/validar

```bash
cd packages/etlpython
PYTHONPATH=src venv/bin/python -m etlpython.contracts_cli export
PYTHONPATH=src venv/bin/python -m etlpython.contracts_cli validate --live
```

> Observação: o ambiente `venv/` precisa conter as dependências listadas em
> `requirements.txt` (`pip install -r requirements.txt`).

Os arquivos gerados seguem o formato:

```json
{
  "model": "DeputadoApi",
  "source": "camara_deputados",
  "generated_at": "2025-02-01T12:00:00Z",
  "schema_hash": "…",
  "schema": { … JSON Schema do Pydantic … }
}
```

Durante o pipeline, basta executar `validate` em CI para detectar quebras de
contrato antes de processar grandes volumes ou publicar novos caches.
