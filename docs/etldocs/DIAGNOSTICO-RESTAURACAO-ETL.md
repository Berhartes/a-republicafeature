# 🔍 DIAGNÓSTICO: Restauração do Sistema ETL para Arquitetura Ideal

**Data:** 21 de outubro de 2025  
**Status:** Em análise e correção  
**Objetivo:** Alinhar o ETL recuperado com o fluxograma correto (docs/fluxograma apartir do data lake.txt)

---

## 📋 ARQUITETURA ALVO (Conforme Fluxograma)

### Fluxo Cronológico Correto

```
1. APIs Externas (dadosabertos.camara.leg.br)
   ↓ [ETL Extract - DespesasDeputadosProcessor.extract()]

2. Data Lake (/bancodeDados/congressoNacional/deputados/{id}/*.json)
   ↓ [ETL Transform - readDeputadosFromLake()]

3. Dados Processados (/bancodeDados/monitordespesas/*.json)
   ↓ [ETL Load - materializeSQLite()]

4. SQLite Materializado (monitordespesas.db)
   ↓ [Backend API - fornecedores-unified.ts]

5. REST API (http://localhost:3333/gastos/fornecedores)
   ↓ [Frontend React - useFornecedoresData()]

6. Interface do Usuário (localhost:3000)
```

### Estrutura de Diretórios Ideal

```
packages/etl/
├── bancodeDados/                          # ← DATA LAKE
│   ├── congressoNacional/                 # ← Extract salva aqui (raw data)
│   │   └── deputados/
│   │       ├── 160553/
│   │       │   ├── despesas-2024.json     # ← Dados brutos da API
│   │       │   └── perfil.json
│   │       └── 178957/
│   │           └── despesas-2024.json
│   └── monitordespesas/                   # ← Transform/Load salvam aqui (processed data)
│       ├── deputados/
│       │   └── deputados.json             # ← Dados transformados
│       ├── fornecedores/
│       │   └── fornecedores.json
│       ├── monitordespesas.db             # ← SQLite materializado (Load)
│       ├── despesas.json                  # ← JSON otimizado
│       ├── agregados.json                 # ← Métricas pré-calculadas
│       └── manifest.json                  # ← Metadados
└── src/
    ├── processors/                        # ← EXTRACT
    │   └── despesas-deputados.processor.ts
    ├── materializers/                     # ← TRANSFORM + LOAD
    │   ├── materialize-monitor-despesas.ts
    │   └── materialize-unified.ts
    └── scripts/
        └── cli/
            └── etl-runner.ts
```

---

## ✅ ESTADO ATUAL: O que está funcionando

### 1. Estrutura Base Recuperada

✅ **Diretório packages/etl** restaurado do backup ETLSistema  
✅ **Processors implementados:**
   - `src/processors/despesas-deputados.processor.ts` (com lógica Extract completa)
   - `src/processors/premiacoes.processor.ts`
   
✅ **Scripts CLI operacionais:**
   - `src/cli/etl-runner.ts` (comandos pnpm run etl:despesas:pc)
   
✅ **Configurações:**
   - `package.json` com scripts NPM configurados
   - `tsconfig.json` presente
   - `.env.example` disponível

✅ **Data Lake de exemplo:**
   - `bancodeDados/` presente com dados de referência
   - Um arquivo `despesas_deputados_leg57_2025-10-08.json` encontrado

### 2. Processor Principal (Extract) Implementado

✅ **DespesasDeputadosProcessor** possui:
   - ✅ Método `extract()`: busca dados da API Câmara
   - ✅ Método `transform()`: processa dados brutos
   - ✅ Método `load()`: salva no destino
   - ✅ Deduplicação baseada em `codDocumento-numDocumento`
   - ✅ Paginação com `getAllPages()`
   - ✅ Agregação de fornecedores

---

## ⚠️ PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICO: Caminhos Hardcoded

