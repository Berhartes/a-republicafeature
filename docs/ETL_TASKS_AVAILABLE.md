# 🎯 Tarefas Disponíveis - ETL Python

> **Lista prática de tarefas que podem ser implementadas no ETL**

---

## 🔴 ALTA PRIORIDADE (Impacto Imediato)

### 1. Paralelização do ETL com Rate Limiting Global
**Esforço:** 16 horas | **Impacto:** 2-3x mais rápido (respeitando limites da API)

**Descrição:**
Atualmente o ETL processa deputados sequencialmente. Podemos paralelizar com controle centralizado de rate limiting para respeitar os limites da API da Câmara.

**⚠️ IMPORTANTE - Limites da API:**
- **Limite por requisição:** 100 itens máximo
- **Padrão de retorno:** 15 itens (se não especificar)
- **Rate limiting:** Não documentado oficialmente, mas recomenda-se 150ms entre requisições
- **Paginação:** Obrigatória para grandes conjuntos de dados

**Arquivos a criar:**
- `packages/etlpython/src/etlpython/core/rate_limiter.py`

**Arquivos a modificar:**
- `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/cli.py`
- `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/client.py`
- `packages/etlpython/src/etlpython/core/base_client.py`

**Implementação:**

```python
# core/rate_limiter.py
import time
import threading
from typing import Optional

class GlobalRateLimiter:
    """
    Rate limiter compartilhado entre múltiplos workers.
    Garante que todas as requisições à API respeitam o intervalo mínimo.
    """
    def __init__(self, min_interval_seconds: float = 0.15):
        self.min_interval = min_interval_seconds
        self.last_request_time = 0
        self.lock = threading.Lock()
    
    def wait_if_needed(self):
        """Aguarda se necessário para respeitar o rate limit"""
        with self.lock:
            current_time = time.time()
            time_since_last = current_time - self.last_request_time
            
            if time_since_last < self.min_interval:
                sleep_time = self.min_interval - time_since_last
                time.sleep(sleep_time)
            
            self.last_request_time = time.time()

# Instância global compartilhada
_global_rate_limiter = GlobalRateLimiter(min_interval_seconds=0.15)

def get_rate_limiter() -> GlobalRateLimiter:
    """Retorna a instância global do rate limiter"""
    return _global_rate_limiter
```

```python
# Modificar base_client.py
from ..core.rate_limiter import get_rate_limiter

class BaseApiClient(ABC):
    def __init__(self, base_url: str, wait_ms: int = 150, user_agent: str = "a-republica-etl/0.1"):
        self.base_url = base_url
        self.wait_seconds = wait_ms / 1000.0
        self.rate_limiter = get_rate_limiter()  # ✅ NOVO: Rate limiter global
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": user_agent
        })
    
    def _fetch_json(self, url: str) -> dict:
        """Fetch JSON data from API endpoint with global rate limiting."""
        self.rate_limiter.wait_if_needed()  # ✅ NOVO: Aguarda antes de fazer requisição
        
        try:
            # ... resto do código existente
```

```python
# Modificar cli.py para paralelização
from multiprocessing import Pool
from functools import partial
import os

def process_single_deputy(deputy_id: int, anos: List[int], wait_ms: int = 150) -> Dict:
    """
    Processa um único deputado.
    Cada worker cria seu próprio client, mas todos compartilham o rate limiter global.
    """
    from .client import CamaraApiClient
    from .processor import DeputyProcessor
    
    # Cada worker tem seu próprio client
    client = CamaraApiClient(wait_ms=wait_ms)
    processor = DeputyProcessor(client)
    
    try:
        return processor.process_deputy(deputy_id, anos)
    except Exception as e:
        print(f"❌ Erro ao processar deputado {deputy_id}: {e}")
        return None

def process_deputies_parallel(
    deputy_ids: List[int], 
    anos: List[int], 
    num_workers: int = 3,  # ✅ Conservador: 3 workers
    wait_ms: int = 150
):
    """
    Processa deputados em paralelo com rate limiting global.
    
    Args:
        deputy_ids: Lista de IDs dos deputados
        anos: Anos para processar
        num_workers: Número de workers paralelos (recomendado: 2-4)
        wait_ms: Intervalo mínimo entre requisições em ms
    """
    print(f"🚀 Processando {len(deputy_ids)} deputados com {num_workers} workers")
    print(f"⏱️  Rate limit: {wait_ms}ms entre requisições")
    
    process_func = partial(process_single_deputy, anos=anos, wait_ms=wait_ms)
    
    with Pool(processes=num_workers) as pool:
        results = pool.map(process_func, deputy_ids)
    
    # Filtrar resultados None (erros)
    successful_results = [r for r in results if r is not None]
    
    print(f"✅ Processados: {len(successful_results)}/{len(deputy_ids)}")
    return successful_results
```

**Configuração Recomendada:**
```python
# Para produção (seguro)
num_workers = 3
wait_ms = 150  # 150ms entre requisições

# Para testes (mais agressivo, monitorar bloqueios)
num_workers = 4
wait_ms = 120  # 120ms entre requisições

# Para desenvolvimento (conservador)
num_workers = 2
wait_ms = 200  # 200ms entre requisições
```

