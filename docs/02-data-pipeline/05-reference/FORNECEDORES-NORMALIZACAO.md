# Sistema de Normalização de Fornecedores

Este documento descreve o sistema implementado para resolver problemas de classificação incorreta de fornecedores como "DIVERSOS" devido a pequenas variações nos nomes.

## Problema Identificado

O CNPJ `00254564000150` e outros fornecedores únicos estavam sendo incorretamente classificados como "DIVERSOS" devido a pequenas diferenças nos nomes:

- `"CONSUPORTE TRANSPORTES E SERVIÇOS LTDA - EPP"`
- `"CONSUPORTE TRANSPORTES E SERVICOS LTDA"` (sem acento e sem "- EPP")

## Solução Implementada

### 1. Módulo de Normalização (`src/utils/fornecedor-name-normalizer.ts`)

**Funcionalidades principais:**
- **Normalização inteligente**: Remove acentos, padroniza abreviações, remove sufixos opcionais
- **Detecção de similaridade**: Algoritmo Levenshtein com threshold de 85%
- **Resolução de nome canônico**: Escolhe o nome mais completo e representativo
- **Agrupamento por similaridade**: Agrupa variações do mesmo fornecedor

**Funções principais:**
```typescript
normalizarNomeFornecedor(nome: string): string
calcularSimilaridade(str1: string, str2: string): number
saoMesmoFornecedor(nome1: string, nome2: string): boolean
resolverNomeCanonicoFornecedor(nomes: string[]): string
agruparNomesSimilares(nomes: string[]): string[][]
```

### 2. Atualização da Lógica de Classificação (`src/utils/hierarchical-organizer.ts`)

A função `determinarTipoCnpjCpf()` foi atualizada para:
- Aplicar normalização inteligente antes de comparar nomes
- Usar algoritmo de similaridade para agrupar variações
- Classificar como "EXCLUSIVO" se todos os nomes são similares
- Manter logs detalhados das reclassificações

### 3. Sistema de Monitoramento (`src/utils/fornecedor-monitoring.ts`)

**Métricas coletadas:**
- Fornecedores reclassificados
- Valor total afetado pelas correções
- Similaridade média das reclassificações
- Problemas detectados automaticamente

**Relatórios gerados:**
- Relatórios diários de qualidade
- Métricas de consistência do sistema
- Alertas para casos críticos

### 4. Script de Correção Retroativa (`src/scripts/corrigir-fornecedores-diversos.ts`)

**Funcionalidades:**
- Análise de todos os fornecedores existentes
- Identificação de casos problemáticos
- Geração de relatórios detalhados
- Aplicação de correções com backup automático

## Como Usar

### 1. Executar Análise (sem alterações)

```bash
npm run corrigir-fornecedores
```

Este comando:
- Analisa todos os fornecedores existentes
- Gera relatório de problemas encontrados
- **NÃO faz alterações** nos dados

### 2. Aplicar Correções

```bash
npm run corrigir-fornecedores:aplicar
```

Este comando:
- Executa análise completa
- **Aplica correções** nos arquivos
- Cria backups automáticos
- Gera relatório de mudanças

### 3. Executar Testes

```bash
npm test
npm run test:coverage
```

### 4. Monitorar Qualidade

O sistema automaticamente:
- Coleta métricas durante processamento
- Gera relatórios diários
- Detecta problemas em tempo real
- Cria alertas para casos críticos

## Estrutura de Arquivos

```
src/
├── utils/
│   ├── fornecedor-name-normalizer.ts    # Módulo de normalização
│   ├── fornecedor-monitoring.ts         # Sistema de monitoramento
│   └── hierarchical-organizer.ts        # Lógica atualizada
├── scripts/
│   └── corrigir-fornecedores-diversos.ts # Script de correção
└── tests/
    └── fornecedor-normalizer.test.ts     # Testes unitários
```

## Relatórios Gerados

### Diretório de Relatórios
```
bancodeDados/
├── correcao-fornecedores/
│   ├── relatorio-correcao-fornecedores-[timestamp].json
│   └── resumo-correcao-fornecedores-[timestamp].txt
├── metrics/fornecedores/
│   └── metrics-[data].jsonl
└── quality-reports/
    ├── daily-report-[data].json
    └── daily-summary-[data].txt
```

### Diretório de Backups
```
backups/
└── fornecedores-correcao/
    └── [cnpj]-[timestamp]/
        ├── dados_[timestamp].json
        └── anos/
            └── [ano]/
                └── dados_[timestamp].json
```

## Exemplo de Resultado

**Antes:**
```json
{
  "cnpjCpfFornecedor": "00254564000150",
  "nomeFornecedor": "DIVERSOS",
  "cpfCnpj": "DIVERSOS"
}
```

**Depois:**
```json
{
  "cnpjCpfFornecedor": "00254564000150",
  "nomeFornecedor": "CONSUPORTE TRANSPORTES E SERVIÇOS LTDA - EPP",
  "cpfCnpj": "EXCLUSIVO",
  "correcaoAplicada": {
    "timestamp": "2025-09-22T17:30:00.000Z",
    "nomeAnterior": "DIVERSOS",
    "nomesOriginais": [
      "CONSUPORTE TRANSPORTES E SERVIÇOS LTDA - EPP",
      "CONSUPORTE TRANSPORTES E SERVICOS LTDA"
    ],
    "motivo": "Nomes similares (similaridade média: 94.2%)"
  }
}
```

## Configurações

### Threshold de Similaridade
```typescript
const CONFIG = {
  SIMILARITY_THRESHOLD: 0.85, // 85% de similaridade mínima
  // ... outras configurações
};
```

### Abreviações Padronizadas
```typescript
const STANDARDIZED_ABBREVIATIONS = {
  'LTDA': 'LTDA',
  'LTD': 'LTDA',
  'S/A': 'SA',
  'SERVICOS': 'SERVIÇOS',
  // ... outras padronizações
};
```

## Segurança e Auditoria

1. **Backups automáticos**: Todos os arquivos são copiados antes das alterações
2. **Logs detalhados**: Todas as operações são registradas
3. **Metadados de correção**: Cada correção é documentada no arquivo
4. **Relatórios de auditoria**: Histórico completo das mudanças
5. **Modo de simulação**: Permite testar sem fazer alterações

## Monitoramento Contínuo

O sistema inclui:
- **Alertas em tempo real** para casos críticos
- **Métricas de qualidade** atualizadas diariamente
- **Detecção automática** de problemas
- **Relatórios de performance** do sistema

## Impacto Esperado

- ✅ Fornecedores únicos corretamente classificados como "EXCLUSIVO"
- ✅ Redução significativa de falsos positivos "DIVERSOS"
- ✅ Melhor qualidade dos dados agregados
- ✅ Sistema auditável e transparente
- ✅ Processo automatizado e seguro

## Suporte e Manutenção

Para adicionar novas regras de normalização:
1. Editar `CONFIG` em `fornecedor-name-normalizer.ts`
2. Adicionar testes em `fornecedor-normalizer.test.ts`
3. Executar `npm test` para validar
4. Documentar as mudanças

Para casos especiais:
1. Adicionar CNPJ à lista `cnpjsDiversosConhecidos` se realmente for diverso
2. Ajustar threshold de similaridade se necessário
3. Criar regras específicas para casos complexos