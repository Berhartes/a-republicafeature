# Proposta de Arquitetura Escalável - ETLPython

## Estrutura Proposta

```
src/etlpython/
├── core/                           # Core abstractions
│   ├── __init__.py
│   ├── base_models.py             # Abstract base models
│   ├── base_client.py             # Abstract API client
│   ├── base_processor.py          # Abstract data processor
│   └── base_writer.py             # Abstract data writer
│
├── sources/                        # Data sources by platform
│   ├── __init__.py
│   └── congresso_nacional/        # Congresso Nacional platform
│       ├── __init__.py
│       ├── shared/                # Shared models for congresso
│       │   ├── __init__.py
│       │   └── models.py          # Common models (Legislador, Despesa, etc.)
│       │
│       ├── camara_deputados/      # Câmara dos Deputados
│       │   ├── __init__.py
│       │   ├── models.py          # Specific models
│       │   ├── client.py          # API client
│       │   ├── processor.py       # Data processor
│       │   └── cli.py             # CLI commands
│       │
│       └── senado/                # Senado Federal
│           ├── __init__.py
│           ├── models.py          # Specific models
│           ├── client.py          # API client
│           ├── processor.py       # Data processor
│           └── cli.py             # CLI commands
│
├── pipeline/                       # ETL pipeline orchestration
│   ├── __init__.py
│   ├── runner.py                  # Pipeline runner
│   └── config.py                  # Configuration management
│
├── storage/                        # Storage layer
│   ├── __init__.py
│   ├── file_writer.py            # JSON file writer
│   ├── sqlite_writer.py          # SQLite writer
│   └── data_lake.py              # Data lake management
│
└── cli/                           # CLI interface
    ├── __init__.py
    ├── main.py                    # Main CLI entry point
    └── commands/                  # Command modules
        ├── __init__.py
        ├── camara.py             # Câmara commands
        └── senado.py             # Senado commands
```

## Implementação dos Core Abstractions

### 1. Base Models
```python
# core/base_models.py
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from pydantic import BaseModel

class BaseLegislador(BaseModel, ABC):
    """Base model for any legislator (deputado, senador, etc.)"""
    id: int
    nome: str
    partido: str
    uf: str

class BaseDespesa(BaseModel, ABC):
    """Base model for any expense"""
    ano: int
    mes: int
    valor_documento: float
    valor_liquido: float
    tipo_despesa: str
    fornecedor: str
    documento_id: int

class BaseApiResponse(BaseModel, ABC):
    """Base API response structure"""
    dados: List[Dict[str, Any]]
    links: Optional[List[Dict[str, str]]] = None
```

### 2. Abstract API Client
```python
# core/base_client.py
from abc import ABC, abstractmethod
from typing import List, Optional

class BaseApiClient(ABC):
    """Abstract base class for government API clients"""

    def __init__(self, base_url: str, wait_ms: int = 150):
        self.base_url = base_url
        self.wait_seconds = wait_ms / 1000.0

    @abstractmethod
    def fetch_legislators(self, legislatura: int, limit: Optional[int] = None) -> List[BaseLegislador]:
        """Fetch legislators for a given legislature"""
        pass

    @abstractmethod
    def fetch_expenses(self, legislator_id: int, anos: List[int]) -> List[BaseDespesa]:
        """Fetch expenses for a legislator"""
        pass
```

### 3. Configuration-driven Approach
```python
# pipeline/config.py
from typing import Dict, Any
from pydantic import BaseModel

class SourceConfig(BaseModel):
    """Configuration for a data source"""
    name: str
    platform: str  # "congresso_nacional", "tribunal_contas", etc.
    source_type: str  # "camara_deputados", "senado", etc.
    api_base_url: str
    rate_limit_ms: int = 150
    enabled: bool = True

class ETLConfig(BaseModel):
    """Main ETL configuration"""
    sources: Dict[str, SourceConfig]
    output_path: str
    legislatura_default: int = 57
```

## Comandos CLI Propostos

```bash
# Câmara dos Deputados
etl run camara-deputados 57 --limit 10
etl run camara-deputados 57 --ano-inicio 2023 --ano-fim 2024

# Senado (futuro)
etl run senado 57 --limit 5

# Executar múltiplas fontes
etl run congresso-nacional 57 --sources camara,senado

# Executar todas as plataformas
etl run all 57
```

## Benefícios desta Arquitetura

1. **Extensibilidade**: Fácil adição de novas fontes (Senado, TCU, etc.)
2. **Reutilização**: Core abstractions compartilhadas
3. **Isolamento**: Cada fonte tem sua própria implementação
4. **Configurabilidade**: Driven by configuration files
5. **Testabilidade**: Cada componente pode ser testado isoladamente
6. **Manutenibilidade**: Mudanças em uma fonte não afetam outras

## Migração Gradual

1. **Fase 1**: Criar abstractions e mover código da Câmara
2. **Fase 2**: Implementar Senado usando as abstractions
3. **Fase 3**: Adicionar orquestração e CLI unificado
4. **Fase 4**: Expandir para outras plataformas

## Estrutura de Dados Unificada

```
bancoDados/
├── monitordespesas/
│   ├── manifest.json
│   └── congressoNacional/
│       ├── camaraDeputados/
│       │   ├── deputados.json
│       │   ├── deputadosFederais/
│       │   │   └── idDeputados/
│       │   └── fornecedores/
│       │       └── cnpj/
│       └── senado/
│           ├── senadores.json
│           ├── senadoresFederais/
│           │   └── idSenadores/
│           └── fornecedores/
│               └── cnpj/
```

Esta arquitetura permite crescimento orgânico e facilita a manutenção a longo prazo.