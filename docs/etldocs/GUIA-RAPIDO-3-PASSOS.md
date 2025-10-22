# 🚀 GUIA RÁPIDO: Corrija o ETL em 3 Passos

**Objetivo:** Alinhar o ETL recuperado com o fluxograma correto  
**Tempo total:** ~8 horas  
**Status atual:** ⚠️ ETL parcialmente funcional (só Extract)

---

## 📊 SITUAÇÃO ATUAL vs IDEAL

### ❌ Como está agora (ERRADO)
```
API → Extract → despesas_deputados_leg57.json (arquivo único)
                         ↓
                    [FIM - pipeline incompleto]
```

### ✅ Como deve ser (CORRETO - conforme fluxograma)
```
API → Extract → congressoNacional/deputados/{id}/despesas.json (um por deputado)
                         ↓
               Transform → monitordespesas/deputados.json + fornecedores.json
                         ↓
                   Load → monitordespesas.db + agregados.json + manifest.json
                         ↓
               Backend API → REST endpoints
                         ↓
            Frontend React → Interface do usuário
```

---

## 🎯 PASSO 1: Corrigir Paths Hardcoded (30 min)

### 1.1 Criar arquivo de configuração de paths

**Criar:** `packages/etl/src/config/data-lake-paths.ts`

```typescript
import * as path from 'path';

// Base do Data Lake (relativo ao projeto)
export const DATA_LAKE_ROOT = path.resolve(process.cwd(), 'bancodeDados');

// Paths específicos
export const DATA_LAKE_PATHS = {
  // Raw data (Extract output)
  congressoNacional: {
    root: path.join(DATA_LAKE_ROOT, 'congressoNacional'),
    deputados: (id: number) => path.join(DATA_LAKE_ROOT, 'congressoNacional', 'deputados', String(id)),
    despesas: (id: number) => path.join(DATA_LAKE_ROOT, 'congressoNacional', 'deputados', String(id), 'despesas.json'),
    perfil: (id: number) => path.join(DATA_LAKE_ROOT, 'congressoNacional', 'deputados', String(id), 'perfil.json'),
  },
  // Processed data (Transform/Load output)
  monitorDespesas: {
    root: path.join(DATA_LAKE_ROOT, 'monitordespesas'),
    deputados: path.join(DATA_LAKE_ROOT, 'monitordespesas', 'deputados.json'),
    fornecedores: path.join(DATA_LAKE_ROOT, 'monitordespesas', 'fornecedores.json'),
    database: path.join(DATA_LAKE_ROOT, 'monitordespesas', 'monitordespesas.db'),
    despesas: path.join(DATA_LAKE_ROOT, 'monitordespesas', 'despesas.json'),
    agregados: path.join(DATA_LAKE_ROOT, 'monitordespesas', 'agregados.json'),
    manifest: path.join(DATA_LAKE_ROOT, 'monitordespesas', 'manifest.json'),
  }
};
```

### 1.2 Substituir linha 272 em despesas-deputados.processor.ts

**Antes:**
```typescript
const bancoDir = path.resolve('C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica\\Sistema ETL\\bancodeDados');
```

**Depois:**
```typescript
import { DATA_LAKE_PATHS } from '../config/data-lake-paths.js';
// ... (remover linha 272 completamente, será substituída abaixo)
```

### 1.3 Refatorar método saveToPC() completo

**Substituir o método inteiro (linhas ~250-290):**

```typescript
private async saveToPC(data: DespesaDeputado[]): Promise<void> {
  logger.info(`Salvando ${data.length} deputados no Data Lake...`);
  
  // Salvar cada deputado individualmente no Data Lake
  for (const deputado of data) {
    const deputadoDir = DATA_LAKE_PATHS.congressoNacional.deputados(deputado.id);
    await fs.ensureDir(deputadoDir);
    
    // Salvar despesas brutas
    const despesasPath = DATA_LAKE_PATHS.congressoNacional.despesas(deputado.id);
    await fs.writeJson(despesasPath, {
      deputado: {
        id: deputado.id,
        nome: deputado.nomeEleitoral,
        nomeCivil: deputado.nomeCivil,
        uri: deputado.uri
      },
      despesas: deputado.despesas,
      metadata: {
        legislatura: this.options.legislatura,
        timestamp: new Date().toISOString(),
        totalDespesas: deputado.totalDespesas,
        numeroDespesas: deputado.despesas.length
      }
    }, { spaces: 2 });
    
    logger.info(`✓ Deputado ${deputado.id} (${deputado.nomeEleitoral})`);
  }
  
  logger.info(`✅ ${data.length} deputados salvos em: ${DATA_LAKE_PATHS.congressoNacional.root}`);
}
```

