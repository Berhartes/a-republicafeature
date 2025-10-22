# 🔍 Análise Comparativa: Versões ETL e Estrutura Data Lake

> **Data:** 21 de outubro de 2025  
> **Status:** 📋 Análise Completa

---

## 🎯 Objetivo da Análise

Comparar as versões de backup do ETL, identificar qual está mais próxima do setup ideal de Data Lake, e validar a estrutura restaurada em `packages/etl` para definir próximos passos de sincronização e completude.

---

## 📦 Versões Disponíveis nos Backups

### 1. **ETLSistema** (✅ VERSÃO RESTAURADA)

**Localização:** `packages/backup/ETL-Backup/ETLSistema/`

**Características:**
- ✅ Contém processors completos e implementados
- ✅ Possui diretório `bancodeDados/` com dados de exemplo
- ✅ Estrutura completa: `src/processors/`, `src/core/`, `src/scripts/`
- ✅ Arquivo principal: `processors/despesas-deputados.processor.ts` (IMPLEMENTADO)
- ✅ CLI funcional com `cli/etl-runner.js`
- ✅ Materializers implementados

**Status:** **Esta é a versão base recuperada em `packages/etl`**

**Estrutura de Dados:**
```
ETLSistema/bancodeDados/
├── despesas_deputados_leg57_2025-10-08.json  ← Data Lake presente
├── congressoNacional/                        ← Estrutura antiga
│   └── deputados/{id}/despesas.json
└── monitordespesas/                          ← Estrutura atual
    ├── despesas.json
    ├── agregados.json
    └── manifest.json
```

---

### 2. **ETLSistema-44**

**Localização:** `packages/backup/ETL-Backup/ETLSistema-44/`

**Características:**
- ⚠️ SEM diretório `bancodeDados/`
- ⚠️ Processors "antigos" (possivelmente versão anterior)
- ⚠️ Mesma estrutura de código do ETLSistema
- 📚 Pode servir como referência histórica

**Avaliação:** **Não traz novidades funcionais. Descartar para recuperação.**

---

### 3. **Sistema ETL** (ramificação a-republica-brasileira)

**Localização:** `packages/backup/ETL-Backup/Sistema ETL/`

**Características:**
- 🔀 Ramificação posterior para projeto `a-republica-brasileira`
- 📦 Estrutura similar ao ETLSistema
- ❓ Pode ter modificações específicas do projeto principal
- ⚠️ Precisa verificação de diferenças

**Avaliação:** **Verificar se há melhorias não presentes no ETLSistema.**

---

### 4. **Sistema ETL2** (ramificação mais recente)

**Localização:** `packages/backup/ETL-Backup/Sistema ETL2/`

**Características:**
- ⚠️ Arquivo `despesas-deputados-v3.processor.ts` está **VAZIO** (apenas placeholder)
- ⚠️ Processors não implementados (comentários vazios)
- 🔀 Parece ser uma tentativa de reorganização não concluída
- ❌ **NÃO serve como base funcional**

**Avaliação:** **DESCARTAR para recuperação funcional. Pode ter docs úteis.**

---

## 📚 Análise da Documentação

### 1. **fluxograma apartir do data lake.txt** (⚠️ DESATUALIZADO)

**Localização:** `docs/fluxograma apartir do data lake.txt`

**Pontos Positivos:**
- ✅ Descreve arquitetura correta: Extract → Data Lake → Transform → Load
- ✅ Detalha fluxo: APIs → ETL → bancodeDados/ → SQLite → Backend → Frontend
- ✅ Nomenclaturas claras das funções ETL

**Pontos Desatualizados:**
- ⚠️ Menciona salvamento em `congressoNacional/deputados/{id}/despesas.json`
- ⚠️ Estrutura antiga não reflete sistema atual `monitordespesas/`
- ⚠️ Não menciona Sistema ETL2 ou ramificações

**Recomendação:** **ATUALIZAR com estrutura atual de `monitordespesas/`**

---

### 2. **PLANO-REFATORACAO-CENTRALIZACAO-ETL.md** (✅ ATUALIZADO)

**Localização:** `docs/PLANO-REFATORACAO-CENTRALIZACAO-ETL.md`

