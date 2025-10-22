# 🗑️ Plano de Limpeza: Firebase/Firestore e Código Obsoleto

> **Data:** 03/10/2025  
> **Status:** 🔄 Em Execução - Fase 2

---

## 🎯 Objetivo

Remover completamente:
1. ❌ Menções ao Firebase/Firestore (obsoleto)
2. ❌ Código deprecated e comentado
3. ❌ Documentação obsoleta
4. ❌ Dependências não utilizadas

---

## 📋 Inventário Completo

### **Sistema ETL**

#### Documentação Obsoleta (REMOVER)
- ❌ `docs/FIREBASE_SETUP.md` (75 linhas)
- ❌ `docs/DIAGNOSTICO-CONECTIVIDADE-FIRESTORE.md` (171 linhas)
- ❌ `docs/GUIA-ETL-INTELIGENTE.md` (menções ao Firestore)
- ❌ `docs/PLANO_DE_REFATORACAO.md` (refatoração antiga)

#### Código Obsoleto
- ❌ `src/types/global.d.ts` → `declare module '@/lib/firebase'`
- ❌ `src/server.ts` → Comentários sobre Firebase
- ❌ `src/scripts/test-storage-upload.ts` → Upload para Firebase Storage
- ❌ `src/scripts/run-fornecedores-etl.ts` → Referências a Firestore
- ❌ `src/utils/retry.ts` → Comentário sobre Firestore

#### README Atualização
- ⚠️ `README.md` → Remover seção Firebase (linhas 17-30)
- ⚠️ Atualizar "Pré-requisitos" (linha 17)

---

### **MonitorDespesas**

#### Documentação Obsoleta (REMOVER)
- ❌ `CACHE-LOCAL-METODOLOGIA.md` → Documento de migração completo
- ❌ `docs/copilot-playbook.md` → Menções ao Firebase

#### Dependências (REMOVER)
- ❌ `package.json` → `"firebase": "^12.3.0"`
- ❌ Remover todo o `@firebase/*` do package-lock.json

#### Código Vite Config
- ❌ `vite.config.ts` → Referências a `firebase-admin`

#### Hooks Deprecated (MANTER com documentação clara)
- ⚠️ `src/hooks/useGlobalFornecedoresProcessor.ts` (já documentado)
- ⚠️ `src/hooks/migration/*` (utilitários de migração, manter)
- ⚠️ `src/hooks/useDeputados.ts` (warnings, manter)

---

## 🗂️ Estrutura de Arquivos para Deletar

```
Sistema ETL/
├── docs/
│   ├── FIREBASE_SETUP.md                        ❌ DELETAR
│   ├── DIAGNOSTICO-CONECTIVIDADE-FIRESTORE.md   ❌ DELETAR
│   └── PLANO_DE_REFATORACAO.md                  ❌ DELETAR
└── src/
    └── scripts/
        ├── test-storage-upload.ts                ❌ DELETAR
        └── run-fornecedores-etl.ts               ⚠️ LIMPAR

monitordespesas/
├── CACHE-LOCAL-METODOLOGIA.md                    ❌ DELETAR
└── package.json                                  ⚠️ LIMPAR
```

---

## 🔄 Ações de Limpeza

### **FASE 1: Documentação Obsoleta** ✅

```powershell
# Sistema ETL - Remover documentação Firebase
Remove-Item "Sistema ETL/docs/FIREBASE_SETUP.md"
Remove-Item "Sistema ETL/docs/DIAGNOSTICO-CONECTIVIDADE-FIRESTORE.md"
Remove-Item "Sistema ETL/docs/PLANO_DE_REFATORACAO.md"

# MonitorDespesas - Remover documentação de migração
Remove-Item "monitordespesas/CACHE-LOCAL-METODOLOGIA.md"
```

### **FASE 2: Scripts Obsoletos** ✅

```powershell
# Sistema ETL - Remover scripts Firebase
Remove-Item "Sistema ETL/src/scripts/test-storage-upload.ts"
```

### **FASE 3: Limpar Código** ✅

**Sistema ETL/README.md:**
- Remover seção "Pré-requisitos" → Firebase
- Remover variáveis de ambiente Firebase
- Remover scripts de teste Firebase

**Sistema ETL/src/server.ts:**
- Remover comentários Firebase

