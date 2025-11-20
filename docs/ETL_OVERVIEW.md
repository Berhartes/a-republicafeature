# 🐍 ETL Python - Visão Geral Completa

> **Sistema de extração, transformação e carga de dados da Câmara dos Deputados**

---

## 📋 O Que Temos Disponível

### ✅ Funcionalidades Implementadas

#### 1. **Extração de Dados (Extract)**
- ✅ API da Câmara dos Deputados
- ✅ Busca de deputados por legislatura
- ✅ Busca de despesas por deputado
- ✅ Filtros por ano (--ano-inicio, --ano-fim)
- ✅ Rate limiting (150ms entre requisições)
- ✅ Tratamento de erros e retry

**Localização:** `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/`

#### 2. **Transformação de Dados (Transform)**
- ✅ Normalização de fornecedores (CNPJ, nome)
- ✅ Agregação de dados por ano
- ✅ Cálculo de rankings e estatísticas
- ✅ Validação com Pydantic models
- ✅ Processamento de categorias de despesas

**Localização:** `packages/etlpython/src/etlpython/transform/`

#### 3. **Materialização de Caches**
- ✅ **materialize_unified_v2.py** - Caches principais com separação por ano
  - suppliers-cache.json (fornecedores)
  - deputies-cache.json (deputados)
  - categories-cache.json (categorias)
  - Compressão gzip automática
  - Hashes SHA256 para validação

- ✅ **materialize_paginated.py** - Transações paginadas
  - Paginação de 100 itens por arquivo
  - Separação por ano
  - Índices otimizados
  - deputy-{id}-transactions-{ano}-page{n}.json
  - supplier-{id}-transactions-{ano}-page{n}.json

**Localização:** `packages/etlpython/src/etlpython/cli/`

#### 4. **Persistência de Dados (Load)**
- ✅ JSON files (datalake)
- ✅ SQLite database (opcional)
- ✅ Compressão gzip
- ✅ Estrutura hierárquica organizada

**Localização:** `packages/etlpython/src/etlpython/load/`

---

## 🚀 Comandos Disponíveis

### Extração de Dados

```powershell
# Processar todos deputados da legislatura 57
cd packages\etlpython
pnpm run etl:despesasdeputados:pc 57

# Processar apenas 10 deputados (para testes)
pnpm run etl:despesasdeputados:pc 57 10

# Processar com filtro de anos
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 10 --ano-inicio 2023 --ano-fim 2024
```

### Materialização de Caches

```powershell
# ⭐ COMANDO PRINCIPAL - Gera todos os caches
pnpm run etl:materialize:all

# Ou individualmente:
# 1. Caches principais (suppliers, deputies, categories)
pnpm run etl:materialize:unified:v2

# 2. Transações paginadas
pnpm run etl:materialize:paginated
```

---

## 📊 Estrutura de Dados Gerada

### Datalake (bancoDados/monitordespesas/)

```
bancoDados/monitordespesas/
├── manifest.json                    # Metadados da extração
├── fornecedores/
│   └── fornecedores.json           # Todos fornecedores consolidados
├── deputados/
│   └── deputados.json              # Sumário de todos deputados
└── deputadosFederais/
    └── {idDeputado}/
        ├── deputado.json           # Dados do deputado
        └── despesas/
            └── {ano}/
                └── despesas.json   # Despesas do ano
```

### Caches Frontend (public/cache/)

```
public/cache/
├── caches-manifest.json            # Índice de todos os caches
├── suppliers-cache.json            # Fornecedores (com anos)
├── suppliers-cache.json.gz         # Versão comprimida
├── deputies-cache.json             # Deputados (com anos)
├── deputies-cache.json.gz          # Versão comprimida
├── categories-cache.json           # Categorias
└── transactions/                   # Transações paginadas
    ├── transactions-manifest.json
    ├── deputy-{id}-transactions-index.json
    └── deputy-{id}-transactions-{ano}-page{n}.json
```

---

## 🎯 Oportunidades de Melhoria (Roadmap)

### 🔴 Prioridade ALTA

#### 1. **Paralelização do ETL** (12 horas)
**Problema:** Processa deputados sequencialmente  
**Solução:** Usar multiprocessing para processar em paralelo

```python
from multiprocessing import Pool

def process_deputy(deputy_id: int) -> Dict:
    # Processar um deputado
    pass

with Pool(processes=4) as pool:
    results = pool.map(process_deputy, deputy_ids)
```

**Impacto:** 4x mais rápido com 4 cores

#### 2. **ETL Incremental** (16 horas)
**Problema:** Re-processa tudo sempre  
**Solução:** Processar apenas dados novos desde última execução

```python
def incremental_etl():
    last_run = load_last_run_timestamp()
    new_data = fetch_data_since(last_run)
    process_data(new_data)
    save_last_run_timestamp(datetime.now())
```

**Impacto:** 90% mais rápido para atualizações

#### 3. **Validação de Dados Aprimorada** (8 horas)
**Problema:** Dados inconsistentes passam  
**Solução:** Validações mais rigorosas com Pydantic