**Linha 272 do despesas-deputados.processor.ts:**
```typescript
const bancoDir = path.resolve('C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica\\Sistema ETL\\bancodeDados');
```

**Problema:** Path absoluto do Windows impede portabilidade.  
**Impacto:** Quebra em outro ambiente ou máquina.

**Outros locais com paths hardcoded:**
- `src/utils/fornecedor-monitoring.ts` (linha 54-55)
- `src/scripts/corrigir-fornecedores-diversos.ts` (linha 61, 63)

### 🟡 IMPORTANTE: Divergência na Estrutura de Salvamento

**Estado atual:**
O processor `DespesasDeputadosProcessor.saveToPC()` salva em:
```
bancodeDados/
└── despesas_deputados_leg57_2025-10-08.json    ← Arquivo único consolidado
```

**Estado esperado (fluxograma):**
```
bancodeDados/
├── congressoNacional/
│   └── deputados/
│       ├── 160553/
│       │   └── despesas-2024.json              ← Um arquivo por deputado
│       └── 178957/
│           └── despesas-2024.json
```

**Consequência:** A etapa Transform não conseguirá ler do Data Lake no formato correto.

### 🟡 IMPORTANTE: Materializers não implementados

**Faltando:**
- ❌ `src/materializers/materialize-monitor-despesas.ts`
- ❌ `src/materializers/materialize-unified.ts`
- ❌ Função `readDeputadosFromLake()`
- ❌ Função `materializeSQLite()`

**Consequência:** Não há Transform (Data Lake → processados) nem Load (SQLite).

### 🟢 MENOR: Dependências não instaladas

❌ `node_modules/` não existe  
❌ Precisa executar `npm install` ou `pnpm install`

---

## 🎯 GAPS vs ARQUITETURA IDEAL

| Etapa | Esperado | Estado Atual | Status |
|-------|----------|--------------|---------|
| **1. Extract** | Buscar API → salvar em `congressoNacional/deputados/{id}/` | ✅ Implementado, mas salva em arquivo único | 🟡 Precisa ajuste |
| **2. Data Lake** | Estrutura `congressoNacional/` + `monitordespesas/` | ⚠️ Só tem arquivo único consolidado | 🔴 Falta estrutura |
| **3. Transform** | Ler Data Lake → processar → salvar em `monitordespesas/` | ❌ Não implementado | 🔴 Falta implementar |
| **4. Load** | Gerar SQLite + JSONs otimizados em `monitordespesas/` | ❌ Não implementado | 🔴 Falta implementar |
| **5. Backend** | API REST servindo dados materializados | ❌ Não presente no ETL | 🔴 Falta projeto backend |
| **6. Frontend** | Interface consumindo Backend API | ❌ Não presente no ETL | 🔴 Falta projeto frontend |

---

## 📝 PLANO DE CORREÇÃO (Priorizado)

### 🚨 FASE 1: Corrigir Extract e Data Lake

#### 1.1 Instalar Dependências
```bash
cd packages/etl
npm install
# ou
pnpm install
```

#### 1.2 Criar Arquivo de Configuração de Paths
**Criar:** `src/config/data-lake-paths.ts`
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

#### 1.3 Refatorar DespesasDeputadosProcessor.saveToPC()
Mudar de "salvar arquivo único" para "salvar um arquivo por deputado":

**Antes:**
```typescript
const nomeArquivo = `despesas_deputados_leg${this.options.legislatura}_${new Date().toISOString().slice(0, 10)}.json`;
await fs.writeJson(path.join(bancoDir, nomeArquivo), bancoDados, { spaces: 2 });
```

**Depois:**
```typescript
import { DATA_LAKE_PATHS } from '../config/data-lake-paths.js';

private async saveToPC(data: DespesaDeputado[]): Promise<void> {
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
        uri: deputado.uri
      },
      despesas: deputado.despesas,
      metadata: {
        legislatura: this.options.legislatura,
        timestamp: new Date().toISOString(),
        totalDespesas: deputado.totalDespesas
      }
    }, { spaces: 2 });
    
    logger.info(`Salvo: ${despesasPath}`);
  }
}
```

