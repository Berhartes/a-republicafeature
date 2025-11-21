# 📋 Plano de Execução: ETL Incremental por Ano

> **Objetivo:** Modificar o ETL para salvar despesas separadas por ano, permitindo atualização incremental

---

## 🎯 Objetivo Final

### Estrutura Atual (ANTES)
```
bancoDados/monitordespesas/deputadosFederais/
└── 74646/
    └── 74646-id57-dados_completos.json  ← Um arquivo com TUDO (2022-2025)
```

### Estrutura Nova (DEPOIS)
```
bancoDados/monitordespesas/deputadosFederais/
└── 74646/
    ├── 74646-id57-2022-dados_completos.json  ← Só despesas de 2022
    ├── 74646-id57-2023-dados_completos.json  ← Só despesas de 2023
    ├── 74646-id57-2024-dados_completos.json  ← Só despesas de 2024
    └── 74646-id57-2025-dados_completos.json  ← Só despesas de 2025
```

### Benefício
Quando rodar apenas `--ano-inicio 2025 --ano-fim 2025`:
- ✅ Só modifica `74646-id57-2025-dados_completos.json`
- ✅ Não toca em 2022, 2023, 2024 (economiza tempo e memória)

---

## 📂 Arquivos a Modificar

### 1. `packages/etlpython/src/etlpython/sources/congresso_nacional/shared/writer.py`
**Responsável por:** Escrever os arquivos de dados dos deputados

**Modificações necessárias:**
- Método `write_legislador_despesas()` precisa salvar por ano
- Criar método `write_legislador_despesas_by_year()`
- Manter compatibilidade com código existente

### 2. `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/cli.py`
**Responsável por:** Orquestrar o ETL

**Modificações necessárias:**
- Adicionar flag `--incremental`
- Adicionar flag `--force-year`
- Implementar lógica de detecção de anos já processados
- Carregar dados de anos anteriores quando necessário

### 3. `packages/etlpython/src/etlpython/core/incremental_by_year.py` (NOVO)
**Responsável por:** Gerenciar lógica incremental

**Funcionalidades:**
- Detectar quais anos já foram processados
- Carregar dados de anos do cache
- Marcar anos como finalizados
- Auto-detecção de transição de ano

---

## 🔧 Plano de Implementação Detalhado

## FASE 1: Criar Módulo de Gerenciamento Incremental (4 horas)

### Tarefa 1.1: Criar `core/incremental_by_year.py`

**Arquivo:** `packages/etlpython/src/etlpython/core/incremental_by_year.py`

**Código completo:**

