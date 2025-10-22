# 🔧 PLANO DE CORREÇÃO COMPLETA DO ETL DE DESPESAS

**Data:** 2025-10-08  
**Objetivo:** Unificar e corrigir o pipeline de despesas, eliminando redundâncias e contradições

---

## 📊 ANÁLISE DE SITUAÇÃO ATUAL

### ❌ Problemas Identificados

1. **CLI Registra Classe Inexistente**
   - `etl-runner.ts` importa `DespesasDeputadosV3Processor` de caminho inexistente
   - Arquivo real está em `/core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.ts`
   - Múltiplas versões duplicadas na raiz do workspace (`core/`)

2. **Múltiplas Versões Contraditórias**
   - `despesas-deputados.processor.ts` (V2) em `src/core/camara_api_wrapper/scripts/processors/`
   - `despesas-deputados-v3.processor.ts` no mesmo diretório
   - `despesas-deputados-v3-modular.processor.ts` na raiz `core/`
   - `despesas-deputados-v3-unified.processor.ts` na raiz `core/`
   - `despesas-deputados-v3-unified.processor.ts` em `src/core/camara_api_wrapper/scripts/processors/`

3. **Initiators Duplicados**
   - Nenhum initiator de despesas existe em `src/core/camara_api_wrapper/scripts/initiators/`
   - Package.json referencia scripts inexistentes:
     - `processar_despesasdeputados_v3.ts`
     - `processar_despesasdeputados_v2.ts`

4. **Dependências Ausentes**
   - `firebase-admin` não está em `package.json` mas é importado
   - Classes V3 usam `Timestamp` de `firebase-admin/firestore`

5. **Estrutura de Salvamento Indefinida**
   - Requisito: salvar em `C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\Sistema ETL\bancodeDados`
   - V3 não salva em PC, apenas Firestore
   - V2 salva em estrutura diferente da especificada

6. **Agregação de Fornecedores Quebrada**
   - Campos `totalRecebido`, `numeroTransacoes`, `numeroDeputados` não são incrementados
   - Permanecem zerados mesmo após processamento

7. **Documentação Desalinhada**
   - Promete rankings e relatórios não implementados
   - Afirma enriquecimento de perfil que não ocorre no fluxo padrão
   - Descreve fornecedor único com localização que não existe

---

## 🎯 ESTRATÉGIA DE CORREÇÃO

### Fase 1️⃣: Limpeza e Consolidação (CRÍTICO)
**Objetivo:** Eliminar redundâncias e definir uma única fonte da verdade

### Fase 2️⃣: Correção de Dependências
**Objetivo:** Garantir que todas as dependências estão instaladas

### Fase 3️⃣: Implementação da Estrutura de Salvamento Correta
**Objetivo:** Adequar o salvamento aos caminhos especificados

### Fase 4️⃣: Correção de Lógica de Agregação
**Objetivo:** Implementar corretamente a agregação de fornecedores

### Fase 5️⃣: Atualização de Documentação
**Objetivo:** Alinhar documentação com implementação real

### Fase 6️⃣: Validação e Testes
**Objetivo:** Verificar que o pipeline funciona end-to-end

---

## 📝 PLANO DETALHADO DE EXECUÇÃO

---

## **FASE 1: LIMPEZA E CONSOLIDAÇÃO**

### ✅ Tarefa 1.1: Identificar Arquivo Principal
**Ação:** Determinar qual versão do processador será mantida

**Decisão:**
- ✅ **MANTER:** `src/core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.ts`
  - Razão: Localização correta na estrutura do wrapper
  - Possui implementação mais completa
  - Salva em estrutura otimizada com deputados/fornecedores separados

**Arquivos para DELETAR:**
```
❌ /core/camara_api_wrapper/scripts/processors/despesas-deputados-v3-modular.processor.ts
❌ /core/camara_api_wrapper/scripts/processors/despesas-deputados-v3-unified.processor.ts
❌ /core/camara_api_wrapper/scripts/processors/despesas-deputados.processor.ts (V2 obsoleta)
❌ Qualquer outro arquivo despesas-deputados*.ts na raiz /core/
```

### ✅ Tarefa 1.2: Remover Initiators Obsoletos
**Ação:** Limpar scripts que não correspondem à estrutura atual

**Package.json - Scripts para REMOVER:**
```json
"camara:despesas:pc": "ts-node --esm src/core/camara_api_wrapper/scripts/initiators/processar_despesasdeputados_v3.ts -- --pc",
"camara:despesas:v2:pc": "ts-node --esm src/core/camara_api_wrapper/scripts/initiators/processar_despesasdeputados_v2.ts -- --pc",
```