#### 1.4 Remover Hardcoded Paths
Substituir todos os `path.resolve('C:\\Users\\...')` por `DATA_LAKE_PATHS`.

---

### 🚨 FASE 2: Implementar Transform (Data Lake → Processados)

#### 2.1 Criar Materializer Base
**Criar:** `src/materializers/materialize-monitor-despesas.ts`

```typescript
import * as fs from 'fs-extra';
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
  const deputadosDir = DATA_LAKE_PATHS.congressoNacional.root + '/deputados';
  
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
      logger.warn(`Arquivo de despesas não encontrado: ${despesasFile}`);
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
  
  logger.info(`Lidos ${deputados.length} deputados do Data Lake`);
  return deputados;
}

/**
 * Processa dados do Data Lake e salva em monitordespesas/
 */
export async function materializeMonitorDespesas(): Promise<void> {
  logger.info('🔄 Iniciando Transform: Data Lake → Monitor Despesas');
  
  // 1. Ler do Data Lake
  const deputados = await readDeputadosFromLake();
  
  // 2. Processar e agregar
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
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.deputados, 
    deputados.map(d => ({
      id: d.id,
      nome: d.nome,
      totalDespesas: d.totalDespesas,
      numeroDespesas: d.despesas.length
    })), { spaces: 2 });
  
  // Fornecedores agregados
  const fornecedores = Array.from(fornecedoresMap.values()).map(f => ({
    ...f,
    numeroDeputados: f.deputados.size,
    deputados: undefined // Remove Set antes de serializar
  }));
  
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.fornecedores, fornecedores, { spaces: 2 });
  
  logger.info(`✅ Transform concluído: ${deputados.length} deputados, ${fornecedores.length} fornecedores`);
}
```

#### 2.2 Adicionar Script CLI para Transform
**Criar:** `src/cli/materialize-runner.ts`
```typescript
import { materializeMonitorDespesas } from '../materializers/materialize-monitor-despesas.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    await materializeMonitorDespesas();
    logger.info('✅ Materialização concluída com sucesso');
  } catch (error) {
    logger.error('❌ Erro na materialização:', error);
    process.exit(1);
  }
}

main();
```

#### 2.3 Adicionar Script no package.json
```json
{
  "scripts": {
    "materialize": "npm run build && node dist/cli/materialize-runner.js"
  }
}
```

---

### 🚨 FASE 3: Implementar Load (SQLite + Otimizações)

#### 3.1 Instalar Dependências SQLite
```bash
npm install better-sqlite3
npm install -D @types/better-sqlite3
```

#### 3.2 Criar Materializer SQLite
**Criar:** `src/materializers/materialize-unified.ts`
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
  `);
  
  // 4. Inserir dados
  const insertStmt = db.prepare(`
    INSERT OR REPLACE INTO fornecedores 
    (id, nome, cnpjCpf, totalRecebido, numeroTransacoes, numeroDeputados)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  const insertMany = db.transaction((rows) => {
    for (const row of rows) {
      insertStmt.run(row.id, row.nome, row.cnpjCpf, row.totalRecebido, row.numeroTransacoes, row.numeroDeputados);
    }
  });
  
  insertMany(fornecedores);
  
  db.close();
  
  logger.info(`✅ SQLite criado: ${dbPath} (${fornecedores.length} fornecedores)`);
  
  // 5. Gerar agregados
  const agregados = {
    totalFornecedores: fornecedores.length,
    totalDeputados: deputados.length,
    totalGasto: fornecedores.reduce((sum, f) => sum + f.totalRecebido, 0),
    mediaGastoPorDeputado: fornecedores.reduce((sum, f) => sum + f.totalRecebido, 0) / deputados.length,
    timestamp: new Date().toISOString()
  };
  
  await fs.writeJson(DATA_LAKE_PATHS.monitorDespesas.agregados, agregados, { spaces: 2 });
  
  // 6. Gerar manifest
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
  
  logger.info('✅ Load concluído com sucesso');
}
```

#### 3.3 Atualizar materialize-runner.ts
```typescript
import { materializeMonitorDespesas } from '../materializers/materialize-monitor-despesas.js';
import { materializeSQLite } from '../materializers/materialize-unified.js';
import { logger } from '../utils/logger.js';