```python
"""
Gerenciador de ETL incremental por ano.
Permite processar apenas anos específicos e reutilizar dados de anos anteriores.
"""

from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import json


class YearBasedIncrementalETL:
    """
    Gerencia processamento incremental de dados por ano.
    
    Funcionalidades:
    - Detecta quais anos já foram processados
    - Carrega dados de anos do cache
    - Salva dados separados por ano
    - Auto-detecção de transição de ano
    """
    
    def __init__(self, base_path: Path):
        """
        Inicializa o gerenciador incremental.
        
        Args:
            base_path: Caminho base (ex: bancoDados/monitordespesas)
        """
        self.base_path = Path(base_path)
        self.current_year = datetime.now().year
    
    def get_year_file_path(self, deputy_id: int, legislatura: int, year: int) -> Path:
        """
        Retorna o caminho do arquivo de dados de um ano específico.
        
        Formato: {deputy_id}-id{legislatura}-{year}-dados_completos.json
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            year: Ano dos dados
            
        Returns:
            Path do arquivo
        """
        deputy_dir = self.base_path / "deputadosFederais" / str(deputy_id)
        filename = f"{deputy_id}-id{legislatura}-{year}-dados_completos.json"
        return deputy_dir / filename
    
    def year_file_exists(self, deputy_id: int, legislatura: int, year: int) -> bool:
        """
        Verifica se o arquivo de um ano já existe.
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            year: Ano a verificar
            
        Returns:
            True se o arquivo existe
        """
        file_path = self.get_year_file_path(deputy_id, legislatura, year)
        return file_path.exists()
    
    def get_years_to_process(
        self, 
        deputy_id: int, 
        legislatura: int, 
        requested_years: List[int],
        force_year: Optional[int] = None
    ) -> List[int]:
        """
        Determina quais anos precisam ser processados.
        
        Regras:
        - Anos passados: só processa se não existir arquivo
        - Ano atual: sempre processa (dados mudam)
        - force_year: sempre processa se especificado
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            requested_years: Anos solicitados pelo usuário
            force_year: Ano para forçar reprocessamento
            
        Returns:
            Lista de anos que precisam ser processados
        """
        years_to_process = []
        
        for year in requested_years:
            # Ignora anos futuros
            if year > self.current_year:
                continue
            
            # Força reprocessamento se especificado
            if force_year and year == force_year:
                years_to_process.append(year)
                continue
            
            # Ano atual: sempre processa
            if year == self.current_year:
                years_to_process.append(year)
                continue
            
            # Ano passado: só processa se não existe
            if not self.year_file_exists(deputy_id, legislatura, year):
                years_to_process.append(year)
        
        return years_to_process
    
    def load_year_data(self, deputy_id: int, legislatura: int, year: int) -> Optional[Dict]:
        """
        Carrega dados de um ano do cache.
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            year: Ano a carregar
            
        Returns:
            Dados do ano ou None se não existir
        """
        file_path = self.get_year_file_path(deputy_id, legislatura, year)
        
        if not file_path.exists():
            return None
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"⚠️  Erro ao carregar {file_path}: {e}")
            return None
    
    def get_despesas_from_year_data(self, year_data: Dict) -> List[Dict]:
        """
        Extrai lista de despesas de um arquivo de dados de ano.
        
        Args:
            year_data: Dados carregados do arquivo
            
        Returns:
            Lista de despesas
        """
        if not year_data:
            return []
        
        # O arquivo pode ter diferentes estruturas
        if 'despesas' in year_data:
            return year_data['despesas']
        elif isinstance(year_data, list):
            return year_data
        else:
            return []
    
    def load_all_years_despesas(
        self, 
        deputy_id: int, 
        legislatura: int, 
        years: List[int]
    ) -> List[Dict]:
        """
        Carrega despesas de todos os anos do cache.
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            years: Lista de anos a carregar
            
        Returns:
            Lista combinada de todas as despesas
        """
        all_despesas = []
        
        for year in years:
            year_data = self.load_year_data(deputy_id, legislatura, year)
            if year_data:
                despesas = self.get_despesas_from_year_data(year_data)
                all_despesas.extend(despesas)
        
        return all_despesas
    
    def mark_year_as_final(self, deputy_id: int, legislatura: int, year: int):
        """
        Marca um ano como finalizado (não será reprocessado).
        Cria arquivo de metadata indicando que o ano é imutável.
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            year: Ano a marcar como final
        """
        file_path = self.get_year_file_path(deputy_id, legislatura, year)
        
        if not file_path.exists():
            return
        
        # Carrega dados para contar despesas
        year_data = self.load_year_data(deputy_id, legislatura, year)
        despesas = self.get_despesas_from_year_data(year_data)
        
        # Cria metadata
        metadata_path = file_path.parent / f"{deputy_id}-id{legislatura}-{year}-metadata.json"
        metadata = {
            "year": year,
            "deputy_id": deputy_id,
            "legislatura": legislatura,
            "finalized_at": datetime.now().isoformat(),
            "total_despesas": len(despesas),
            "is_final": True
        }
        
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    def auto_finalize_past_years(self, deputy_id: int, legislatura: int, years: List[int]):
        """
        Finaliza automaticamente anos que já passaram.
        
        Args:
            deputy_id: ID do deputado
            legislatura: Número da legislatura
            years: Lista de anos a verificar
        """
        for year in years:
            if year < self.current_year:
                file_path = self.get_year_file_path(deputy_id, legislatura, year)
                metadata_path = file_path.parent / f"{deputy_id}-id{legislatura}-{year}-metadata.json"
                
                # Se tem dados mas não tem metadata, finaliza
                if file_path.exists() and not metadata_path.exists():
                    self.mark_year_as_final(deputy_id, legislatura, year)
```

**Testes a fazer:**
```python
# Teste básico
etl = YearBasedIncrementalETL(Path("bancoDados/monitordespesas"))
print(f"Ano atual: {etl.current_year}")

# Teste de detecção de anos
years_to_process = etl.get_years_to_process(74646, 57, [2022, 2023, 2024, 2025])
print(f"Anos a processar: {years_to_process}")
```

---

## FASE 2: Modificar Writer para Salvar por Ano (4 horas)

### Tarefa 2.1: Modificar `shared/writer.py`

**Arquivo:** `packages/etlpython/src/etlpython/sources/congresso_nacional/shared/writer.py`

**Localizar método:** `write_legislador_despesas()`

**Adicionar novo método:**