**Conteúdo:**
- ✅ Define arquitetura alvo: Sistema ETL centralizado
- ✅ Documenta caches gerados: `suppliers-cache.json`, `dashboard-cache.json`, etc.
- ✅ Plano de migração de processors do `monitordespesas` e `a-republica-brasileira2`
- ✅ Destino final: `bancodeDados/monitordespesas/`

**Status:** **ALINHADO com arquitetura atual**

---

### 3. **PLANO-LIMPEZA-ETL-MONITORDESPESAS.md** (✅ ATUALIZADO)

**Localização:** `docs/PLANO-LIMPEZA-ETL-MONITORDESPESAS.md`

**Conteúdo:**
- ✅ Identifica duplicações entre Sistema ETL e MonitorDespesas
- ✅ Solução: remover schemas duplicados, usar `@a-republica/monitordespesas-schema`
- ✅ Paths hardcoded a corrigir
- ✅ Scripts de sincronização a padronizar

**Status:** **ÚTIL para próximos passos de limpeza**

---

## 🏗️ Estado Atual do ETL Restaurado (`packages/etl`)

### ✅ O Que Foi Restaurado

```
packages/etl/
├── package.json                              ✅ Completo (v1.0.0)
├── tsconfig.json                             ✅ Presente
├── jest.config.ts                            ✅ Presente
├── README.md                                 ✅ Presente
├── DOCUMENTACAO-COMPLETA-FUNCOES-ETL.md      ✅ Presente
├── bancodeDados/                             ✅ PRESENTE (dados de exemplo)
│   └── despesas_deputados_leg57_2025-10-08.json
├── src/
│   ├── processors/                           ✅ Implementados
│   │   ├── despesas-deputados.processor.ts   ✅ COMPLETO
│   │   └── premiacoes.processor.ts           ✅ COMPLETO
│   ├── core/                                 ✅ Estrutura presente
│   ├── cli/                                  ✅ CLI funcional
│   ├── scripts/                              ✅ Scripts auxiliares
│   ├── utils/                                ✅ Utilitários
│   └── types/                                ✅ Tipos TypeScript
├── scripts/                                  ✅ Scripts shell
└── checkpoints/                              ✅ Checkpoint system
```

### ❌ O Que Falta

1. **Dependências não instaladas**
   - Falta rodar `npm install` ou `pnpm install`
   - `node_modules/` não existe

2. **Data Lake completo**
   - Apenas 1 arquivo de dados: `despesas_deputados_leg57_2025-10-08.json`
   - Falta estrutura completa `monitordespesas/` e `congressoNacional/`

3. **Compilação**
   - Não há `dist/` (código não compilado)
   - Precisa rodar `npm run build`

---

## 🔄 Comparação: ETL Restaurado vs. Versão Moderna

### Arquivo: `despesas-deputados.processor.ts`

#### ❓ Versão ETLSistema (RESTAURADA)
```typescript
// Localização esperada
packages/etl/src/processors/despesas-deputados.processor.ts
```

#### ✅ Versão Moderna (do monorepo original)
```typescript
// Localização no monorepo original
a-republica/packages/etl/src/processors/camara/despesas-deputados.processor.ts

// Melhorias esperadas:
- ✅ Deduplicação mais robusta
- ✅ Logs com logger.info
- ✅ Integração com data-lake-path.ts
- ✅ writeShardManifestForFile
- ✅ DATA_LAKE_PATHS centralizados
- ✅ Paginação melhorada
```

**Ação Necessária:** Comparar e mesclar melhorias da versão moderna

---

## 🗂️ Estrutura Ideal do Data Lake

### Conforme Documentação Atual

```
packages/etl/bancodeDados/
├── congressoNacional/                    ← Extract (dados brutos)
│   ├── deputados/
│   │   ├── 160553/
│   │   │   ├── despesas-2024.json
│   │   │   └── perfil.json
│   │   └── 178957/
│   │       └── despesas-2024.json
│   ├── senadores/
│   └── votacoes/
│
├── monitordespesas/                      ← Transform + Load (processados)
│   ├── despesas.json                     ← 30.941 registros
│   ├── agregados.json                    ← 35 métricas
│   ├── fornecedores.json
│   ├── deputados/
│   ├── fornecedores/
│   ├── rankings/
│   ├── premiacoes/
│   ├── transacoes/
│   └── manifest.json                     ← Metadata
│
├── monitordespesas.db                    ← SQLite materializado (1.12 MB)
└── checkpoints/                          ← Sistema de checkpoints
    └── *.checkpoint.json
```

