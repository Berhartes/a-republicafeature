# 🧹 Plano de Limpeza: Sistema ETL ↔️ MonitorDespesas

> **Data:** 03/10/2025  
> **Status:** 🔄 Em Execução

---

## 🎯 Objetivo

Limpar e organizar o relacionamento entre Sistema ETL e MonitorDespesas, removendo:
- Duplicações de código
- Dependências desnecessárias
- Scripts redundantes
- Referências hardcoded
- Código morto

---

## 🔍 Problemas Identificados

### 1️⃣ **Duplicação de Schemas**

**Problema:**
- `Sistema ETL/src/shared/monitordespesas-schema.ts` (215 linhas)
- `shared/monitordespesas-schema/src/` (package compartilhado)
- **Duplicação total de tipos!**

**Solução:**
- ✅ Remover `Sistema ETL/src/shared/monitordespesas-schema.ts`
- ✅ Usar apenas `@a-republica/monitordespesas-schema`
- ✅ Atualizar imports no Sistema ETL

---

### 2️⃣ **Scripts de Sincronização Duplicados**

**Problema:**
- `monitordespesas/scripts/sync-caches.sh` (158 linhas)
- `monitordespesas/scripts/sync-caches.ps1` (157 linhas)
- **Mesma funcionalidade em 2 arquivos!**

**Solução:**
- ✅ Manter apenas `.ps1` (PowerShell é padrão do sistema)
- ✅ Remover `.sh` (Bash)
- ✅ Atualizar `package.json` para usar `.ps1`

---

### 3️⃣ **ETL Runner com Simulação Obsoleta**

**Problema:**
- `monitordespesas/scripts/etl-runner.js` (333 linhas)
- Simula dados ao invés de usar Sistema ETL real
- Função `simulateETL()` com dados fake

**Solução:**
- ✅ Remover simulação
- ✅ Fazer o runner chamar Sistema ETL diretamente
- ✅ Simplificar para ~100 linhas

---

### 4️⃣ **Paths Hardcoded**

**Problema:**
```typescript
// monitordespesas/src/services/sistema-etl-bridge.ts
this.basePath = 'C:/Users/Kast Berhartes/projetos-web-berhartes/...'

// Sistema ETL/src/scripts/corrigir-fornecedores-diversos.ts
this.baseDir = '/mnt/c/Users/Kast Berhartes/projetos-web-berhartes/...'
```

**Solução:**
- ✅ Usar paths relativos
- ✅ Detectar automaticamente via `__dirname`
- ✅ Variáveis de ambiente quando necessário

---

### 5️⃣ **Imports com Aliases Problemáticos**

**Problema:**
```typescript
// monitordespesas/vite.config.ts
"@etl": path.resolve(__dirname, "../Sistema ETL/src") // REMOVIDO
```
- Comentado mas ainda presente
- Causava imports de `firebase-admin` no frontend

**Solução:**
- ✅ Remover completamente
- ✅ Usar apenas cache export

---

### 6️⃣ **Dependências Circulares**

**Problema:**
- MonitorDespesas depende de Sistema ETL
- Sistema ETL tem tipos do MonitorDespesas
- Ambos importam `@a-republica/monitordespesas-schema`

**Solução:**
- ✅ Schema compartilhado como única fonte
- ✅ Sistema ETL → gera dados
- ✅ MonitorDespesas → consome dados
- ✅ Zero dependência direta entre projetos

---

### 7️⃣ **Comentários "Sistema ETL" Espalhados**

**Problema:**
```typescript
console.log('⚠️ Processamento agora é feito pelo Sistema ETL')
console.log('⚠️ Cancelamento agora é feito pelo Sistema ETL')
```
- Muitos logs de "migração"
- Código comentado

**Solução:**
- ✅ Limpar logs de migração
- ✅ Remover código comentado
- ✅ Documentação clara em README

---

## 📋 Checklist de Execução

### **Fase 1: Limpeza de Schemas** ✅

- [ ] Remover `Sistema ETL/src/shared/monitordespesas-schema.ts`
- [ ] Atualizar imports em `hierarchical-organizer.ts`
- [ ] Verificar build do Sistema ETL

### **Fase 2: Scripts de Sincronização** ✅

- [ ] Remover `monitordespesas/scripts/sync-caches.sh`
- [ ] Atualizar `monitordespesas/package.json` → usar `.ps1`
- [ ] Testar comando `npm run sync:cache`

### **Fase 3: ETL Runner** ✅

- [ ] Simplificar `monitordespesas/scripts/etl-runner.js`
- [ ] Remover função `simulateETL()`
- [ ] Integrar com Sistema ETL real
- [ ] Adicionar validações

### **Fase 4: Paths Hardcoded** ✅

- [ ] Corrigir `sistema-etl-bridge.ts`
- [ ] Corrigir `corrigir-fornecedores-diversos.ts`
- [ ] Usar `path.resolve()` relativo
- [ ] Adicionar `.env` se necessário

### **Fase 5: Código Morto** ✅

- [ ] Remover alias `@etl` do `vite.config.ts`
- [ ] Limpar logs de "Sistema ETL" em hooks
- [ ] Remover código comentado
- [ ] Verificar imports não utilizados

### **Fase 6: Documentação** ✅

- [ ] Atualizar README do Sistema ETL
- [ ] Atualizar README do MonitorDespesas
- [ ] Criar diagrama de arquitetura
- [ ] Documentar fluxo de dados

### **Fase 7: Testes** ✅

- [ ] `cd "Sistema ETL" && npm run build`
- [ ] `cd monitordespesas && npm run sync:cache`
- [ ] `cd monitordespesas && npm run dev`
- [ ] Verificar erros no console

---

## 🎯 Resultado Esperado

### **Antes:**
```
Sistema ETL/
├── src/shared/monitordespesas-schema.ts  ❌ DUPLICADO
├── paths hardcoded                        ❌ 
└── 215 linhas de tipos duplicados         ❌

monitordespesas/
├── scripts/sync-caches.sh                 ❌ DUPLICADO
├── scripts/sync-caches.ps1                ✅ 
├── scripts/etl-runner.js (333 linhas)     ❌ MUITO COMPLEXO
├── paths hardcoded                        ❌
└── imports problemáticos                  ❌
```

### **Depois:**
```
Sistema ETL/
├── ✅ Usa @a-republica/monitordespesas-schema
├── ✅ Paths relativos
└── ✅ Zero duplicação

monitordespesas/
├── ✅ scripts/sync-caches.ps1 (único)
├── ✅ scripts/etl-runner.js (simplificado ~100 linhas)
├── ✅ Paths relativos
└── ✅ Imports limpos

shared/monitordespesas-schema/
└── ✅ Única fonte de verdade para tipos
```

---

## 📊 Métricas de Limpeza

| Métrica | Antes | Depois | Redução |
|---------|-------|--------|---------|
| Linhas duplicadas | 215 | 0 | 100% |
| Scripts redundantes | 2 | 1 | 50% |
| Paths hardcoded | 3 | 0 | 100% |
| ETL Runner | 333 linhas | ~100 | 70% |
| Imports problemáticos | 5+ | 0 | 100% |

---

## 🚀 Próximos Passos

1. ✅ Executar limpeza
2. ✅ Testar build e sincronização
3. ✅ Atualizar documentação
4. ✅ Commit com mensagem clara
5. ✅ Criar PR se necessário

---

**Vamos começar a limpeza! 🧹**
