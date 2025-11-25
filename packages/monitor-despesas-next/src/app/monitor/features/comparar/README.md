# Feature: Comparador Avançado de Gastos

## Visão Geral
Feature robusta e completa para comparação multidimensional de gastos entre deputados federais, estados e partidos. Permite análise comparativa de até 4 deputados simultaneamente com múltiplas visualizações e filtros avançados.

## 🎯 Características Principais

### ✅ Comparação de Deputados
- **Seleção Intuitiva**: Até 4 deputados com busca e autocomplete
- **Dados Reais**: Carregamento de dados detalhados sob demanda
- **Múltiplas Dimensões**: Análise por categoria, período, fornecedores, etc.

### ✅ Filtros Avançados
- **Por Categoria**: Filtre por tipo de despesa específico
- **Por Ano**: Analise períodos específicos
- **Por Mês**: Visualize padrões mensais
- **Combinados**: Use múltiplos filtros simultaneamente

### ✅ 5 Abas de Análise

#### 1. **Resumo**
- Tabela comparativa com métricas principais
- Gasto Total, Transações, Média por Transação
- Score de Alertas/Suspeitas
- Destaque visual para valores máximos

#### 2. **Evolução**
- Gráfico de linha: Evolução anual de gastos
- Gráfico de barras: Comparação de totais
- Análise de tendências ao longo do tempo

#### 3. **Categorias**
- Gráfico de barras agrupadas por categoria
- Gráficos de pizza individuais (top 5 categorias)
- Identificação de padrões de gastos
- Comparação de distribuição

#### 4. **Mensal**
- Evolução mensal (agregado de todos os anos)
- Estatísticas: Média, maior e menor mês
- Tabela detalhada mês a mês
- Identificação de sazonalidade

#### 5. **Fornecedores**
- Top 10 fornecedores por deputado
- Fornecedores em comum entre deputados
- Percentual do total por fornecedor
- Análise de concentração

### ✅ Comparação de Estados e Partidos
- Agregação por UF
- Agregação por partido
- Médias e totais
- Análise comparativa

## 📊 Métricas Disponíveis

### Por Deputado
- **Totais**: Gasto total, número de transações
- **Médias**: Média por transação, média mensal
- **Distribuição**: Por categoria, por mês, por fornecedor
- **Evolução**: Anual, mensal
- **Qualidade**: Score de suspeição, alertas

### Por Categoria
- Total gasto por categoria
- Número de transações
- Percentual do total
- Comparação entre deputados

### Por Período
- Gastos por ano
- Gastos por mês (agregado)
- Evolução temporal
- Sazonalidade

### Por Fornecedor
- Top fornecedores
- Valor total transacionado
- Número de transações
- Fornecedores compartilhados

## 🗂️ Estrutura de Arquivos

```
comparar/
├── page.tsx                          # Página principal com Suspense
├── CompararFeature.tsx               # Componente principal (expandido)
├── README.md                         # Esta documentação
└── components/
    ├── ModernDeputadoSelector.tsx    # Seletor de deputados
    ├── ComparisonSummary.tsx         # Tabela de resumo
    ├── ComparisonChart.tsx           # Gráficos de evolução
    ├── CategoryComparison.tsx        # Análise por categoria (NOVO)
    ├── MonthlyComparison.tsx         # Análise mensal (NOVO)
    ├── SuppliersComparison.tsx       # Análise de fornecedores (NOVO)
    ├── ComparisonTable.tsx           # (Legado - pode ser removido)
    └── DeputadoSelector.tsx          # (Legado - pode ser removido)
```

## 🔧 API de Dados

### getDetailedComparisonData(ids, filters)
Retorna dados detalhados para comparação com suporte a filtros.

**Parâmetros:**
- `ids: string[]` - IDs dos deputados
- `filters: { categoria?, ano?, mes? }` - Filtros opcionais

**Retorna:**
```typescript
{
  id, nome, partido, uf, urlFoto,
  totalGasto, totalTransacoes, mediaTransacao,
  gastosPorAno, transacoesPorAno,
  gastosPorMes, transacoesPorMes,
  gastosPorCategoria: [{ categoria, total, transacoes }],
  topFornecedores: [{ nome, total, transacoes }],
  scoreSuspeicao, numAlertas,
  evolucaoMensal: [{ mes, total }]
}
```

### getCategoriasDisponiveis()
Retorna lista de categorias de despesas disponíveis.

### compareEstados(ufs)
Compara agregação de gastos por estado.

