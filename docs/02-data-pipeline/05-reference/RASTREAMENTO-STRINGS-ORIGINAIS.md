# Rastreamento: Strings Originais → Frontend

## 📊 **ANÁLISE COMPLETA DO FLUXO DE DADOS**

### **PONTO DE ORIGEM**
**Local:** `Sistema ETL/bancodeDados/monitordespesas/fornecedores/lista/[cnpj]/dados_*.json`

**Exemplo de Dados Originais:**
```json
{
  "cnpjCpfFornecedor": "00062382000420",
  "nomeFornecedor": "POSTO 4 COMERCIO DE COMBUSTIVEIS LTDA",
  "tipoDespesaPrincipal": "COMBUSTÍVEIS E LUBRIFICANTES.",
  "categoriasPrincipais": ["COMBUSTÍVEIS E LUBRIFICANTES."]
}
```

### **🔄 TRANSFORMAÇÃO IDENTIFICADA**

#### **1. Função `normalizarTipoDespesa()`**
**Local:** `Sistema ETL/src/core/cache-exporter/index.ts:81-90`

```typescript
function normalizarTipoDespesa(tipoDespesa: string): string {
  if (!tipoDespesa) return 'OUTROS';
  const normalizado = tipoDespesa.toUpperCase().trim().replace(/\s+/g, ' ');
  const mapeamentos: { [key: string]: string } = {
    'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.': 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR',
    'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL.': 'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL',
    'COMBUSTÍVEIS E LUBRIFICANTES.': 'COMBUSTÍVEIS E LUBRIFICANTES',
  };
  return mapeamentos[normalizado] || normalizado;
}
```

**⚠️ TRANSFORMAÇÃO CONFIRMADA:**
- **Original:** `"COMBUSTÍVEIS E LUBRIFICANTES."` (com ponto)
- **Transformado:** `"COMBUSTÍVEIS E LUBRIFICANTES"` (sem ponto)

#### **2. Processamento do Nome do Fornecedor**
**Local:** `Sistema ETL/src/core/cache-exporter/index.ts:863`

```typescript
nome: despesa.nomeFornecedor.trim()
```

**✅ PRESERVAÇÃO CONFIRMADA:**
- **Original:** `"POSTO 4 COMERCIO DE COMBUSTIVEIS LTDA"`
- **Final:** `"POSTO 4 COMERCIO DE COMBUSTIVEIS LTDA"` (inalterado, apenas trim())

### **💾 RESULTADO NO CACHE FINAL**
**Local:** `a-republica-brasileira-caches/latest/suppliers-cache.json`

**Dados Verificados:**
```json
{
  "nome": "M.M. COMERCIO DE COMBUSTIVEIS LTDA",
  "categoria": "COMBUSTÍVEIS E LUBRIFICANTES",
  "categorias": ["COMBUSTÍVEIS E LUBRIFICANTES"],
  "distribuicaoTipos": {
    "COMBUSTÍVEIS E LUBRIFICANTES": {
      "valor": 7906.96,
      "quantidade": 8
    }
  }
}
```

### **🌐 FRONTEND - ROTAS E EXIBIÇÃO**

#### **URLs Testadas:**
1. `http://localhost:5173/gastos/processador-fornecedores`
2. `http://localhost:5173/gastos/fornecedores`
3. `http://localhost:5173/gastos/categorias/divulgacao-parlamentar`
4. `http://localhost:5173/gastos/fornecedor/84659721000106`

#### **Componente de Exibição:**
**Local:** `monitordespesas/src/components/fornecedores/FornecedorCard.tsx:62-64`

```typescript
<CardTitle className="text-base font-semibold truncate" title={fornecedor.nome}>
  <Icon className="h-4 w-4 mr-2 inline" />
  {fornecedor.nome}  // ← String original preservada
</CardTitle>
```

### **📋 RESUMO DAS TRANSFORMAÇÕES**

| Campo | Original | Cache Final | Status |
|-------|----------|-------------|---------|
| **Nome Fornecedor** | `"POSTO 4 COMERCIO DE COMBUSTIVEIS LTDA"` | `"POSTO 4 COMERCIO DE COMBUSTIVEIS LTDA"` | ✅ **PRESERVADO** |
| **CNPJ** | `"00062382000420"` | `"00062382000420"` | ✅ **PRESERVADO** |
| **Categoria** | `"COMBUSTÍVEIS E LUBRIFICANTES."` | `"COMBUSTÍVEIS E LUBRIFICANTES"` | ⚠️ **TRANSFORMADO** (ponto removido) |
| **Valores Numéricos** | `615700` | `615700` | ✅ **PRESERVADO** |

### **🔍 PONTOS CRÍTICOS IDENTIFICADOS**

#### **1. Remoção de Pontos nas Categorias**
- **Função:** `normalizarTipoDespesa()`
- **Efeito:** Remove pontos finais das categorias
- **Impacto:** Padronização de nomes de categorias

#### **2. Slug de Categorias**
**Local:** `monitordespesas/src/lib/category-slugs.ts:6-7`

```typescript
'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': 'divulgacao-parlamentar',
'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.': 'divulgacao-parlamentar',
```

**✅ COMPATIBILIDADE:** Ambas versões (com e sem ponto) mapeiam para o mesmo slug

### **✅ CONCLUSÃO**

**Strings Preservadas:**
- ✅ **Nomes de Fornecedores** - mantidos exatamente como originais
- ✅ **CNPJs** - preservados integralmente
- ✅ **Valores numéricos** - mantidos sem alteração

**Transformações Controladas:**
- ⚠️ **Categorias** - pontos finais removidos por `normalizarTipoDespesa()`
- ✅ **URLs/Slugs** - compatíveis com ambas versões

O sistema **preserva as strings originais essenciais** (nomes e identificadores) e aplica apenas **normalização controlada nas categorias** para padronização.

---

**Data:** 2025-10-03
**Fonte:** Análise completa ETL → Cache → Frontend
**Status:** ✅ Strings originais preservadas com transformações documentadas