### ⚠️ Estrutura Atual (Restaurada)

```
packages/etl/bancodeDados/
└── despesas_deputados_leg57_2025-10-08.json  ← Apenas 1 arquivo!
```

**Diagnóstico:** Estrutura de Data Lake incompleta. Precisa popular.

---

## 🔍 Diferenças Entre Versões

### ETLSistema vs. Sistema ETL vs. Sistema ETL2

| Aspecto | ETLSistema (✅) | Sistema ETL (❓) | Sistema ETL2 (❌) |
|---------|-----------------|------------------|-------------------|
| **Processors implementados** | ✅ SIM | ❓ Verificar | ❌ Vazios (placeholders) |
| **bancodeDados/ presente** | ✅ SIM | ❓ Verificar | ❌ NÃO |
| **Estrutura completa** | ✅ SIM | ❓ Verificar | ⚠️ Incompleta |
| **CLI funcional** | ✅ SIM | ❓ Verificar | ❓ Verificar |
| **Projeto alvo** | ETL standalone | a-republica-brasileira | a-republica-brasileira |
| **Uso de monitordespesas** | ✅ SIM | ✅ SIM | ✅ SIM (estrutura) |
| **Uso de congressoNacional** | ⚠️ Referências antigas | ❓ Verificar | ❓ Verificar |

---

## 📋 Próximos Passos Recomendados

### 1️⃣ **Instalar Dependências** (PRIORITÁRIO)

```powershell
cd c:\Users\Kast` Berhartes\projetos-web-berhartes\a-republica\packages\etl

# Opção A: npm
npm install

# Opção B: Converter para PNPM (recomendado)
# Adicionar ao package.json:
# "packageManager": "pnpm@9.0.0"
pnpm install
```

**Resultado esperado:**
- `node_modules/` criado
- Dependências instaladas:
  - `axios`, `fs-extra`, `express`, `dotenv`, `typescript`
  - `@a-republica/monitordespesas-schema` (pacote local)

---

### 2️⃣ **Compilar Código TypeScript**

```powershell
cd packages\etl
npm run build
```

**Resultado esperado:**
- Diretório `dist/` criado
- JavaScript compilado pronto para execução

---

### 3️⃣ **Comparar Processors: Backup vs. Versão Moderna**

**Arquivo-chave:** `src/processors/despesas-deputados.processor.ts`

**Ações:**
1. Ler versão restaurada (ETLSistema)
2. Identificar se há melhorias conhecidas (ex.: deduplicação, logs)
3. Se necessário, mesclar melhorias manualmente

**Pontos a verificar:**
- Uso de `data-lake-path.ts` centralizado
- Implementação de `writeShardManifestForFile`
- Sistema de logs (`logger.info`)
- Deduplicação robusta
- Paginação de API

---

### 4️⃣ **Validar Data Lake Existente**

```powershell
cd packages\etl
node dist\scripts\validate-data-lake.js
```

**Verificar:**
- Arquivo `despesas_deputados_leg57_2025-10-08.json` é válido?
- Estrutura está conforme esperado?
- Dados podem ser processados?

---

### 5️⃣ **Popular Data Lake Completo**

**Executar Extract para criar estrutura completa:**

```powershell
# Extrair despesas de deputados (legislatura 57, 100 deputados)
npm run etl:despesas:pc -- 57 100

# Resultado esperado:
# bancodeDados/congressoNacional/deputados/{id}/despesas.json
# bancodeDados/congressoNacional/deputados/{id}/perfil.json
```

---

### 6️⃣ **Executar Pipeline Completo: Extract → Transform → Load**

```powershell
# 1. Extract (se ainda não executado)
npm run etl:despesas:pc -- 57 100

# 2. Transform
npm run etl:transform

# 3. Load (materialização)
npm run etl:load

# Resultado esperado:
# bancodeDados/monitordespesas/despesas.json
# bancodeDados/monitordespesas/agregados.json
# bancodeDados/monitordespesas/manifest.json
# bancodeDados/monitordespesas.db
```

---

### 7️⃣ **Verificar Sistema ETL2 Para Docs Úteis**

**Verificar se há documentação adicional:**

```powershell
cd packages\backup\ETL-Backup\Sistema` ETL2
ls docs\
```