### comparePartidos(partidos)
Compara agregação de gastos por partido.

## 💡 Casos de Uso

### 1. Comparar Gastos Gerais
```
1. Selecione 2-4 deputados
2. Veja aba "Resumo" para visão geral
3. Veja aba "Evolução" para tendências
```

### 2. Analisar Categoria Específica
```
1. Selecione deputados
2. Escolha categoria no filtro (ex: "COMBUSTÍVEIS")
3. Compare gastos apenas nesta categoria
4. Veja distribuição na aba "Categorias"
```

### 3. Análise Temporal
```
1. Selecione deputados
2. Escolha ano específico no filtro
3. Veja aba "Mensal" para padrões mensais
4. Identifique sazonalidade
```

### 4. Investigar Fornecedores
```
1. Selecione deputados
2. Vá para aba "Fornecedores"
3. Veja top fornecedores de cada um
4. Identifique fornecedores em comum
```

### 5. Comparar Estados
```
1. Use função compareEstados(['SP', 'RJ', 'MG'])
2. Veja totais e médias por estado
3. Identifique padrões regionais
```

## 🎨 Visualizações

### Gráficos Disponíveis
- **Linha**: Evolução temporal
- **Barras**: Comparação de totais
- **Barras Agrupadas**: Múltiplas métricas
- **Pizza**: Distribuição percentual
- **Tabelas**: Dados detalhados

### Cores
- Azul (#3B82F6): Deputado 1
- Vermelho (#EF4444): Deputado 2
- Verde (#10B981): Deputado 3
- Laranja (#F59E0B): Deputado 4

## 🚀 Melhorias Implementadas

### v3.0 (Atual - Expandido)
- ✅ **5 abas de análise** (Resumo, Evolução, Categorias, Mensal, Fornecedores)
- ✅ **Filtros avançados** (Categoria, Ano)
- ✅ **Análise por categoria** com gráficos de barras e pizza
- ✅ **Análise mensal** com evolução e estatísticas
- ✅ **Análise de fornecedores** com fornecedores em comum
- ✅ **Comparação de estados** e partidos
- ✅ **Dados detalhados** com múltiplas dimensões

### v2.0 (Anterior)
- ✅ Estado interno sem URL
- ✅ Dados reais
- ✅ 2 tipos de gráficos

### v1.0 (Original)
- ❌ Dependia de URL
- ❌ Dados mockados

## 📈 Próximas Melhorias Sugeridas

### Curto Prazo
1. **Exportação**: PDF/Excel com relatório completo
2. **Compartilhamento**: Link para compartilhar comparação
3. **Favoritos**: Salvar comparações frequentes
4. **Mais Filtros**: Por fornecedor, por valor mínimo

### Médio Prazo
5. **Comparação de Partidos**: Interface dedicada
6. **Comparação de Estados**: Interface dedicada
7. **Análise Estatística**: Desvio padrão, outliers, correlações
8. **Alertas**: Notificações de padrões suspeitos

### Longo Prazo
9. **Machine Learning**: Predição de gastos
10. **Rede de Fornecedores**: Visualização de conexões
11. **Timeline Interativa**: Eventos e gastos
12. **Comparação Histórica**: Múltiplos mandatos

## 🛠️ Tecnologias

- **React 19**: Hooks modernos, Suspense
- **Next.js 16**: App Router, Server Actions
- **Recharts**: Gráficos responsivos e interativos
- **shadcn/ui**: Componentes de UI premium
- **TypeScript**: Tipagem forte e segura
- **Tailwind CSS**: Estilização moderna

## 📝 Notas de Desenvolvimento

### Performance
- Dados carregados sob demanda
- Caching de categorias
- Memoização de cálculos
- Lazy loading de componentes

### Acessibilidade
- Labels semânticos
- Navegação por teclado
- Cores com contraste adequado
- Tooltips informativos

### Responsividade
- Mobile-first design
- Gráficos adaptáveis
- Tabelas com scroll horizontal
- Layout flexível

## 🎓 Exemplos de Insights

### Padrões Identificáveis
- **Sazonalidade**: Gastos maiores em certos meses
- **Concentração**: Dependência de poucos fornecedores
- **Categorias**: Preferências de tipos de despesa
- **Evolução**: Tendências de aumento/redução
- **Comparação**: Diferenças entre partidos/estados

### Alertas Possíveis
- Gastos muito acima da média
- Concentração excessiva em um fornecedor
- Padrões atípicos mensais
- Categorias suspeitas
- Fornecedores compartilhados suspeitos