```python
def write_legislador_despesas_by_year(
    self,
    legislador: Any,
    despesas_by_year: Dict[int, List[Any]],
    legislatura: int
) -> None:
    """
    Escreve despesas de um legislador separadas por ano.
    
    Cria um arquivo para cada ano: {id}-id{legislatura}-{ano}-dados_completos.json
    
    Args:
        legislador: Objeto do legislador
        despesas_by_year: Dicionário {ano: [despesas]}
        legislatura: Número da legislatura
    """
    from rich.console import Console
    console = Console()
    
    legislador_id = legislador.id
    legislador_dir = self.legisladores_dir / str(legislador_id)
    legislador_dir.mkdir(parents=True, exist_ok=True)
    
    # Salva cada ano separadamente
    for ano, despesas_ano in despesas_by_year.items():
        filename = f"{legislador_id}-id{legislatura}-{ano}-dados_completos.json"
        file_path = legislador_dir / filename
        
        # Prepara dados do ano
        dados_ano = {
            "id": legislador_id,
            "nome": legislador.nome,
            "nomeEleitoral": getattr(legislador, 'nomeEleitoral', legislador.nome),
            "siglaPartido": getattr(legislador, 'siglaPartido', ''),
            "siglaUf": getattr(legislador, 'siglaUf', ''),
            "urlFoto": getattr(legislador, 'urlFoto', ''),
            "legislatura": legislatura,
            "ano": ano,
            "despesas": [self._despesa_to_dict(d) for d in despesas_ano]
        }
        
        # Salva arquivo
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(dados_ano, f, indent=2, ensure_ascii=False, default=str)
        
        console.print(f"  [dim]✅ Salvo: {filename} ({len(despesas_ano)} despesas)[/dim]")

def _despesa_to_dict(self, despesa: Any) -> Dict:
    """Converte objeto de despesa para dicionário."""
    if isinstance(despesa, dict):
        return despesa
    
    # Se for objeto Pydantic ou similar
    if hasattr(despesa, 'dict'):
        return despesa.dict()
    elif hasattr(despesa, '__dict__'):
        return despesa.__dict__
    else:
        return {}
```

**Modificar método existente para manter compatibilidade:**

```python
def write_legislador_despesas(
    self,
    legislador: Any,
    despesas: List[Any],
    legislatura: int,
    anos: List[int],
    save_by_year: bool = True  # ✅ NOVO parâmetro
) -> None:
    """
    Escreve despesas de um legislador.
    
    Args:
        legislador: Objeto do legislador
        despesas: Lista de despesas
        legislatura: Número da legislatura
        anos: Lista de anos processados
        save_by_year: Se True, salva separado por ano (padrão: True)
    """
    if save_by_year:
        # Agrupa despesas por ano
        despesas_by_year = {}
        for despesa in despesas:
            ano = despesa.ano if hasattr(despesa, 'ano') else despesa.get('ano')
            if ano not in despesas_by_year:
                despesas_by_year[ano] = []
            despesas_by_year[ano].append(despesa)
        
        # Salva por ano
        self.write_legislador_despesas_by_year(legislador, despesas_by_year, legislatura)
    else:
        # Comportamento original (um arquivo só)
        # ... código existente ...
        pass
```

---

## FASE 3: Modificar CLI para Usar Modo Incremental (6 horas)

### Tarefa 3.1: Adicionar flags ao CLI

**Arquivo:** `packages/etlpython/src/etlpython/sources/congresso_nacional/camara_deputados/cli.py`

**Modificar decorador do comando:**

```python
@click.command()
@click.argument('legislatura', type=int, default=57)
@click.argument('limit', type=int, required=False)
@click.option('--pc', is_flag=True, help='PC mode flag (for compatibility)')
@click.option('--ano-inicio', type=int, help='Start year for data extraction')
@click.option('--ano-fim', type=int, help='End year for data extraction')
@click.option('--workers', type=int, default=1, help='Number of parallel workers')
@click.option('--wait-ms', type=int, default=150, help='Wait time between requests in ms')
@click.option('--incremental', is_flag=True, help='Use incremental mode (only process necessary years)')  # ✅ NOVO
@click.option('--force-year', type=int, help='Force reprocessing of specific year')  # ✅ NOVO
def camara_deputados(
    legislatura: int,
    limit: Optional[int],
    pc: bool,
    ano_inicio: Optional[int],
    ano_fim: Optional[int],
    workers: int,
    wait_ms: int,
    incremental: bool,  # ✅ NOVO
    force_year: Optional[int]  # ✅ NOVO
) -> None:
```