**Arquivos para VERIFICAR e REMOVER se existirem:**
```
❌ src/core/camara_api_wrapper/scripts/initiators/processar_despesasdeputados_v3.ts
❌ src/core/camara_api_wrapper/scripts/initiators/processar_despesasdeputados_v2.ts
❌ src/core/camara_api_wrapper/scripts/initiators/processar_despesasdeputados.ts
```

### ✅ Tarefa 1.3: Corrigir Import no CLI
**Arquivo:** `src/cli/etl-runner.ts`

**ANTES:**
```typescript
import { DespesasDeputadosV3Processor as DespesasDeputadosProcessor } from '../core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.js';
```

**DEPOIS:**
```typescript
import { DespesasDeputadosV3Processor } from '../core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.js';
```

**Registrar no PROCESSORS:**
```typescript
const PROCESSORS: { [key: string]: new (...args: any[]) => { process(options?: ETLOptions): Promise<any> } } = {
  despesas: DespesasDeputadosV3Processor,
  // fornecedores: FornecedoresProcessor,
};
```

### ✅ Tarefa 1.4: Limpar Exports do Index
**Arquivo:** `src/index.ts`

**VERIFICAR linha 66:**
```typescript
export { DespesasDeputadosV3Processor as DespesasDeputadosProcessor } from './core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.js';
```

**Se o caminho estiver errado, CORRIGIR.**

---

## **FASE 2: CORREÇÃO DE DEPENDÊNCIAS**

### ✅ Tarefa 2.1: Adicionar firebase-admin
**Arquivo:** `package.json`

**Ação:** Adicionar dependência ausente

```bash
npm install firebase-admin@^13.5.0
```

**Verificar em package.json:**
```json
"dependencies": {
  "firebase-admin": "^13.5.0",
  ...
}
```

**Nota:** A versão já está listada mas pode não estar instalada corretamente.

### ✅ Tarefa 2.2: Verificar Outras Dependências
**Executar:**
```bash
npm install
npm audit fix
```

---

## **FASE 3: ESTRUTURA DE SALVAMENTO CORRETA**

### ✅ Tarefa 3.1: Adicionar Suporte para Salvamento em PC na V3

**Problema Atual:**
- V3 só salva no Firestore
- Requisito: salvar em `C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\Sistema ETL\bancodeDados`

**Arquivo:** `src/core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.ts`

**Localização:** Método `load(data: TransformedData)`

**Implementar:**

1. **Detectar destino PC:**
```typescript
const destinoConfig = getDestinoConfig();
const salvarPC = destinoConfig.saveToPC && destinoConfig.pcSaveDir;
```

2. **Criar estrutura de diretórios:**
```typescript
if (salvarPC) {
  const baseDir = destinoConfig.pcSaveDir;
  
  // Estrutura: bancodeDados/despesas_deputados_leg57_2025-10-08.json
  const despesasFile = path.join(baseDir, `despesas_deputados_leg${this.context.options.legislatura}_${new Date().toISOString().split('T')[0]}.json`);
  
  // Estrutura: bancodeDados/monitordespesas/deputados/
  const monitorDir = path.join(baseDir, 'monitordespesas');
  const deputadosDir = path.join(monitorDir, 'deputados');
  const fornecedoresDir = path.join(monitorDir, 'fornecedores');
  
  await fs.ensureDir(monitorDir);
  await fs.ensureDir(deputadosDir);
  await fs.ensureDir(fornecedoresDir);
}
```

3. **Salvar arquivo principal de despesas:**
```typescript
const despesasCompletas = {
  metadata: {
    legislatura: this.context.options.legislatura,
    dataProcessamento: new Date().toISOString(),
    totalDeputados: data.deputados.length,
    totalDespesas: data.despesas.length,
    totalFornecedores: data.fornecedores.length
  },
  deputados: data.deputados,
  despesas: data.despesas,
  fornecedores: data.fornecedores,
  rankings: data.rankings || [],
  alertas: data.alertas || [],
  estatisticas: data.estatisticas
};

await fs.writeJSON(despesasFile, despesasCompletas, { spaces: 2 });
this.context.logger.info(`✅ Arquivo principal salvo: ${despesasFile}`);
```

4. **Salvar coleção deputados:**
```typescript
for (const deputado of data.deputados) {
  const deputadoFile = path.join(deputadosDir, `${deputado.id}.json`);
  await fs.writeJSON(deputadoFile, deputado, { spaces: 2 });
}
this.context.logger.info(`✅ ${data.deputados.length} deputados salvos em ${deputadosDir}`);
```