### ✅ Resultado esperado

```
bancodeDados/
└── congressoNacional/
    └── deputados/
        ├── 160553/
        │   └── despesas.json
        ├── 160560/
        │   └── despesas.json
        └── ...
```

---

## 🎯 PASSO 2: Implementar Transform (2 horas)

### 2.1 Criar materializer

**Criar:** `packages/etl/src/materializers/materialize-monitor-despesas.ts`

```typescript
import * as fs from 'fs-extra';
import * as path from 'path';
import { DATA_LAKE_PATHS } from '../config/data-lake-paths.js';
import { logger } from '../utils/logger.js';

export interface DeputadoShard {
  id: number;
  nome: string;
  totalDespesas: number;
  despesas: any[];
}

/**
 * Lê dados do Data Lake (congressoNacional/deputados)
 * e retorna estrutura consolidada para processamento
 */
export async function readDeputadosFromLake(): Promise<DeputadoShard[]> {
  const deputadosDir = path.join(DATA_LAKE_PATHS.congressoNacional.root, 'deputados');
  
  if (!await fs.pathExists(deputadosDir)) {
    throw new Error(`Data Lake não encontrado: ${deputadosDir}`);
  }
  
  const entries = await fs.readdir(deputadosDir, { withFileTypes: true });
  const deputados: DeputadoShard[] = [];
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    
    const deputadoId = parseInt(entry.name, 10);
    const despesasFile = DATA_LAKE_PATHS.congressoNacional.despesas(deputadoId);
    
    if (!await fs.pathExists(despesasFile)) {
      logger.warn(`Arquivo não encontrado: ${despesasFile}`);
      continue;
    }
    
    const rawData = await fs.readJSON(despesasFile);
    
    deputados.push({
      id: deputadoId,
      nome: rawData.deputado.nome,
      totalDespesas: rawData.metadata.totalDespesas,
      despesas: rawData.despesas
    });
  }
  
  logger.info(`📖 Lidos ${deputados.length} deputados do Data Lake`);
  return deputados;
}

/**
 * Processa dados do Data Lake e salva em monitordespesas/
 */
export async function materializeMonitorDespesas(): Promise<void> {
  logger.info('🔄 Iniciando Transform: Data Lake → Monitor Despesas');
  
  // 1. Ler do Data Lake
  const deputados = await readDeputadosFromLake();
  
  // 2. Processar e agregar fornecedores
  const fornecedoresMap = new Map();
  
  for (const deputado of deputados) {
    for (const despesa of deputado.despesas) {
      const key = despesa.cnpjCpfFornecedor || despesa.nomeFornecedor;
      
      if (!fornecedoresMap.has(key)) {
        fornecedoresMap.set(key, {
          id: key,
          nome: despesa.nomeFornecedor,
          cnpjCpf: despesa.cnpjCpfFornecedor || '',
          totalRecebido: 0,
          numeroTransacoes: 0,
          deputados: new Set()
        });
      }
      
      const fornecedor = fornecedoresMap.get(key);
      fornecedor.totalRecebido += despesa.valorLiquido || 0;
      fornecedor.numeroTransacoes++;
      fornecedor.deputados.add(deputado.id);
    }
  }
  
  // 3. Salvar dados processados
  await fs.ensureDir(DATA_LAKE_PATHS.monitorDespesas.root);
  
  // Deputados processados
  const deputadosProcessados = deputados.map(d => ({
    id: d.id,
    nome: d.nome,
    totalDespesas: d.totalDespesas,
    numeroDespesas: d.despesas.length
  }));
  
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.deputados, deputadosProcessados, { spaces: 2 });
  logger.info(`✅ Deputados: ${deputadosProcessados.length} registros`);
  
  // Fornecedores agregados
  const fornecedores = Array.from(fornecedoresMap.values()).map(f => ({
    id: f.id,
    nome: f.nome,
    cnpjCpf: f.cnpjCpf,
    totalRecebido: f.totalRecebido,
    numeroTransacoes: f.numeroTransacoes,
    numeroDeputados: f.deputados.size
  }));
  
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.fornecedores, fornecedores, { spaces: 2 });
  logger.info(`✅ Fornecedores: ${fornecedores.length} registros`);
  
  logger.info('✅ Transform concluído com sucesso');
}
```