**Benefícios:**
- ✅ 2-3x mais rápido (com 3 workers)
- ✅ Respeita rate limiting da API
- ✅ Rate limiter global compartilhado entre workers
- ✅ Evita bloqueios por excesso de requisições
- ✅ Melhor uso de CPU multi-core
- ✅ Configurável para ajustar agressividade

**Riscos Mitigados:**
- ❌ Bloqueio por excesso de requisições → ✅ Rate limiter global
- ❌ Requisições duplicadas → ✅ Cada worker processa deputados diferentes
- ❌ Sobrecarga da API → ✅ Intervalo configurável entre requisições

---

### 2. ETL Incremental
**Esforço:** 16 horas | **Impacto:** 90% mais rápido em atualizações

**Descrição:**
Processar apenas dados novos desde a última execução, em vez de reprocessar tudo.

**Arquivos a criar:**
- `packages/etlpython/src/etlpython/core/incremental.py`

**Arquivos a modificar:**
- `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/cli.py`

**Implementação:**
```python
# core/incremental.py
from datetime import datetime
from pathlib import Path
import json

class IncrementalTracker:
    def __init__(self, state_file: Path):
        self.state_file = state_file
        self.state = self._load_state()
    
    def _load_state(self) -> Dict:
        if self.state_file.exists():
            with open(self.state_file) as f:
                return json.load(f)
        return {"last_run": None, "processed_deputies": {}}
    
    def get_last_run(self) -> Optional[datetime]:
        if self.state["last_run"]:
            return datetime.fromisoformat(self.state["last_run"])
        return None
    
    def mark_deputy_processed(self, deputy_id: int, timestamp: datetime):
        self.state["processed_deputies"][str(deputy_id)] = timestamp.isoformat()
    
    def save(self):
        self.state["last_run"] = datetime.now().isoformat()
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)
```

**Benefícios:**
- ✅ Atualizações diárias em minutos
- ✅ Menos carga na API da Câmara
- ✅ Permite execuções mais frequentes

---

### 3. Validação de Dados Aprimorada
**Esforço:** 8 horas | **Impacto:** Menos bugs, dados mais confiáveis

**Descrição:**
Adicionar validações rigorosas para detectar anomalias e dados inconsistentes.

**Arquivos a modificar:**
- `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/models.py`

**Implementação:**
```python
from pydantic import BaseModel, Field, validator
from typing import Optional

class DespesaApi(BaseModel):
    ano: int = Field(ge=2000, le=2030)
    mes: int = Field(ge=1, le=12)
    valor_documento: float = Field(gt=0)
    valor_liquido: float = Field(ge=0)
    cnpj_cpf_fornecedor: Optional[str] = Field(regex=r'^(\d{11}|\d{14})$')
    
    @validator('valor_documento')
    def valor_razoavel(cls, v):
        if v > 1_000_000:  # Mais de 1 milhão
            raise ValueError(f'Valor suspeito: R$ {v:,.2f}')
        return v
    
    @validator('valor_liquido')
    def liquido_menor_que_documento(cls, v, values):
        if 'valor_documento' in values and v > values['valor_documento']:
            raise ValueError('Valor líquido maior que documento')
        return v
    
    @validator('cnpj_cpf_fornecedor')
    def validar_documento(cls, v):
        if v and not validar_cnpj_cpf(v):
            raise ValueError(f'Documento inválido: {v}')
        return v
```

**Benefícios:**
- ✅ Detecta erros cedo no pipeline
- ✅ Logs detalhados de problemas
- ✅ Dados mais confiáveis no frontend

---

## 🟡 MÉDIA PRIORIDADE (Melhorias Importantes)

### 4. Cache de API Responses
**Esforço:** 4 horas | **Impacto:** Menos requisições, ETL mais rápido

**Descrição:**
Cachear responses da API localmente para evitar requisições duplicadas.

**Arquivos a modificar:**
- `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/client.py`

**Implementação:**
```python
import requests_cache

class CamaraClient:
    def __init__(self, cache_enabled: bool = True):
        if cache_enabled:
            requests_cache.install_cache(
                'camara_api_cache',
                expire_after=3600,  # 1 hora
                backend='sqlite'
            )
        self.session = requests.Session()
```

**Benefícios:**
- ✅ Re-runs muito mais rápidos
- ✅ Respeita rate limits
- ✅ Útil para desenvolvimento

---

### 5. Compressão Brotli
**Esforço:** 4 horas | **Impacto:** 30% redução adicional de tamanho

**Descrição:**
Adicionar compressão Brotli além de gzip para caches ainda menores.

**Arquivos a modificar:**
- `packages/etlpython/src/etlpython/cli/materialize_unified_v2.py`
- `packages/etlpython/src/etlpython/cli/materialize_paginated.py`

