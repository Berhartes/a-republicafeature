# 🔧 Comandos ETL - Referência Rápida

## ✅ Comando Corrigido

### Versão com Caminhos Relativos (Recomendado)

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

py -m etlpython.cli.materialize_monitordespesasDf --legislatura 57 --cache-version 2025-11-01 --fornecedores-dataset "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\fornecedores.json" --deputados-dataset "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\deputados.json"
```

**Correções aplicadas:**
- ✅ `....` → `..\..` (dois níveis acima)
- ✅ Adicionadas aspas duplas nos caminhos
- ✅ Mantido `\` (backslash) para Windows

---

### Versão com Caminhos Absolutos (Alternativa)

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

py -m etlpython.cli.materialize_monitordespesasDf --legislatura 57 --cache-version 2025-11-01 --fornecedores-dataset "C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\camaraDeputados\fornecedores.json" --deputados-dataset "C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\deputados.json"
```

---

### Versão com Quebra de Linha (Mais Legível)

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

py -m etlpython.cli.materialize_monitordespesasDf `
  --legislatura 57 `
  --cache-version 2025-11-01 `
  --fornecedores-dataset "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\fornecedores.json" `
  --deputados-dataset "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\deputados.json"
```

**Nota:** Use backtick `` ` `` no final de cada linha para quebra no PowerShell

---

## 📋 Todos os Comandos ETL Disponíveis

### 1. Extrair Dados da API

```powershell
# Extrair 10 deputados (teste)
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57 10

# Extrair todos os deputados da legislatura 57
py -m etlpython.sources.congresso_nacional.camara_deputados.cli 57

# Ou via pnpm
pnpm run etl:despesasdeputados:pc 57 10
```

---

### 2. Materializar Caches (Versão Nova com Anos)

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

# Via Python
py -m etlpython.cli.materialize_unified_v2

# Ou via pnpm
pnpm run etl:materialize:unified:v2
```

---

### 3. Materializar Transações Paginadas

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

# Via Python
py -m etlpython.cli.materialize_paginated

# Com limite (teste)
py -m etlpython.cli.materialize_paginated --limit-deputies 5 --limit-suppliers 10

# Ou via pnpm
pnpm run etl:materialize:paginated
```

---

### 4. Materializar TUDO (Recomendado)

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

# Via pnpm (executa unified_v2 + paginated)
pnpm run etl:materialize:all
```

---

## 🎯 Fluxo Completo Recomendado

### Passo a Passo

```powershell
# 1. Navegar para o diretório do ETL
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'

# 2. Extrair dados (escolha uma opção)
# Opção A: Teste com 10 deputados
pnpm run etl:despesasdeputados:pc 57 10

# Opção B: Todos os deputados (demora ~2 horas)
pnpm run etl:despesasdeputados:pc 57

# 3. Materializar todos os caches
pnpm run etl:materialize:all

# 4. Verificar resultado
Get-ChildItem ..\..\packages\monitor-despesas-next\public\cache
```

---

## 🔍 Verificar Resultados

### Verificar Datalake (Dados Brutos)

```powershell
# Listar deputados processados
Get-ChildItem "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\idDeputados"

# Ver arquivo de um deputado
Get-Content "..\..\bancoDados\monitordespesas\congressoNacional\camaraDeputados\deputadosFederais\idDeputados\204379\dados_completos.json" | ConvertFrom-Json | Format-List
```

### Verificar Caches (Dados Otimizados)

```powershell
# Listar caches gerados
Get-ChildItem "..\..\packages\monitor-despesas-next\public\cache"

# Ver tamanho dos caches
Get-ChildItem "..\..\packages\monitor-despesas-next\public\cache" -Recurse | Measure-Object -Property Length -Sum

# Ver manifest
Get-Content "..\..\packages\monitor-despesas-next\public\cache\caches-manifest.json" | ConvertFrom-Json | Format-List
```

---

## ⚠️ Problemas Comuns

### Erro: "No module named 'etlpython'"

**Solução:**
```powershell
# Instalar o pacote em modo desenvolvimento
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'
pip install -e .
```

### Erro: "File not found"

**Solução:**
```powershell
# Verificar se está no diretório correto
Get-Location

# Deve mostrar: C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython

# Se não estiver, navegar:
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'
```

### Erro: "Invalid path"

**Solução:**
```powershell
# Use aspas duplas em caminhos com espaços
# Use \\ ou \ (não /)
# Use caminhos absolutos se relativos não funcionarem
```

---

## 📊 Estrutura de Caminhos

```
C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\
│
├── packages\
│   └── etlpython\                    ← Você está aqui ao executar
│       └── src\etlpython\cli\
│
├── bancoDados\                       ← ..\..\bancoDados
│   └── monitordespesas\
│       └── congressoNacional\
│           └── camaraDeputados\
│               ├── fornecedores.json
│               └── deputadosFederais\
│                   └── deputados.json
│
└── packages\
    └── monitor-despesas-next\        ← ..\..\packages\monitor-despesas-next
        └── public\
            └── cache\                ← Destino dos caches
```

**Explicação dos caminhos relativos:**
- `.` = diretório atual
- `..` = um nível acima
- `..\..` = dois níveis acima
- `..\..\bancoDados` = dois níveis acima, depois bancoDados

---

## 🚀 Atalhos Úteis

### Criar Aliases (Opcional)

```powershell
# Adicionar ao seu perfil do PowerShell
# Editar: notepad $PROFILE

# Aliases úteis
function etl-root { Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica' }
function etl-python { Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython' }
function etl-frontend { Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\monitor-despesas-next' }

# Usar:
# etl-python
# pnpm run etl:materialize:all
```

---

## 📝 Resumo Rápido

**Comando mais usado (copie e cole):**

```powershell
Set-Location 'C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\etlpython'; pnpm run etl:materialize:all
```

**Verificar resultado:**

```powershell
Get-ChildItem "C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\packages\monitor-despesas-next\public\cache"
```

---

**Última atualização:** 2025-01-XX
**Versão:** 1.0.0