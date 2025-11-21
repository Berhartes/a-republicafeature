# 🐍 Setup do Pacote ETL Python

## 📋 Pré-requisitos

- Python 3.9 ou superior
- pip (gerenciador de pacotes Python)

## 🚀 Instalação

### Opção 1: Migração Automática (Recomendado)

Se você está migrando do ambiente virtual na raiz do projeto:

**Windows (PowerShell):**
```powershell
cd packages/etlpython
.\migrate-venv.ps1
```

**Linux/Mac:**
```bash
cd packages/etlpython
chmod +x migrate-venv.sh
./migrate-venv.sh
```

### Opção 2: Setup Manual

```bash
# 1. Navegar para o diretório do pacote
cd packages/etlpython

# 2. Criar ambiente virtual
python -m venv .venv

# 3. Ativar ambiente virtual
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# 4. Atualizar pip
python -m pip install --upgrade pip

# 5. Instalar pacote em modo desenvolvimento
pip install -e .

# 6. Instalar dependências de desenvolvimento
pip install -e ".[dev]"

# 7. Gerar requirements.txt
pip freeze > requirements.txt
```

## 📦 Dependências

### Produção
- `requests>=2.31.0` - HTTP client para APIs
- `pandas>=2.0.0` - Manipulação de dados
- `click>=8.1.0` - CLI framework
- `rich>=13.0.0` - Terminal formatting
- `pydantic>=2.0.0` - Validação de dados

### Desenvolvimento
- `pytest>=7.0.0` - Framework de testes
- `black>=23.0.0` - Code formatter
- `isort>=5.12.0` - Import sorter
- `mypy>=1.0.0` - Type checker
- `ruff>=0.1.0` - Linter rápido

## 🔧 Comandos Disponíveis

### Via npm/pnpm (do root do projeto)
```bash
# Executar ETL de despesas
pnpm etl:despesasdeputados:pc

# Materializar dados unificados
pnpm etl:materialize:unified

# Materializar dados paginados
pnpm etl:materialize:paginated

# Materializar todos
pnpm etl:materialize:all
```

### Via Python (com venv ativado)
```bash
# Executar ETL de despesas
python -m etlpython.sources.congresso_nacional.camara_deputados.cli

# Materializar dados unificados
python -m etlpython.cli.materialize_unified_v2

# Materializar dados paginados
python -m etlpython.cli.materialize_paginated
```

### Via Scripts Instalados
```bash
# Após instalação, os seguintes comandos ficam disponíveis:
etl-despesas
etl-materialize
```

## 🧪 Testes

```bash
# Executar todos os testes
pytest

# Executar com coverage
pytest --cov=etlpython

# Executar testes específicos
pytest tests/test_sqlite_writer.py
```

## 🎨 Formatação e Linting

```bash
# Formatar código
black src/

# Ordenar imports
isort src/

# Verificar tipos
mypy src/

# Lint com ruff
ruff check src/
```

## 📁 Estrutura do Projeto

```
packages/etlpython/
├── .venv/                      # Ambiente virtual (não commitado)
├── src/
│   └── etlpython/
│       ├── cli/                # Command-line interfaces
│       ├── core/               # Funcionalidades core
│       ├── extract/            # Extração de dados
│       ├── load/               # Carregamento de dados
│       ├── transform/          # Transformação de dados
│       ├── sources/            # Sources específicas (Câmara, etc)
│       └── performance/        # Performance testing
├── tests/                      # Testes
├── scripts/                    # Scripts auxiliares
├── pyproject.toml             # Configuração do projeto
├── requirements.txt           # Lock de dependências
└── README.md                  # Documentação principal
```

## 🔄 Workflow de Desenvolvimento

1. **Ativar ambiente virtual**
   ```bash
   cd packages/etlpython
   source .venv/bin/activate  # Linux/Mac
   .venv\Scripts\activate     # Windows
   ```

2. **Fazer alterações no código**

3. **Executar testes**
   ```bash
   pytest
   ```

4. **Formatar código**
   ```bash
   black src/
   isort src/
   ```

5. **Verificar tipos**
   ```bash
   mypy src/
   ```

6. **Commit e push**

## 🐛 Troubleshooting

### Erro: "No module named 'etlpython'"
**Solução**: Certifique-se de que instalou o pacote em modo desenvolvimento:
```bash
pip install -e .
```

### Erro: "python: command not found"
**Solução**: Use `python3` em vez de `python` no Linux/Mac

### Ambiente virtual não ativa
**Solução Windows**: Execute como administrador ou ajuste ExecutionPolicy:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📚 Recursos Adicionais

- [Documentação do Pandas](https://pandas.pydata.org/docs/)
- [Documentação do Pydantic](https://docs.pydantic.dev/)
- [Documentação do Click](https://click.palletsprojects.com/)
- [API da Câmara dos Deputados](https://dadosabertos.camara.leg.br/swagger/api.html)