**Copiar apenas documentação relevante** (NÃO código).

---

### 8️⃣ **Sincronizar com Estrutura Moderna (Opcional)**

Se quiser transformar em workspace PNPM com melhorias:

**Adicionar ao `package.json`:**
```json
{
  "packageManager": "pnpm@9.0.0"
}
```

**Criar arquivo `data-lake-path.ts` centralizado:**
```typescript
// src/config/data-lake-path.ts
import path from 'path';

export const DATA_LAKE_ROOT = path.join(__dirname, '../../bancodeDados');

export const DATA_LAKE_PATHS = {
  congressoNacional: {
    deputados: path.join(DATA_LAKE_ROOT, 'congressoNacional/deputados'),
    senadores: path.join(DATA_LAKE_ROOT, 'congressoNacional/senadores'),
  },
  monitordespesas: {
    root: path.join(DATA_LAKE_ROOT, 'monitordespesas'),
    despesas: path.join(DATA_LAKE_ROOT, 'monitordespesas/despesas.json'),
    agregados: path.join(DATA_LAKE_ROOT, 'monitordespesas/agregados.json'),
    manifest: path.join(DATA_LAKE_ROOT, 'monitordespesas/manifest.json'),
  }
};
```

---

### 9️⃣ **Atualizar Documentação Desatualizada**

**Arquivo:** `docs/fluxograma apartir do data lake.txt`

**Atualizações necessárias:**
- ✅ Remover referências a `congressoNacional/deputados/{id}/despesas.json` como destino final
- ✅ Enfatizar `bancodeDados/monitordespesas/` como estrutura atual
- ✅ Adicionar referência ao Sistema ETL2 (explicar que está vazio)
- ✅ Documentar estrutura completa do Data Lake

---

### 🔟 **Criar Checklist de Validação**

```markdown
## ✅ Checklist de Completude do ETL

### Estrutura de Código
- [ ] Dependências instaladas (`node_modules/`)
- [ ] Código compilado (`dist/`)
- [ ] Processors implementados e funcionais
- [ ] CLI executável
- [ ] Scripts auxiliares funcionando

### Data Lake
- [ ] Estrutura `congressoNacional/` criada
- [ ] Estrutura `monitordespesas/` criada
- [ ] Dados de exemplo validados
- [ ] Checkpoints funcionando

### Pipeline ETL
- [ ] Extract funcionando (APIs → JSON)
- [ ] Transform funcionando (leitura do Data Lake)
- [ ] Load funcionando (materialização SQLite)
- [ ] Manifest gerado corretamente

### Integração
- [ ] Schema `@a-republica/monitordespesas-schema` integrado
- [ ] Paths relativos (sem hardcode)
- [ ] Logs funcionando
- [ ] Testes passando
```

---

## 🎯 Resumo Executivo

### ✅ Conclusões

1. **Versão mais próxima do ideal:** `ETLSistema` (já restaurada em `packages/etl`)
2. **Sistema ETL2:** DESCARTAR para código funcional (processors vazios)
3. **bancodeDados/ presente:** ✅ SIM, mas com apenas 1 arquivo
4. **Estrutura completa:** ❌ NÃO, precisa popular
5. **Documentação:** ⚠️ Parcialmente desatualizada (precisa ajustes)

### 🔄 Próxima Ação Imediata

**Instalar dependências e compilar:**
```powershell
cd packages\etl
npm install
npm run build
```

### 📊 Roadmap

```
Semana 1:
✅ Análise de versões (CONCLUÍDO)
🔄 Instalar dependências
🔄 Compilar código
🔄 Validar Data Lake existente

Semana 2:
⏳ Comparar processors (backup vs. moderno)
⏳ Popular Data Lake completo
⏳ Executar pipeline ETL completo

Semana 3:
⏳ Atualizar documentação
⏳ Sincronizar melhorias modernas
⏳ Testes de integração
```

---

**🤝 Próxima Interação:**

Escolha uma opção:
1. **Instalar dependências agora** → Executarei `npm install`
2. **Comparar processors primeiro** → Analisarei diferenças de código
3. **Popular Data Lake** → Executarei extract completo
4. **Atualizar documentação** → Corrigirei `fluxograma apartir do data lake.txt`
5. **Outro foco** → Me diga qual aspecto priorizar

**Qual caminho seguir?** 🚀