async function main() {
  try {
    // Transform
    await materializeMonitorDespesas();
    
    // Load
    await materializeSQLite();
    
    logger.info('✅ Pipeline completo: Transform + Load concluído');
  } catch (error) {
    logger.error('❌ Erro no pipeline:', error);
    process.exit(1);
  }
}

main();
```

---

## 🎯 COMANDOS DE TESTE (Após Correções)

### 1. Executar Pipeline Completo

```bash
# 1. Extract (API → Data Lake)
cd packages/etl
pnpm run etl:despesas:pc -- 57 5

# Verificar que foi criado:
# bancodeDados/congressoNacional/deputados/160553/despesas.json
# bancodeDados/congressoNacional/deputados/178957/despesas.json

# 2. Transform + Load (Data Lake → SQLite)
pnpm run materialize

# Verificar que foi criado:
# bancodeDados/monitordespesas/monitordespesas.db
# bancodeDados/monitordespesas/deputados.json
# bancodeDados/monitordespesas/fornecedores.json
# bancodeDados/monitordespesas/agregados.json
# bancodeDados/monitordespesas/manifest.json
```

### 2. Validar Estrutura do Data Lake

```bash
# Verificar estrutura de diretórios
ls -R bancodeDados/

# Deve mostrar:
# bancodeDados/
# ├── congressoNacional/
# │   └── deputados/
# │       ├── 160553/
# │       │   └── despesas.json
# │       └── ...
# └── monitordespesas/
#     ├── monitordespesas.db
#     ├── deputados.json
#     └── fornecedores.json
```

### 3. Testar SQLite

```bash
# Abrir banco e testar query
sqlite3 bancodeDados/monitordespesas/monitordespesas.db

# Query de teste:
SELECT nome, totalRecebido 
FROM fornecedores 
ORDER BY totalRecebido DESC 
LIMIT 10;
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

- [ ] ✅ Dependências instaladas (`npm install`)
- [ ] ✅ TypeScript compila sem erros (`npm run build`)
- [ ] ✅ Arquivo `data-lake-paths.ts` criado
- [ ] ✅ Paths hardcoded removidos
- [ ] ✅ `DespesasDeputadosProcessor.saveToPC()` refatorado
- [ ] ✅ Extract cria estrutura `congressoNacional/deputados/{id}/`
- [ ] ✅ `materialize-monitor-despesas.ts` implementado
- [ ] ✅ `materialize-unified.ts` implementado
- [ ] ✅ SQLite sendo gerado corretamente
- [ ] ✅ Pipeline Extract → Transform → Load funciona end-to-end
- [ ] ✅ Estrutura do Data Lake alinhada com fluxograma

---

## 📚 REFERÊNCIAS

- **Fluxograma correto:** `docs/fluxograma apartir do data lake.txt`
- **Processor principal:** `packages/etl/src/processors/despesas-deputados.processor.ts`
- **CLI runner:** `packages/etl/src/cli/etl-runner.ts`
- **Package.json:** `packages/etl/package.json`

---

## 🚧 PRÓXIMOS PASSOS (Pós-ETL)

1. **Backend API:** Criar projeto Express servindo dados do SQLite
2. **Frontend React:** Criar interface consumindo Backend API
3. **Deploy:** Configurar CI/CD para automatizar pipeline
4. **Monitoramento:** Adicionar logs e métricas de qualidade de dados

---

**Última atualização:** 21/10/2025  
**Status do projeto:** 🟡 Em restauração — ETL 40% implementado
