# 📊 REFERÊNCIA VISUAL: Arquitetura ETL Completa

**Data:** 21 de outubro de 2025  
**Propósito:** Visualização clara do fluxo completo do sistema

---

## 🗺️ ARQUITETURA COMPLETA (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SISTEMA COMPLETO                                 │
└─────────────────────────────────────────────────────────────────────────┘

1️⃣ FONTES EXTERNAS
┌─────────────────────────────────────────────────┐
│  📡 APIs Governamentais                         │
│  • dadosabertos.camara.leg.br/api/v2/          │
│  • legis.senado.leg.br/dadosabertos/           │
└─────────────────────────────────────────────────┘
                    ↓
                    │ HTTP GET
                    ↓

2️⃣ ETL - EXTRACT (Extração)
┌─────────────────────────────────────────────────┐
│  🔽 DespesasDeputadosProcessor.extract()        │
│                                                 │
│  • Busca lista de deputados (legislatura 57)   │
│  • Para cada deputado: busca despesas          │
│  • Deduplica por codDocumento-numDocumento     │
│  • Pagina automaticamente (100 itens/página)   │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Salva JSON bruto
                    ↓

3️⃣ DATA LAKE - RAW DATA (Armazenamento Bruto)
┌─────────────────────────────────────────────────┐
│  📁 bancodeDados/congressoNacional/             │
│     └── deputados/                              │
│         ├── 160553/                             │
│         │   └── despesas.json ← Dados brutos    │
│         ├── 160560/                             │
│         │   └── despesas.json                   │
│         └── ... (um dir por deputado)           │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Lê arquivo por arquivo
                    ↓

4️⃣ ETL - TRANSFORM (Transformação)
┌─────────────────────────────────────────────────┐
│  🔄 materializeMonitorDespesas()                │
│                                                 │
│  • Lê todos os deputados do Data Lake          │
│  • Agrega fornecedores (por CNPJ/CPF)          │
│  • Calcula totais por deputado                 │
│  • Calcula totais por fornecedor               │
│  • Conta número de deputados por fornecedor    │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Salva JSONs processados
                    ↓

5️⃣ DATA LAKE - PROCESSED DATA (Dados Processados)
┌─────────────────────────────────────────────────┐
│  📁 bancodeDados/monitordespesas/               │
│     ├── deputados.json ← Lista consolidada     │
│     └── fornecedores.json ← Agregados          │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Materializa em SQLite
                    ↓

6️⃣ ETL - LOAD (Carregamento)
┌─────────────────────────────────────────────────┐
│  🗄️ materializeSQLite()                         │
│                                                 │
│  • Cria schema (tabelas + índices)             │
│  • Insere deputados                            │
│  • Insere fornecedores                         │
│  • Gera agregados (estatísticas)              │
│  • Gera manifest (metadados)                   │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Cria arquivos otimizados
                    ↓

7️⃣ ARMAZENAMENTO MATERIALIZADO (Dados Otimizados)
┌─────────────────────────────────────────────────┐
│  📁 bancodeDados/monitordespesas/               │
│     ├── monitordespesas.db ← SQLite indexado   │
│     ├── deputados.json                         │
│     ├── fornecedores.json                      │
│     ├── agregados.json ← Estatísticas          │
│     └── manifest.json ← Metadados              │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Backend conecta aqui
                    ↓

8️⃣ BACKEND API (Servidor REST)
┌─────────────────────────────────────────────────┐
│  🌐 Express.js Server                           │
│                                                 │
│  Rotas:                                         │
│  • GET /gastos/fornecedores                    │
│    └─→ Query em monitordespesas.db            │
│  • GET /gastos/deputados                       │
│    └─→ Query em monitordespesas.db            │
│  • GET /gastos/agregados                       │
│    └─→ Lê agregados.json                       │
└─────────────────────────────────────────────────┘
                    ↓
                    │ HTTP JSON
                    ↓

9️⃣ FRONTEND REACT (Interface do Usuário)
┌─────────────────────────────────────────────────┐
│  🖥️ React App (localhost:3000)                  │
│                                                 │
│  Componentes:                                   │
│  • useFornecedoresData() hook                  │
│    └─→ fetch('/gastos/fornecedores')          │
│  • Tabelas de dados                            │
│  • Gráficos e visualizações                    │
│  • Filtros e busca                             │
└─────────────────────────────────────────────────┘
                    ↓
                    │ Browser render
                    ↓