### ✅ Resultado esperado

```
bancodeDados/monitordespesas/
├── deputados.json       ← Lista processada de deputados
└── fornecedores.json    ← Lista agregada de fornecedores
```

---

## 🎯 PASSO 3: Implementar Load (2 horas)

### 3.1 Instalar SQLite

```bash
cd packages/etl
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

### 3.2 Criar materializer SQLite

**Criar:** `packages/etl/src/materializers/materialize-unified.ts`

```typescript
import Database from 'better-sqlite3';
import * as fs from 'fs-extra';
import { DATA_LAKE_PATHS } from '../config/data-lake-paths.js';
import { logger } from '../utils/logger.js';

export async function materializeSQLite(): Promise<void> {
  logger.info('🗄️ Iniciando Load: JSON → SQLite');
  
  // 1. Ler dados processados
  const deputados = await fs.readJSON(DATA_LAKE_PATHS.monitorDespesas.deputados);
  const fornecedores = await fs.readJSON(DATA_LAKE_PATHS.monitorDespesas.fornecedores);
  
  // 2. Criar banco SQLite
  const dbPath = DATA_LAKE_PATHS.monitorDespesas.database;
  const db = new Database(dbPath);
  
  // 3. Criar schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS fornecedores (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cnpjCpf TEXT,
      totalRecebido REAL,
      numeroTransacoes INTEGER,
      numeroDeputados INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_fornecedores_total ON fornecedores(totalRecebido DESC);
    CREATE INDEX IF NOT EXISTS idx_fornecedores_nome ON fornecedores(nome);
    
    CREATE TABLE IF NOT EXISTS deputados (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      totalDespesas REAL,
      numeroDespesas INTEGER
    );
    
    CREATE INDEX IF NOT EXISTS idx_deputados_total ON deputados(totalDespesas DESC);
  `);
  
  // 4. Inserir fornecedores
  const insertFornecedor = db.prepare(`
    INSERT OR REPLACE INTO fornecedores 
    (id, nome, cnpjCpf, totalRecebido, numeroTransacoes, numeroDeputados)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertManyFornecedores = db.transaction((rows) => {
    for (const row of rows) {
      insertFornecedor.run(row.id, row.nome, row.cnpjCpf, row.totalRecebido, row.numeroTransacoes, row.numeroDeputados);
    }
  });
  
  insertManyFornecedores(fornecedores);
  logger.info(`✅ Fornecedores inseridos: ${fornecedores.length}`);
  
  // 5. Inserir deputados
  const insertDeputado = db.prepare(`
    INSERT OR REPLACE INTO deputados (id, nome, totalDespesas, numeroDespesas)
    VALUES (?, ?, ?, ?)
  `);
  
  const insertManyDeputados = db.transaction((rows) => {
    for (const row of rows) {
      insertDeputado.run(row.id, row.nome, row.totalDespesas, row.numeroDespesas);
    }
  });
  
  insertManyDeputados(deputados);
  logger.info(`✅ Deputados inseridos: ${deputados.length}`);
  
  db.close();
  logger.info(`✅ SQLite criado: ${dbPath}`);
  
  // 6. Gerar agregados
  const totalGasto = fornecedores.reduce((sum, f) => sum + f.totalRecebido, 0);
  
  const agregados = {
    totalFornecedores: fornecedores.length,
    totalDeputados: deputados.length,
    totalGasto: totalGasto,
    mediaGastoPorDeputado: totalGasto / deputados.length,
    maiorFornecedor: fornecedores.reduce((max, f) => f.totalRecebido > max.totalRecebido ? f : max),
    timestamp: new Date().toISOString()
  };
  
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.agregados, agregados, { spaces: 2 });
  logger.info('✅ Agregados gerados');
  
  // 7. Gerar manifest
  const manifest = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    files: {
      database: 'monitordespesas.db',
      deputados: 'deputados.json',
      fornecedores: 'fornecedores.json',
      agregados: 'agregados.json'
    },
    stats: {
      deputados: deputados.length,
      fornecedores: fornecedores.length,
      totalGasto: agregados.totalGasto
    }
  };
  
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.manifest, manifest, { spaces: 2 });
  logger.info('✅ Manifest gerado');
  
  logger.info('✅ Load concluído com sucesso');
}
```

### 3.3 Criar script CLI para executar Transform + Load

**Criar:** `packages/etl/src/cli/materialize-runner.ts`

```typescript
import { materializeMonitorDespesas } from '../materializers/materialize-monitor-despesas.js';
import { materializeSQLite } from '../materializers/materialize-unified.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  🔄 Iniciando Pipeline: Transform + Load         ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    
    // Transform: Data Lake → monitordespesas JSONs
    await materializeMonitorDespesas();
    
    console.log('');
    
    // Load: monitordespesas JSONs → SQLite
    await materializeSQLite();
    
    console.log('\n╔═══════════════════════════════════════════════════╗');
    console.log('║  ✅ Pipeline completo: Transform + Load          ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');
    
  } catch (error) {
    logger.error('❌ Erro no pipeline:', error);
    process.exit(1);
  }
}

