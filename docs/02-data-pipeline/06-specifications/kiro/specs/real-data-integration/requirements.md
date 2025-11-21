# Requirements: Eliminate Mock Data and Complete Real Data Integration

## Introduction

Este spec define os requisitos para eliminar completamente todos os dados mock, placeholders e conteúdo estático em todo o projeto Monitor Despesas. O objetivo é conectar todas as páginas e componentes aos dados reais dos caches materializados, garantindo uma aplicação totalmente funcional e pronta para produção.

## Glossary

- **ETL Pipeline**: Sistema de extração, transformação e carregamento de dados parlamentares
- **Materialize**: Sistema de cache/materialização de dados processados pelo ETL
- **Sistema Frontend**: Aplicação Next.js do Monitor Despesas
- **Mock Data**: Dados falsos gerados com Math.random() ou arrays hardcoded
- **Real Data**: Dados reais provenientes dos caches materializados, não mockados
- **Cache Service**: Serviço responsável por acessar dados dos caches materializados
- **Materialized Cache**: Arquivos JSON gerados pelo ETL contendo dados processados
- **Data Integration**: Processo de conectar componentes aos dados reais dos caches

## Requirements

### Requirement 1

**User Story:** Como usuário do sistema, eu quero que todas as páginas e componentes exibam dados reais dos caches materializados, para que eu possa fazer análises precisas e confiáveis sem dados mock.

#### Acceptance Criteria

1. THE Sistema Frontend SHALL eliminar completamente todos os dados gerados com Math.random()
2. THE Sistema Frontend SHALL remover todos os arrays hardcoded e loops gerando dados fake
3. THE Sistema Frontend SHALL conectar todos os componentes aos caches materializados existentes
4. WHEN dados não estão disponíveis nos caches, THE Sistema Frontend SHALL exibir mensagem informativa específica
5. THE Sistema Frontend SHALL validar integridade dos dados dos caches antes de exibir

### Requirement 2

**User Story:** Como usuário, eu quero que todas as páginas de categoria exibam dados reais dos deputados, para que eu possa identificar padrões reais de gastos por parlamentar.

#### Acceptance Criteria

1. THE Sistema Frontend SHALL conectar DeputadosCategoriaPage ao deputies-cache.json
2. THE Sistema Frontend SHALL exibir rankings reais de deputados usando dados dos caches
3. THE Sistema Frontend SHALL mostrar evolução temporal real dos gastos por deputado
4. THE Sistema Frontend SHALL implementar filtros usando dados reais dos caches materializados
5. THE Sistema Frontend SHALL calcular estatísticas usando dados reais, não mock

### Requirement 3

**User Story:** Como usuário, eu quero que todas as páginas de transações exibam dados reais dos caches, para que eu possa analisar padrões reais e identificar anomalias verdadeiras.

#### Acceptance Criteria

1. THE Sistema Frontend SHALL conectar TransacoesCategoriaPage aos caches individuais deputy-{id}.json
2. THE Sistema Frontend SHALL agregar transações reais por categoria dos caches existentes
3. THE Sistema Frontend SHALL exibir detalhes reais de transações dos caches materializados
4. THE Sistema Frontend SHALL implementar filtros usando dados reais dos caches
5. THE Sistema Frontend SHALL destacar transações suspeitas baseadas em scores reais dos caches

### Requirement 4

**User Story:** Como usuário, eu quero que todas as páginas de evolução temporal exibam dados reais dos caches, para que eu possa identificar tendências e sazonalidades verdadeiras.

#### Acceptance Criteria

1. THE Sistema Frontend SHALL conectar EvolucaoCategoriaPage aos dados de evolução dos suppliers-cache.json
2. THE Sistema Frontend SHALL exibir gráficos usando dados temporais reais dos caches
3. THE Sistema Frontend SHALL calcular tendências baseadas em dados reais dos caches materializados
4. THE Sistema Frontend SHALL comparar categorias usando dados reais, não mock
5. THE Sistema Frontend SHALL identificar períodos atípicos baseados em dados históricos reais

### Requirement 5

**User Story:** Como usuário, eu quero que todas as páginas de relacionamentos exibam conexões reais dos caches, para que eu possa identificar vínculos suspeitos verdadeiros.

#### Acceptance Criteria

1. THE Sistema Frontend SHALL conectar RelacoesCategoriaPage aos dados de relacionamentos dos caches
2. THE Sistema Frontend SHALL calcular métricas usando dados reais dos caches materializados
3. THE Sistema Frontend SHALL identificar clusters baseados em dados reais de transações
4. THE Sistema Frontend SHALL exibir relacionamentos temporais usando dados históricos reais
5. THE Sistema Frontend SHALL destacar exclusividade baseada em scores reais dos caches

### Requirement 6

**User Story:** Como usuário, eu quero que todas as páginas de alertas exibam alertas reais dos caches, para que eu possa focar em irregularidades verdadeiras.

#### Acceptance Criteria

1. THE Sistema Frontend SHALL conectar AlertasCategoriaPage aos scores de suspeição dos caches
2. THE Sistema Frontend SHALL gerar alertas baseados em dados reais dos caches materializados
3. THE Sistema Frontend SHALL classificar alertas usando métricas reais dos caches
4. THE Sistema Frontend SHALL exibir contexto real de alertas dos dados dos caches
5. THE Sistema Frontend SHALL implementar ações sobre alertas usando dados reais

### Requirement 7

**User Story:** Como usuário, eu quero que todas as páginas principais do projeto usem dados reais dos caches, para que não haja mais placeholders ou seções "Em desenvolvimento".

#### Acceptance Criteria

1. THE Sistema Frontend SHALL conectar /gastos/deputados ao deputies-cache.json
2. THE Sistema Frontend SHALL conectar /gastos/fornecedores ao suppliers-cache.json
3. THE Sistema Frontend SHALL conectar /gastos/premiacoes ao rankings-cache.json
4. THE Sistema Frontend SHALL eliminar todas as seções "Em desenvolvimento" substituindo por funcionalidades reais
5. THE Sistema Frontend SHALL implementar todas as páginas usando dados dos caches materializados

### Requirement 8

**User Story:** Como desenvolvedor, eu quero que todos os serviços de dados processem os caches materializados existentes, para que haja uma arquitetura consistente de acesso aos dados reais.

#### Acceptance Criteria

1. THE Cache Services SHALL processar eficientemente os caches materializados existentes
2. THE Cache Services SHALL implementar cache local inteligente para otimizar performance
3. THE Cache Services SHALL validar dados dos caches antes de fornecer aos componentes
4. THE Cache Services SHALL tratar erros de carregamento de caches graciosamente
5. THE Cache Services SHALL manter consistência entre dados de diferentes caches materializados