### Tarefa 3.2: Implementar lógica incremental no CLI

**Adicionar no início da função:**

```python
from etlpython.core.incremental_by_year import YearBasedIncrementalETL

def camara_deputados(...):
    console.print(f"[bold cyan]🐍 ETL Python - Câmara dos Deputados[/bold cyan]")
    console.print(f"[cyan]Legislature: {legislatura}[/cyan]")
    
    if limit:
        console.print(f"[cyan]Limit: {limit} deputados[/cyan]")
    
    # Get years range (já existe)
    anos = get_years_range(ano_inicio, ano_fim)
    console.print(f"[cyan]Years requested: {', '.join(map(str, anos))}[/cyan]")
    
    # Get project root (já existe)
    project_root = get_project_root()
    
    # ✅ NOVO: Inicializa ETL incremental
    base_path = project_root / "bancoDados" / "monitordespesas"
    incremental_etl = YearBasedIncrementalETL(base_path)
    
    # ✅ NOVO: Modo incremental
    if incremental:
        console.print(f"[yellow]🔄 Modo incremental ativado[/yellow]")
        console.print(f"[yellow]📅 Ano atual: {incremental_etl.current_year}[/yellow]")
    
    if force_year:
        console.print(f"[yellow]⚠️  Forçando reprocessamento de: {force_year}[/yellow]")
```

### Tarefa 3.3: Modificar loop de processamento

**Localizar loop:** `for i, deputado in enumerate(deputados, 1):`

**Substituir por:**

```python
for i, deputado in enumerate(deputados, 1):
    console.print(f"[blue]({i}/{len(deputados)}) {deputado.nome} (ID: {deputado.id})[/blue]")
    
    if incremental:
        # ✅ MODO INCREMENTAL
        
        # 1. Determina quais anos processar
        years_to_process = incremental_etl.get_years_to_process(
            deputado.id, 
            legislatura, 
            anos,
            force_year
        )
        years_from_cache = [y for y in anos if y not in years_to_process]
        
        console.print(f"  [dim]📥 Do cache: {years_from_cache}[/dim]")
        console.print(f"  [dim]🔄 Da API: {years_to_process}[/dim]")
        
        # 2. Busca apenas anos necessários da API
        despesas_from_api = []
        for year in years_to_process:
            year_despesas = api_client.fetch_expenses(deputado.id, [year])
            despesas_from_api.extend(year_despesas)
            console.print(f"  [green]✅ {year}: {len(year_despesas)} despesas[/green]")
        
        # 3. Carrega anos do cache
        despesas_from_cache = incremental_etl.load_all_years_despesas(
            deputado.id,
            legislatura,
            years_from_cache
        )
        
        if despesas_from_cache:
            console.print(f"  [dim]📦 Cache: {len(despesas_from_cache)} despesas[/dim]")
        
        # 4. Combina tudo
        despesas = despesas_from_api + despesas_from_cache
        console.print(f"  [cyan]📊 Total: {len(despesas)} despesas[/cyan]")
        
        # 5. Auto-finaliza anos passados
        incremental_etl.auto_finalize_past_years(deputado.id, legislatura, anos)
        
    else:
        # ✅ MODO COMPLETO (comportamento original)
        console.print(f"  [dim]🔄 Modo completo: processando todos os anos[/dim]")
        despesas = api_client.fetch_expenses(deputado.id, anos)
    
    # Resto do código continua igual
    deputado_despesas[deputado.id] = despesas
    deputado_enriquecido = processor.process_deputado_despesas(deputado, despesas)
    
    # ✅ MODIFICADO: Salva por ano
    writer.write_legislador_despesas(
        deputado_enriquecido, 
        despesas, 
        legislatura, 
        anos,
        save_by_year=True  # ✅ Sempre salva por ano
    )
```

---

## FASE 4: Testes e Validação (2 horas)

### Teste 1: Primeira Execução Completa

```bash
cd packages/etlpython
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 5 --ano-inicio 2022 --ano-fim 2025
```

**Resultado esperado:**
```
bancoDados/monitordespesas/deputadosFederais/
├── 74646/
│   ├── 74646-id57-2022-dados_completos.json
│   ├── 74646-id57-2023-dados_completos.json
│   ├── 74646-id57-2024-dados_completos.json
│   └── 74646-id57-2025-dados_completos.json
├── 74647/
│   ├── 74647-id57-2022-dados_completos.json
│   ├── 74647-id57-2023-dados_completos.json
│   ├── 74647-id57-2024-dados_completos.json
│   └── 74647-id57-2025-dados_completos.json
...
```