main();
```

### 3.4 Adicionar script no package.json

Adicionar dentro de `"scripts":`:
```json
"materialize": "npm run build && node dist/cli/materialize-runner.js"
```

### ✅ Resultado esperado

```
bancodeDados/monitordespesas/
├── monitordespesas.db      ← SQLite otimizado com índices
├── deputados.json          ← Lista processada
├── fornecedores.json       ← Lista agregada
├── agregados.json          ← Métricas pré-calculadas
└── manifest.json           ← Metadados do pipeline
```

---

## 🚀 COMANDOS FINAIS (Executar em ordem)

### 1. Instalar dependências
```bash
cd packages/etl
npm install
```

### 2. Compilar TypeScript
```bash
npm run build
```

### 3. Executar Extract (API → Data Lake)
```bash
npm run etl:despesas:pc -- 57 5
```

**O que deve acontecer:**
- ✅ Busca 5 deputados da legislatura 57
- ✅ Salva em `bancodeDados/congressoNacional/deputados/{id}/despesas.json`

### 4. Executar Transform + Load (Data Lake → SQLite)
```bash
npm run materialize
```

**O que deve acontecer:**
- ✅ Lê deputados de `congressoNacional/deputados/`
- ✅ Processa e salva em `monitordespesas/deputados.json` e `fornecedores.json`
- ✅ Cria `monitordespesas.db` com índices
- ✅ Gera `agregados.json` e `manifest.json`

### 5. Validar resultado
```bash
# Verificar estrutura
dir bancodeDados\congressoNacional\deputados
dir bancodeDados\monitordespesas

# Testar SQLite
sqlite3 bancodeDados\monitordespesas\monitordespesas.db
```

**No SQLite:**
```sql
-- Ver quantos fornecedores
SELECT COUNT(*) FROM fornecedores;

-- Top 10 fornecedores
SELECT nome, totalRecebido FROM fornecedores ORDER BY totalRecebido DESC LIMIT 10;

-- Ver deputados
SELECT COUNT(*) FROM deputados;
```

---

## ✅ CHECKLIST DE VALIDAÇÃO

Execute após cada passo:

### Após Passo 1 (Paths)
- [ ] Arquivo `data-lake-paths.ts` criado
- [ ] Import adicionado em `despesas-deputados.processor.ts`
- [ ] Método `saveToPC()` refatorado
- [ ] `npm run build` compila sem erros

### Após Passo 2 (Transform)
- [ ] Arquivo `materialize-monitor-despesas.ts` criado
- [ ] Função `readDeputadosFromLake()` implementada
- [ ] `npm run build` compila sem erros

### Após Passo 3 (Load)
- [ ] `better-sqlite3` instalado
- [ ] Arquivo `materialize-unified.ts` criado
- [ ] Script `materialize-runner.ts` criado
- [ ] Script `materialize` adicionado ao `package.json`
- [ ] `npm run build` compila sem erros

### Após tudo (Validação final)
- [ ] Extract cria estrutura `congressoNacional/deputados/{id}/`
- [ ] Transform cria `monitordespesas/deputados.json` e `fornecedores.json`
- [ ] Load cria `monitordespesas.db`
- [ ] SQLite possui tabelas `fornecedores` e `deputados` populadas
- [ ] Arquivos `agregados.json` e `manifest.json` existem

---

## 🎯 PRÓXIMOS PASSOS (Após ETL 100%)

1. **Verificar backup do Backend** em `packages/backup/`
2. **Restaurar ou criar Backend API** (Express servindo SQLite)
3. **Verificar backup do Frontend** em `packages/backup/`
4. **Restaurar ou criar Frontend React** (consumindo Backend)

---

**Tempo estimado total:** ~8 horas  
**Dificuldade:** Média  
**Resultado:** ETL 100% funcional alinhado com fluxograma

**Última atualização:** 21/10/2025
