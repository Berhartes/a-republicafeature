# Relatório de Performance ETL - Sistema "A República"

## 📊 Resumo Executivo

**Data da Análise:** 2025-10-26T21:48:28.281Z

### 🎯 Principais Descobertas

- **Arquivos de Dados:** 26179 arquivos totalizando 200MB
- **⚠️ Gargalos Críticos:** 1 problemas de alta prioridade identificados


## 📁 Análise de Arquivos de Dados

### 📂 bancoDados

**Total:** 22383 arquivos (186.83 MB)

| Arquivo | Tipo | Tamanho | Modificado |
|---------|------|---------|------------|
| monitordespesas.db | Database | 3.74 MB | 23/10/2025 |
| dados_completos.json | JSON | 2.76 MB | 23/10/2025 |
| fornecedores.json | JSON | 2.59 MB | 23/10/2025 |
| test-materialize.db | Database | 1.34 MB | 23/10/2025 |
| resumo_anual.json | JSON | 1.12 MB | 23/10/2025 |
| dados_completos.json | JSON | 1.06 MB | 23/10/2025 |
| resumo_anual.json | JSON | 1.05 MB | 23/10/2025 |
| fornecedores.json | JSON | 0.97 MB | 23/10/2025 |
| resumo_anual.json | JSON | 0.86 MB | 23/10/2025 |
| dados_completos.json | JSON | 0.84 MB | 23/10/2025 |

*... e mais 22373 arquivos*

### 📂 cache

**Total:** 3796 arquivos (13.64 MB)

| Arquivo | Tipo | Tamanho | Modificado |
|---------|------|---------|------------|
| suppliers-cache.json | JSON | 5.83 MB | 23/10/2025 |
| rankings-cache.json | JSON | 1.19 MB | 23/10/2025 |
| cnpj-cache.json | JSON | 0.13 MB | 22/10/2025 |
| dashboard-cache.json | JSON | 0.02 MB | 22/10/2025 |
| deputies-cache.json | JSON | 0.01 MB | 23/10/2025 |
| supplier-00000000000010.json | JSON | 5 KB | 23/10/2025 |
| categories-cache.json | JSON | 5 KB | 23/10/2025 |
| supplier-10233130000128.json | JSON | 3 KB | 23/10/2025 |
| supplier-07951563000104.json | JSON | 3 KB | 23/10/2025 |
| supplier-02351877000152.json | JSON | 3 KB | 23/10/2025 |

*... e mais 3786 arquivos*



## ⏱️ Análise de Tempos de Processamento

### 🔄 Extract

- **Arquivos:** 0
- **Tamanho Total:** 0 KB
- **Tempo Estimado:** 0 minutos ✅ Rápido

### 🔄 Transform

- **Arquivos:** 0
- **Tamanho Total:** 0 KB
- **Tempo Estimado:** 0 minutos ✅ Rápido

### 🔄 Load

- **Arquivos:** 0
- **Tamanho Total:** 0 KB
- **Tempo Estimado:** 0 minutos ✅ Rápido



## 🚨 Gargalos Identificados

### 1. 🔴 CRÍTICO: Large data files in bancoDados (187MB)

**Recomendação:** Consider data compression or partitioning

### 2. 🟡 MODERADO: 18659 potential duplicate files in bancoDados

**Recomendação:** Remove duplicate data files

### 3. 🟡 MODERADO: 3616 potential duplicate files in cache

**Recomendação:** Remove duplicate data files



## 💡 Recomendações Prioritárias

### 1. 🔴 ALTA: Large data files in bancoDados (187MB)

Consider data compression or partitioning



## 🔧 Próximos Passos

1. **Imediato (1-2 dias):**
   - Implementar compressão de dados para arquivos grandes
   - Remover arquivos duplicados identificados

2. **Curto prazo (1 semana):**
   - Otimizar scripts de transformação mais lentos
   - Implementar processamento paralelo onde possível

3. **Médio prazo (2-4 semanas):**
   - Reestruturar pipeline ETL para melhor performance
   - Implementar monitoramento de performance em tempo real

---

*Relatório gerado automaticamente pelo ETL Performance Analyzer*