5. **Salvar coleção fornecedores:**
```typescript
for (const fornecedor of data.fornecedores) {
  // Usar CNPJ como ID (remover caracteres especiais)
  const fornecedorId = fornecedor.cnpj.replace(/[^\d]/g, '');
  const fornecedorFile = path.join(fornecedoresDir, `${fornecedorId}.json`);
  await fs.writeJSON(fornecedorFile, fornecedor, { spaces: 2 });
}
this.context.logger.info(`✅ ${data.fornecedores.length} fornecedores salvos em ${fornecedoresDir}`);
```

### ✅ Tarefa 3.2: Configurar Diretório de Destino

**Arquivo:** `src/core/camara_api_wrapper/scripts/config/environment.config.ts`

**Verificar/Adicionar:**
```typescript
export function getDestinoConfig() {
  return {
    saveToPC: process.env.SAVE_TO_PC === 'true' || true, // Default: true
    pcSaveDir: process.env.PC_SAVE_DIR || 
               'C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica\\Sistema ETL\\bancodeDados',
    saveToFirestore: process.env.SAVE_TO_FIRESTORE === 'true' || false
  };
}
```

**Arquivo:** `.env`
```env
SAVE_TO_PC=true
PC_SAVE_DIR=C:\Users\Kast Berhartes\projetos-web-berhartes\a-republica\Sistema ETL\bancodeDados
SAVE_TO_FIRESTORE=false
```

---

## **FASE 4: CORREÇÃO DE AGREGAÇÃO DE FORNECEDORES**

### ✅ Tarefa 4.1: Corrigir Incrementos dos Campos

**Arquivo:** `src/core/camara_api_wrapper/scripts/processors/despesas-deputados-v3.processor.ts`

**Localização:** Método `transform()`, linhas ~470-600

**Problema:**
```typescript
// ❌ ATUAL: Campos inicializados mas nunca incrementados
if (!fornecedoresAgregados.has(cnpjFormatado)) {
  fornecedoresAgregados.set(cnpjFormatado, {
    cnpj: cnpjFormatado,
    nome: despesaBruta.nomeFornecedor,
    totalRecebido: 0,          // ❌ Fica zerado
    numeroTransacoes: 0,        // ❌ Fica zerado
    numeroDeputados: 0,         // ❌ Fica zerado
    categorias: new Set<string>(),
    // ...
  });
}
```

**CORREÇÃO:**
```typescript
// ✅ CORRIGIDO: Incrementar valores
const fornecedor = fornecedoresAgregados.get(cnpjFormatado)!;

// Incrementar totais
fornecedor.totalRecebido += valor;
fornecedor.numeroTransacoes += 1;

// Adicionar deputado único
if (!fornecedor.deputados) {
  fornecedor.deputados = new Set<string>();
}
fornecedor.deputados.add(deputadoInfo.id);
fornecedor.numeroDeputados = fornecedor.deputados.size;

// Adicionar categoria
fornecedor.categorias.add(despesaBruta.tipoDespesa || 'Não classificada');

// Atualizar primeira/última transação
if (!fornecedor.primeiraTransacao || despesaBruta.dataDocumento < fornecedor.primeiraTransacao) {
  fornecedor.primeiraTransacao = despesaBruta.dataDocumento;
}
if (!fornecedor.ultimaTransacao || despesaBruta.dataDocumento > fornecedor.ultimaTransacao) {
  fornecedor.ultimaTransacao = despesaBruta.dataDocumento;
}

// Atualizar maior/menor transação
if (!fornecedor.maiorTransacao || valor > fornecedor.maiorTransacao) {
  fornecedor.maiorTransacao = valor;
}
if (!fornecedor.menorTransacao || valor < fornecedor.menorTransacao) {
  fornecedor.menorTransacao = valor;
}

// Atualizar média
fornecedor.mediaTransacao = fornecedor.totalRecebido / fornecedor.numeroTransacoes;
```

### ✅ Tarefa 4.2: Converter Sets para Arrays antes de Salvar

**Problema:** `fornecedor.categorias` e `fornecedor.deputados` são Sets

**CORREÇÃO (antes do return no transform):**
```typescript
// Converter fornecedores para formato final
const fornecedoresOtimizados = Array.from(fornecedoresAgregados.values()).map(f => ({
  ...f,
  categorias: Array.from(f.categorias),
  deputados: f.deputados ? Array.from(f.deputados) : [],
  numeroDeputados: f.deputados ? f.deputados.size : 0
}));
```