```python
class DespesaApi(BaseModel):
    valor: float = Field(gt=0)  # Maior que 0
    cnpj: str = Field(regex=r'^\d{14}$')  # 14 dígitos
    
    @validator('valor')
    def valor_razoavel(cls, v):
        if v > 1_000_000:
            raise ValueError('Valor suspeito')
        return v
```

**Impacto:** Dados mais confiáveis, menos bugs no frontend

### 🟡 Prioridade MÉDIA

#### 4. **Cache de API Responses** (4 horas)
**Problema:** Re-busca mesmos dados da API  
**Solução:** Cache local de responses

```python
import requests_cache

requests_cache.install_cache('api_cache', expire_after=3600)
response = requests.get(url)  # Cached automaticamente
```

**Impacto:** Menos requisições, ETL mais rápido em re-runs

#### 5. **Compressão Brotli** (4 horas)
**Problema:** Gzip reduz ~70%, mas Brotli pode reduzir ~80%  
**Solução:** Adicionar compressão Brotli aos caches

```python
import brotli

json_str = json.dumps(data, ensure_ascii=False)
compressed = brotli.compress(json_str.encode('utf-8'))
with open(f"{file_path}.br", 'wb') as f:
    f.write(compressed)
```

**Impacto:** ~30% redução adicional de tamanho

#### 6. **Testes Automatizados** (40 horas)
**Problema:** Cobertura de testes baixa  
**Solução:** Aumentar cobertura para > 80%

**Áreas prioritárias:**
- Processadores de dados
- Normalização de fornecedores
- Materialização de caches
- Validações Pydantic

### 🟢 Prioridade BAIXA (Futuro)

#### 7. **Machine Learning para Anomalias** (40 horas)
Detectar padrões suspeitos usando Isolation Forest

#### 8. **Análise de Rede de Relações** (32 horas)
Grafo de relações deputado-fornecedor com NetworkX

#### 9. **Análise Temporal e Tendências** (24 horas)
Previsões com séries temporais (ARIMA)

#### 10. **Expansão para Senado** (80 horas)
Implementar extração de dados do Senado Federal usando arquitetura proposta em `ARCHITECTURE_PROPOSAL.md`

---

## 🏗️ Arquitetura Atual

```
src/etlpython/
├── core/                    # Abstrações base
│   ├── base_models.py      # Modelos abstratos
│   ├── base_client.py      # Cliente API abstrato
│   ├── base_processor.py   # Processador abstrato
│   └── base_writer.py      # Writer abstrato
│
├── sources/                 # Fontes de dados
│   └── congresso_nacional/
│       ├── shared/         # Modelos compartilhados
│       └── camara_deputados/
│           ├── models.py   # Modelos Pydantic
│           ├── client.py   # Cliente da API
│           ├── processor.py # Processamento
│           └── cli.py      # Interface CLI
│
├── transform/              # Transformações
│   └── processors.py
│
├── load/                   # Persistência
│   ├── file_writer.py
│   └── sqlite_writer.py
│
└── cli/                    # Scripts de materialização
    ├── materialize_unified_v2.py
    └── materialize_paginated.py
```

---

## 📈 Métricas Atuais

| Métrica | Valor Atual | Objetivo |
|---------|-------------|----------|
| Tempo de extração (10 deputados) | ~30s | < 15s |
| Tempo de materialização | ~2min | < 1min |
| Tamanho caches (comprimidos) | ~5MB | < 3MB |
| Cobertura de testes | ~20% | > 80% |
| Fornecedores processados | 2,422 | - |
| Deputados processados | 513 | - |

---

## 🛠️ Stack Técnico

- **Python 3.9+**
- **requests** - Cliente HTTP
- **pandas** - Manipulação de dados
- **pydantic** - Validação de dados
- **click** - CLI framework
- **rich** - Formatação de terminal

---

## 📚 Documentação Relacionada

- `docs/01-architecture/GUIA_COMPLETO_CACHES.md` - Sistema de caches detalhado
- `docs/07-planning/OPTIMIZATION_ROADMAP.md` - Roadmap completo de otimizações
- `packages/etlpython/ARCHITECTURE_PROPOSAL.md` - Proposta de arquitetura escalável
- `packages/etlpython/README.md` - README do ETL Python

---

## ✅ Próximos Passos Recomendados

### Esta Semana
1. [ ] Implementar paralelização do ETL (4x mais rápido)
2. [ ] Adicionar cache de API responses
3. [ ] Aumentar cobertura de testes para 40%

### Próximas 2 Semanas
1. [ ] Implementar ETL incremental
2. [ ] Adicionar validações aprimoradas
3. [ ] Compressão Brotli

### Próximo Mês
1. [ ] Testes automatizados (> 60% cobertura)
2. [ ] Documentação de APIs
3. [ ] CI/CD para ETL

---

**Última atualização:** 2025-01-XX  
**Versão:** 1.0.0  
**Responsável:** A República Team