**Implementação:**
```python
import brotli

def write_json_compressed(file_path: Path, data: Any):
    # Gzip (compatibilidade)
    with gzip.open(f"{file_path}.gz", 'wt') as f:
        json.dump(data, f)
    
    # Brotli (melhor compressão)
    json_str = json.dumps(data, ensure_ascii=False)
    compressed = brotli.compress(json_str.encode('utf-8'), quality=11)
    with open(f"{file_path}.br", 'wb') as f:
        f.write(compressed)
```

**Benefícios:**
- ✅ Caches ~30% menores
- ✅ Menos banda consumida
- ✅ Carregamento mais rápido

---

### 6. Logging Estruturado
**Esforço:** 6 horas | **Impacto:** Melhor debugging e monitoramento

**Descrição:**
Substituir prints por logging estruturado com níveis e contexto.

**Arquivos a criar:**
- `packages/etlpython/src/etlpython/core/logger.py`

**Implementação:**
```python
import logging
from rich.logging import RichHandler

def setup_logger(name: str, level: str = "INFO") -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    handler = RichHandler(rich_tracebacks=True)
    handler.setFormatter(logging.Formatter(
        "%(message)s",
        datefmt="[%X]"
    ))
    
    logger.addHandler(handler)
    return logger

# Uso
logger = setup_logger("etlpython")
logger.info("Processando deputado", extra={"deputy_id": 123})
logger.error("Erro ao buscar despesas", exc_info=True)
```

**Benefícios:**
- ✅ Logs estruturados e pesquisáveis
- ✅ Níveis de log configuráveis
- ✅ Melhor debugging

---

### 7. Testes Automatizados
**Esforço:** 40 horas | **Impacto:** Menos bugs, refactoring seguro

**Descrição:**
Aumentar cobertura de testes de ~20% para > 80%.

**Arquivos a criar:**
- `packages/etlpython/tests/test_client.py`
- `packages/etlpython/tests/test_processor.py`
- `packages/etlpython/tests/test_materialize.py`
- `packages/etlpython/tests/test_validators.py`

**Áreas prioritárias:**
1. Cliente da API (mocks de responses)
2. Processadores de dados
3. Normalização de fornecedores
4. Materialização de caches
5. Validações Pydantic

**Exemplo:**
```python
import pytest
from unittest.mock import Mock, patch

def test_process_deputy_success():
    client = Mock()
    client.fetch_deputy.return_value = {"id": 123, "nome": "Teste"}
    client.fetch_expenses.return_value = [{"valor": 100.0}]
    
    processor = DeputyProcessor(client)
    result = processor.process_deputy(123, [2024])
    
    assert result["id"] == 123
    assert result["totalGastos"] == 100.0
```

---

## 🟢 BAIXA PRIORIDADE (Futuro)

### 8. Machine Learning para Anomalias
**Esforço:** 40 horas | **Impacto:** Detecção inteligente de fraudes

**Descrição:**
Usar Isolation Forest para detectar padrões suspeitos automaticamente.

**Arquivos a criar:**
- `packages/etlpython/src/etlpython/analysis/anomaly_detection.py`

---

### 9. Análise de Rede de Relações
**Esforço:** 32 horas | **Impacto:** Visualização de conexões

**Descrição:**
Criar grafo de relações deputado-fornecedor com NetworkX.

**Arquivos a criar:**
- `packages/etlpython/src/etlpython/analysis/network_analysis.py`

---

### 10. Expansão para Senado
**Esforço:** 80 horas | **Impacto:** Dobra cobertura de dados

**Descrição:**
Implementar extração de dados do Senado Federal usando arquitetura em `ARCHITECTURE_PROPOSAL.md`.

**Arquivos a criar:**
- `packages/etlpython/src/etlpython/sources/congresso_nacional/senado/`

---

## 📊 Resumo de Esforço vs Impacto

| Tarefa | Esforço | Impacto | Prioridade |
|--------|---------|---------|------------|
| Paralelização | 12h | 4x velocidade | 🔴 Alta |
| ETL Incremental | 16h | 90% mais rápido | 🔴 Alta |
| Validação Aprimorada | 8h | Menos bugs | 🔴 Alta |
| Cache API | 4h | Menos requisições | 🟡 Média |
| Compressão Brotli | 4h | 30% menor | 🟡 Média |
| Logging | 6h | Melhor debug | 🟡 Média |
| Testes | 40h | Qualidade | 🟡 Média |
| ML Anomalias | 40h | Detecção inteligente | 🟢 Baixa |
| Análise Rede | 32h | Visualizações | 🟢 Baixa |
| Senado | 80h | Dobra dados | 🟢 Baixa |

---

## 🎯 Sugestão de Roadmap

### Sprint 1 (2 semanas)
- [ ] Paralelização do ETL
- [ ] Cache de API responses
- [ ] Logging estruturado

### Sprint 2 (2 semanas)
- [ ] ETL Incremental
- [ ] Validação aprimorada
- [ ] Compressão Brotli

### Sprint 3 (4 semanas)
- [ ] Testes automatizados (> 60% cobertura)
- [ ] Documentação de APIs
- [ ] CI/CD para ETL

---

**Última atualização:** 2025-01-XX  
**Versão:** 1.0.0