---

## **FASE 5: ATUALIZAÇÃO DE DOCUMENTAÇÃO**

### ✅ Tarefa 5.1: Corrigir DOCUMENTACAO-COMPLETA-FUNCOES-ETL.md

**Arquivo:** `DOCUMENTACAO-COMPLETA-FUNCOES-ETL.md`

**Seção: DEPUTADOS - DESPESAS**

**REMOVER promessas não implementadas:**
```markdown
❌ "gera relatórios agregados por tipo"
❌ "cria rankings de gastos"
```

**ADICIONAR realidade:**
```markdown
✅ "salva despesas em estrutura otimizada com deputados e fornecedores separados"
✅ "agrega dados por fornecedor: total recebido, número de transações, deputados únicos"
✅ "calcula scores investigativos e detecta alertas"
```

**Atualizar seção de CARGA:**
```markdown
3. **CARGA**
   - **PC:** 
     - `bancodeDados/despesas_deputados_leg{N}_YYYY-MM-DD.json` (arquivo consolidado)
     - `bancodeDados/monitordespesas/deputados/{id}.json` (um arquivo por deputado)
     - `bancodeDados/monitordespesas/fornecedores/{cnpj}.json` (um arquivo por fornecedor)
   - **Firestore:**
     - `deputados/{id}` (merge de dados)
     - `fornecedores/{cnpj}` (fornecedores únicos)
     - `deputados/{id}/despesas/{uuid}` (subcoleção de despesas)
```

### ✅ Tarefa 5.2: Atualizar README.md

**Arquivo:** `README.md`

**Seção: Scripts Disponíveis**

**REMOVER:**
```markdown
❌ `npm run camara:despesas:v2:pc`
❌ `npm run camara:despesas:pc` (se apontar para initiator inexistente)
```

**MANTER/ADICIONAR:**
```markdown
✅ `npm run etl:despesas:pc -- 57` - Processar despesas da legislatura 57 salvando em PC
✅ `npm run etl:despesas -- 57 --firestore` - Processar despesas salvando no Firestore
✅ `npm run etl:despesas -- 57 5 --pc` - Processar apenas 5 deputados (teste)
```

### ✅ Tarefa 5.3: Criar Documentação de Estrutura de Dados

**Criar novo arquivo:** `docs/ESTRUTURA-DADOS-DESPESAS.md`

```markdown
# 📊 ESTRUTURA DE DADOS - ETL DESPESAS

## Arquivo Principal
`bancodeDados/despesas_deputados_leg57_2025-10-08.json`

```json
{
  "metadata": {
    "legislatura": 57,
    "dataProcessamento": "2025-10-08T10:30:00Z",
    "totalDeputados": 513,
    "totalDespesas": 125000,
    "totalFornecedores": 8500
  },
  "deputados": [...],
  "despesas": [...],
  "fornecedores": [...],
  "rankings": [...],
  "alertas": [...],
  "estatisticas": {...}
}
```

## Coleção: deputados/
`bancodeDados/monitordespesas/deputados/{id}.json`

## Coleção: fornecedores/
`bancodeDados/monitordespesas/fornecedores/{cnpj}.json`

(Incluir schemas completos)
```

---

## **FASE 6: VALIDAÇÃO E TESTES**

### ✅ Tarefa 6.1: Recompilar Projeto

```bash
# Limpar compilações anteriores
npm run clean

# Recompilar
npm run build
```

**Verificar:** Não deve haver erros de compilação

### ✅ Tarefa 6.2: Teste com Limite Pequeno

```bash
# Processar apenas 3 deputados para teste
npm run etl:despesas:pc -- 57 3
```

**Verificar:**
1. ✅ Processo executa sem erros
2. ✅ Arquivo principal criado em `bancodeDados/despesas_deputados_leg57_YYYY-MM-DD.json`
3. ✅ Diretório `bancodeDados/monitordespesas/deputados/` contém 3 arquivos
4. ✅ Diretório `bancodeDados/monitordespesas/fornecedores/` contém arquivos
5. ✅ Campos de fornecedores (`totalRecebido`, etc.) NÃO estão zerados

### ✅ Tarefa 6.3: Validar Estrutura dos Dados

**Script de validação:** `scripts/validar-estrutura-despesas.ts`