🔟 USUÁRIO FINAL
┌─────────────────────────────────────────────────┐
│  👤 Cidadão navegando no site                   │
│     → Visualiza despesas de deputados           │
│     → Analisa fornecedores suspeitos            │
│     → Explora dados de transparência            │
└─────────────────────────────────────────────────┘
```

---

## 📊 ESTRUTURA DE DIRETÓRIOS IDEAL

```
a-republica/
└── packages/
    ├── etl/                                    ← Sistema ETL (PRINCIPAL)
    │   ├── bancodeDados/                       ← DATA LAKE
    │   │   ├── congressoNacional/              ← Extract output (raw)
    │   │   │   └── deputados/
    │   │   │       ├── 160553/
    │   │   │       │   └── despesas.json
    │   │   │       └── 160560/
    │   │   │           └── despesas.json
    │   │   └── monitordespesas/                ← Transform/Load output (processed)
    │   │       ├── monitordespesas.db          ← SQLite otimizado
    │   │       ├── deputados.json
    │   │       ├── fornecedores.json
    │   │       ├── agregados.json
    │   │       └── manifest.json
    │   ├── src/
    │   │   ├── config/
    │   │   │   └── data-lake-paths.ts          ← ✅ CRIAR ESTE
    │   │   ├── processors/                     ← Extract
    │   │   │   └── despesas-deputados.processor.ts
    │   │   ├── materializers/                  ← Transform + Load
    │   │   │   ├── materialize-monitor-despesas.ts  ← ✅ CRIAR ESTE
    │   │   │   └── materialize-unified.ts      ← ✅ CRIAR ESTE
    │   │   └── cli/
    │   │       ├── etl-runner.ts               ← Extract CLI
    │   │       └── materialize-runner.ts       ← ✅ CRIAR ESTE
    │   └── package.json
    │
    ├── backend/                                ← Backend API (TODO: restaurar)
    │   └── src/
    │       ├── routes/
    │       │   └── fornecedores-unified.ts
    │       └── server.ts
    │
    └── frontend/                               ← Frontend React (TODO: restaurar)
        └── src/
            ├── hooks/
            │   └── useFornecedoresData.ts
            └── components/
                └── FornecedoresList.tsx