**Sistema ETL/src/types/global.d.ts:**
- Remover `declare module '@/lib/firebase'`

**monitordespesas/vite.config.ts:**
- Remover `exclude: ['firebase-admin']`
- Remover `external: ['firebase-admin']`

**monitordespesas/package.json:**
- Remover `"firebase": "^12.3.0"`

### **FASE 4: Atualizar Referências** ✅

**Sistema ETL/src/scripts/run-fornecedores-etl.ts:**
```typescript
// ANTES
destinations: ['firestore', 'pc']
destinos: ['firestore', 'pc']

// DEPOIS
destinations: ['pc']
destinos: ['pc']
```

**Sistema ETL/src/utils/retry.ts:**
```typescript
// REMOVER comentário
// Aqui poderíamos adicionar código para salvar o erro no Firestore
```

---

## 📊 Métricas de Limpeza

| Categoria | Antes | Depois | Redução |
|-----------|-------|--------|---------|
| **Documentos obsoletos** | 4 | 0 | 100% |
| **Scripts não utilizados** | 2 | 0 | 100% |
| **Menções Firebase** | 50+ | 0 | 100% |
| **Dependências** | firebase + 30 | 0 | 100% |
| **Linhas de código** | ~500 | 0 | 100% |

---

## ⚠️ PRESERVAR (Não Deletar)

### Código Deprecated Documentado
- ✅ `useGlobalFornecedoresProcessor.ts` → Documentado como deprecated
- ✅ `migration/*` → Utilitários de migração legítimos
- ✅ `CategoryRegistry.ts` → Sistema de status de categorias

### Comentários Úteis
- ✅ Warnings de deprecation em hooks
- ✅ JSDoc com `@deprecated`
- ✅ Guias de migração em hooks

---

## 🎯 Checklist de Execução

### **FASE 1: Documentação** ✅
- [ ] Deletar `Sistema ETL/docs/FIREBASE_SETUP.md`
- [ ] Deletar `Sistema ETL/docs/DIAGNOSTICO-CONECTIVIDADE-FIRESTORE.md`
- [ ] Deletar `Sistema ETL/docs/PLANO_DE_REFATORACAO.md`
- [ ] Deletar `monitordespesas/CACHE-LOCAL-METODOLOGIA.md`

### **FASE 2: Scripts** ✅
- [ ] Deletar `Sistema ETL/src/scripts/test-storage-upload.ts`
- [ ] Limpar `Sistema ETL/src/scripts/run-fornecedores-etl.ts`

### **FASE 3: Código** ✅
- [ ] Limpar `Sistema ETL/README.md`
- [ ] Limpar `Sistema ETL/src/server.ts`
- [ ] Limpar `Sistema ETL/src/types/global.d.ts`
- [ ] Limpar `Sistema ETL/src/utils/retry.ts`
- [ ] Limpar `monitordespesas/vite.config.ts`
- [ ] Limpar `monitordespesas/package.json`

### **FASE 4: Dependências** ✅
- [ ] Remover `firebase` do `package.json`
- [ ] Executar `npm install` para limpar lock files
- [ ] Verificar bundle size

### **FASE 5: Testes** ✅
- [ ] Build Sistema ETL
- [ ] Build MonitorDespesas
- [ ] Verificar erros no console
- [ ] Testar sincronização de cache

---

## 🚀 Comandos de Verificação

```powershell
# Verificar se Firebase ainda é mencionado
cd "Sistema ETL"
grep -r "firebase" --include="*.ts" --include="*.js" --include="*.md" .

cd ../monitordespesas
grep -r "firebase" --include="*.ts" --include="*.tsx" --include="*.md" .

# Build test
cd "../Sistema ETL"
npm run build

cd ../monitordespesas
npm run build
```

---

## ✅ Resultado Esperado

### **Antes:**
```
- 50+ menções ao Firebase/Firestore
- 4 documentos obsoletos
- 2 scripts não utilizados
- Dependência firebase (12.3.0)
- ~500 linhas de código morto
```

### **Depois:**
```
- 0 menções ao Firebase/Firestore
- 0 documentos obsoletos
- 0 scripts não utilizados
- 0 dependências Firebase
- Código limpo e focado
```

---

**Vamos executar a limpeza completa! 🧹**