```typescript
import fs from 'fs-extra';
import path from 'path';

async function validarEstruturaDespesas() {
  const baseDir = 'C:\\Users\\Kast Berhartes\\projetos-web-berhartes\\a-republica\\Sistema ETL\\bancodeDados';
  
  // 1. Verificar arquivo principal
  const arquivoPrincipal = await fs.readdir(baseDir).then(files => 
    files.find(f => f.startsWith('despesas_deputados_leg'))
  );
  
  if (!arquivoPrincipal) {
    console.error('❌ Arquivo principal não encontrado');
    return false;
  }
  
  const dados = await fs.readJSON(path.join(baseDir, arquivoPrincipal));
  
  // Validações
  const checks = [
    { nome: 'Metadata presente', pass: !!dados.metadata },
    { nome: 'Deputados array', pass: Array.isArray(dados.deputados) },
    { nome: 'Despesas array', pass: Array.isArray(dados.despesas) },
    { nome: 'Fornecedores array', pass: Array.isArray(dados.fornecedores) },
    { nome: 'Fornecedores com totalRecebido > 0', pass: dados.fornecedores.some(f => f.totalRecebido > 0) },
    { nome: 'Fornecedores com numeroTransacoes > 0', pass: dados.fornecedores.some(f => f.numeroTransacoes > 0) },
  ];
  
  checks.forEach(check => {
    console.log(check.pass ? '✅' : '❌', check.nome);
  });
  
  return checks.every(c => c.pass);
}

validarEstruturaDespesas();
```

### ✅ Tarefa 6.4: Teste Completo (Opcional)

**Apenas se testes anteriores passarem:**

```bash
# Processar todos os deputados da legislatura
npm run etl:despesas:pc -- 57
```

---

## **CRONOGRAMA DE EXECUÇÃO**

| Fase | Tempo Estimado | Dependências |
|------|----------------|--------------|
| Fase 1 (Limpeza) | 30 minutos | - |
| Fase 2 (Dependências) | 10 minutos | - |
| Fase 3 (Salvamento PC) | 1 hora | Fase 1 |
| Fase 4 (Agregação) | 30 minutos | Fase 1 |
| Fase 5 (Documentação) | 30 minutos | - |
| Fase 6 (Validação) | 45 minutos | Fases 1-4 |
| **TOTAL** | **3h 45min** | |

---

## **CHECKLIST DE CONCLUSÃO**

### ✅ Arquivos Removidos
- [ ] Processadores V3 duplicados na raiz `core/`
- [ ] Processador V2 obsoleto
- [ ] Initiators de despesas inexistentes

### ✅ Código Corrigido
- [ ] Import correto em `etl-runner.ts`
- [ ] Export correto em `index.ts`
- [ ] Scripts do `package.json` atualizados
- [ ] Dependência `firebase-admin` instalada

### ✅ Salvamento em PC Implementado
- [ ] Detecção de destino PC
- [ ] Criação de estrutura de diretórios
- [ ] Salvamento de arquivo principal
- [ ] Salvamento de coleção deputados
- [ ] Salvamento de coleção fornecedores

### ✅ Agregação Corrigida
- [ ] `totalRecebido` incrementado corretamente
- [ ] `numeroTransacoes` incrementado corretamente
- [ ] `numeroDeputados` calculado corretamente
- [ ] Sets convertidos para arrays

### ✅ Documentação Atualizada
- [ ] `DOCUMENTACAO-COMPLETA-FUNCOES-ETL.md` corrigida
- [ ] `README.md` atualizado
- [ ] `ESTRUTURA-DADOS-DESPESAS.md` criada

### ✅ Testes Realizados
- [ ] Compilação sem erros
- [ ] Teste com 3 deputados bem-sucedido
- [ ] Validação de estrutura de dados
- [ ] Teste completo (opcional)

---

## **NEXT STEPS PÓS-CORREÇÃO**

1. **Monitoramento:**
   - Executar ETL completo e medir tempo/recursos
   - Validar integridade dos dados gerados
   - Verificar tamanho dos arquivos

2. **Otimizações Futuras:**
   - Implementar compressão dos arquivos JSON
   - Adicionar índices para busca rápida
   - Criar versionamento dos dados

3. **Melhorias de Pipeline:**
   - Adicionar modo incremental real
   - Implementar detecção de mudanças
   - Criar sistema de alertas automatizado

---

## **CONTATOS E SUPORTE**

Para dúvidas ou problemas durante a execução:
1. Verificar logs detalhados na console
2. Consultar checkpoints em `/checkpoints/`
3. Revisar documentação atualizada em `/docs/`

---

**Status do Plano:** 🟡 AGUARDANDO EXECUÇÃO  
**Última Atualização:** 2025-10-08