```

---

## 🔄 FLUXO DE DADOS DETALHADO

### 📥 Extract (API → Data Lake)

```
┌─────────────────────────────────────────────────────────┐
│ API Câmara                                              │
│ GET /deputados?idLegislatura=57                         │
└─────────────────────────────────────────────────────────┘
                    ↓
          [{"id": 160553, "nome": "João Silva"}, ...]
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Para cada deputado:                                     │
│ GET /deputados/160553/despesas?ano=2024                 │
└─────────────────────────────────────────────────────────┘
                    ↓
          [{"mes": 1, "nomeFornecedor": "...", ...}, ...]
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Salva em:                                               │
│ congressoNacional/deputados/160553/despesas.json        │
│                                                         │
│ {                                                       │
│   "deputado": {"id": 160553, "nome": "João Silva"},    │
│   "despesas": [...],                                    │
│   "metadata": {...}                                     │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Transform (Data Lake → Processados)

```
┌─────────────────────────────────────────────────────────┐
│ Lê: congressoNacional/deputados/*/despesas.json        │
└─────────────────────────────────────────────────────────┘
                    ↓
          Processa cada deputado
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Agrega fornecedores:                                    │
│                                                         │
│ Map<CNPJ, {                                             │
│   totalRecebido: number,                                │
│   numeroTransacoes: number,                             │
│   deputados: Set<id>                                    │
│ }>                                                      │
└─────────────────────────────────────────────────────────┘
                    ↓
          Gera listas consolidadas
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Salva em:                                               │
│ monitordespesas/deputados.json                          │
│ monitordespesas/fornecedores.json                       │
└─────────────────────────────────────────────────────────┘
```

### 🗄️ Load (Processados → SQLite)

```
┌─────────────────────────────────────────────────────────┐
│ Lê: monitordespesas/*.json                              │
└─────────────────────────────────────────────────────────┘
                    ↓
          Cria banco SQLite
                    ↓
┌─────────────────────────────────────────────────────────┐
│ CREATE TABLE fornecedores (...)                         │
│ CREATE INDEX idx_fornecedores_total ON ...              │
└─────────────────────────────────────────────────────────┘
                    ↓
          Insere dados em lote (transaction)
                    ↓
┌─────────────────────────────────────────────────────────┐
│ INSERT INTO fornecedores VALUES (...)                   │
│ • 1.234 fornecedores inseridos                          │
└─────────────────────────────────────────────────────────┘
                    ↓
          Gera arquivos complementares
                    ↓
┌─────────────────────────────────────────────────────────┐
│ Salva em:                                               │
│ monitordespesas/monitordespesas.db (1.2 MB)             │
│ monitordespesas/agregados.json                          │
│ monitordespesas/manifest.json                           │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 COMANDOS POR ETAPA

### 1️⃣ Extract
```bash
cd packages/etl
npm run etl:despesas:pc -- 57 5
```

**Output esperado:**
```
🚀 Iniciando processo ETL — DESPESAS
📊 Legislatura: 57
👥 Limite: 5 deputados
💾 Destino: pc

Processando deputado João Silva (1/5)
✓ Deputado 160553 (João Silva)
Processando deputado Maria Santos (2/5)
✓ Deputado 160560 (Maria Santos)
...

✅ 5 deputados salvos em: bancodeDados/congressoNacional
```

### 2️⃣ Transform + Load
```bash
npm run materialize
```

**Output esperado:**
```
╔═══════════════════════════════════════════════════╗
║  🔄 Iniciando Pipeline: Transform + Load         ║
╚═══════════════════════════════════════════════════╝

🔄 Iniciando Transform: Data Lake → Monitor Despesas
📖 Lidos 5 deputados do Data Lake
✅ Deputados: 5 registros
✅ Fornecedores: 123 registros
✅ Transform concluído com sucesso

🗄️ Iniciando Load: JSON → SQLite
✅ Fornecedores inseridos: 123
✅ Deputados inseridos: 5
✅ SQLite criado: bancodeDados/monitordespesas/monitordespesas.db
✅ Agregados gerados
✅ Manifest gerado
✅ Load concluído com sucesso

╔═══════════════════════════════════════════════════╗
║  ✅ Pipeline completo: Transform + Load          ║
╚═══════════════════════════════════════════════════╝
```

### 3️⃣ Validação
```bash
# Estrutura de diretórios
dir bancodeDados\congressoNacional\deputados
dir bancodeDados\monitordespesas

# Testar SQLite
sqlite3 bancodeDados\monitordespesas\monitordespesas.db
```

**SQL queries:**
```sql
-- Contar fornecedores
SELECT COUNT(*) FROM fornecedores;
-- Resultado: 123

-- Top 10 fornecedores
SELECT nome, totalRecebido 
FROM fornecedores 
ORDER BY totalRecebido DESC 
LIMIT 10;

-- Estatísticas gerais
SELECT 
  COUNT(*) as total_fornecedores,
  SUM(totalRecebido) as total_gasto,
  AVG(totalRecebido) as media_por_fornecedor
FROM fornecedores;
```

---

## 📊 ARQUIVOS GERADOS (Tamanhos Esperados)

### Após Extract (5 deputados)
```
congressoNacional/deputados/
├── 160553/despesas.json    (~50 KB)
├── 160560/despesas.json    (~45 KB)
├── 160578/despesas.json    (~38 KB)
├── 160589/despesas.json    (~42 KB)
└── 160601/despesas.json    (~48 KB)
Total: ~223 KB
```

### Após Transform
```
monitordespesas/
├── deputados.json         (~2 KB)
└── fornecedores.json      (~30 KB)
Total: ~32 KB
```

### Após Load
```
monitordespesas/
├── monitordespesas.db     (~80 KB)
├── deputados.json         (~2 KB)
├── fornecedores.json      (~30 KB)
├── agregados.json         (~1 KB)
└── manifest.json          (~1 KB)
Total: ~114 KB
```

**Nota:** Tamanhos para 5 deputados. Para legislatura completa (513 deputados), multiplicar por ~100.

---

## 🔍 PROBLEMAS CONHECIDOS E SOLUÇÕES

### ❌ Erro: "Cannot find module 'better-sqlite3'"
**Solução:**
```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### ❌ Erro: "ENOENT: no such file or directory"
**Causa:** Paths hardcoded ainda presentes  
**Solução:** Verificar que `data-lake-paths.ts` foi criado e importado

### ❌ Erro: "Data Lake não encontrado"
**Causa:** Extract não foi executado antes do Transform  
**Solução:** Executar `npm run etl:despesas:pc` primeiro

### ❌ TypeScript error: "Cannot use import statement outside a module"
**Solução:**
```bash
npm run build  # Compila TypeScript
```

---

## 📚 REFERÊNCIAS ÚTEIS

- **Documentação completa:** `DIAGNOSTICO-RESTAURACAO-ETL.md`
- **Guia passo a passo:** `GUIA-RAPIDO-3-PASSOS.md`
- **Resumo executivo:** `RESUMO-EXECUTIVO-DIAGNOSTICO.md`
- **Fluxograma original:** `fluxograma apartir do data lake.txt`

---

**Última atualização:** 21/10/2025  
**Versão:** 1.0