### Teste 2: Execução Incremental (Só 2025)

```bash
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 5 --ano-inicio 2022 --ano-fim 2025 --incremental
```

**Resultado esperado:**
- Console mostra: "Do cache: [2022, 2023, 2024]"
- Console mostra: "Da API: [2025]"
- Apenas arquivo `*-2025-dados_completos.json` é modificado
- Tempo de execução: ~80% mais rápido

### Teste 3: Forçar Reprocessamento de 2024

```bash
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 5 --ano-inicio 2022 --ano-fim 2025 --incremental --force-year 2024
```

**Resultado esperado:**
- Console mostra: "Do cache: [2022, 2023]"
- Console mostra: "Da API: [2024, 2025]"
- Arquivos `*-2024-dados_completos.json` e `*-2025-dados_completos.json` são modificados

### Teste 4: Transição de Ano (Simular 2026)

```python
# Modificar temporariamente current_year para testar
# Em incremental_by_year.py:
self.current_year = 2026  # Simula que estamos em 2026
```

```bash
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 5 --ano-inicio 2022 --ano-fim 2026 --incremental
```

**Resultado esperado:**
- Console mostra: "Do cache: [2022, 2023, 2024, 2025]"
- Console mostra: "Da API: [2026]"
- Arquivos de metadata criados para 2022-2025
- Novo arquivo `*-2026-dados_completos.json` criado

---

## 📊 Checklist de Implementação

### Fase 1: Módulo Incremental ✅
- [ ] Criar `core/incremental_by_year.py`
- [ ] Implementar `YearBasedIncrementalETL`
- [ ] Testar métodos básicos
- [ ] Documentar código

### Fase 2: Modificar Writer ✅
- [ ] Adicionar `write_legislador_despesas_by_year()`
- [ ] Adicionar `_despesa_to_dict()`
- [ ] Modificar `write_legislador_despesas()` com flag `save_by_year`
- [ ] Testar salvamento por ano

### Fase 3: Modificar CLI ✅
- [ ] Adicionar flags `--incremental` e `--force-year`
- [ ] Importar `YearBasedIncrementalETL`
- [ ] Implementar lógica incremental no loop
- [ ] Manter compatibilidade com modo completo
- [ ] Testar ambos os modos

### Fase 4: Testes ✅
- [ ] Teste 1: Primeira execução completa
- [ ] Teste 2: Execução incremental
- [ ] Teste 3: Force year
- [ ] Teste 4: Transição de ano
- [ ] Validar estrutura de arquivos
- [ ] Validar conteúdo dos arquivos
- [ ] Medir ganho de performance

---

## 🎯 Comandos Finais

### Uso Diário (Recomendado)

```bash
# Atualização rápida (só ano atual)
cd packages/etlpython
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 30 --ano-inicio 2022 --ano-fim 2025 --incremental --workers 3 --wait-ms 150
```

### Primeira Vez ou Rebuild

```bash
# Processa tudo
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 30 --ano-inicio 2022 --ano-fim 2025 --workers 3 --wait-ms 150
```

### Corrigir Ano Específico

```bash
# Reprocessa 2024
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 30 --ano-inicio 2022 --ano-fim 2025 --incremental --force-year 2024 --workers 3 --wait-ms 150
```

---

## 📈 Ganhos Esperados

### Primeira Execução (30 deputados, 2022-2025)
- Tempo: ~15 minutos
- Requisições: ~720
- Memória: ~18.000 despesas

### Execução Incremental (30 deputados, só 2025)
- Tempo: ~2 minutos (87% mais rápido!)
- Requisições: ~60 (92% menos!)
- Memória: ~450 despesas (97% menos!)

### Escalabilidade
- **ANTES:** Limite de ~30 deputados
- **DEPOIS:** Pode processar 100+ deputados

---

## ⚠️ Pontos de Atenção

1. **Compatibilidade:** Modo completo continua funcionando (sem --incremental)
2. **Migração:** Arquivos antigos não são deletados automaticamente
3. **Validação:** Sempre validar que dados de cache estão corretos
4. **Backup:** Fazer backup antes de primeira execução com novo código

---

## 🚀 Próximos Passos Após Implementação

1. Executar primeira vez em modo completo
2. Validar estrutura de arquivos gerada
3. Testar modo incremental
4. Documentar para equipe
5. Configurar execução diária automática

---

**Tempo Total Estimado:** 16 horas
**Prioridade:** Alta
**Impacto:** 87% mais rápido, 97% menos memória

---

**Pronto para implementação!** 🎉