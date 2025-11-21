# Implementation Plan

- [x] 1. Criar serviços compartilhados de dados





  - Implementar `FornecedoresDataService` centralizado que acessa o cache ETL
  - Implementar `CategoryFilterService` para validação e filtros de categoria
  - Criar interfaces TypeScript para padronizar contratos de dados
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 1.1 Implementar FornecedoresDataService


  - Criar classe que centraliza acesso ao cache ETL via `fetchManifest` e `fetchSuppliersCache`
  - Implementar métodos para carregamento de todos os fornecedores e por categoria
  - Adicionar lógica de transformação de dados consistente entre páginas
  - Implementar cache e debouncing para otimização de performance
  - _Requirements: 3.1, 3.2_

- [x] 1.2 Implementar CategoryFilterService


  - Criar serviço para validação de categorias existentes
  - Implementar normalização de nomes de categoria (slug para nome completo)
  - Adicionar lógica de filtro de fornecedores por categoria específica
  - Implementar método para obter lista de categorias disponíveis
  - _Requirements: 2.2, 2.3, 4.1, 4.3_

- [x] 1.3 Definir interfaces TypeScript compartilhadas


  - Criar interfaces para `FornecedorSimples`, `EstatisticasSimples`, `DadosGraficos`
  - Definir contratos para serviços (`IFornecedoresDataService`, `ICategoryFilterService`)
  - Padronizar tipos de filtros e parâmetros entre páginas
  - _Requirements: 3.3, 5.3_

- [x] 2. Extrair componentes reutilizáveis da página de fornecedores





  - Extrair componentes de tabela, estatísticas, gráficos e filtros da `FornecedoresPage`
  - Criar biblioteca de componentes compartilhados para funcionalidade de fornecedores
  - Implementar props para customização específica de cada página
  - _Requirements: 5.1, 5.2_

- [x] 2.1 Extrair FornecedoresTable component


  - Separar lógica de tabela de fornecedores com paginação da `FornecedoresPage`
  - Criar component reutilizável que aceita lista de fornecedores e configurações
  - Implementar props para customização de colunas e ações
  - _Requirements: 5.1, 5.4_

- [x] 2.2 Extrair FornecedoresStats component


  - Separar cards de estatísticas (total, volume, score médio, alto risco) em component próprio
  - Criar interface para receber dados de estatísticas calculadas
  - Implementar formatação consistente de valores monetários e numéricos
  - _Requirements: 5.1, 5.4_

- [x] 2.3 Extrair FornecedoresCharts component


  - Separar gráficos (Top 5 fornecedores, Distribuição por categoria) em components reutilizáveis
  - Implementar props para dados de gráfico e configurações de filtro
  - Manter funcionalidade de seleção de ano e categoria
  - _Requirements: 5.1, 5.4_

- [x] 2.4 Extrair FornecedoresFilters component


  - Separar seção de filtros (busca, categoria, score) em component reutilizável
  - Implementar callbacks para mudanças de filtro
  - Adicionar prop para lista de categorias disponíveis
  - _Requirements: 5.1, 5.4_
-

- [x] 3. Refatorar página de fornecedores para usar novos serviços




  - Migrar `FornecedoresPage` para utilizar `FornecedoresDataService`
  - Substituir lógica inline pelos componentes extraídos
  - Manter funcionalidade atual sem quebrar comportamento existente
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 3.1 Migrar carregamento de dados na FornecedoresPage


  - Substituir chamadas diretas ao cache ETL pelo `FornecedoresDataService`
  - Atualizar hooks de estado para usar dados do serviço centralizado
  - Manter compatibilidade com estrutura de dados atual
  - _Requirements: 1.1, 1.2, 3.1_

- [x] 3.2 Integrar componentes extraídos na FornecedoresPage


  - Substituir código inline pelos novos componentes reutilizáveis
  - Configurar props adequadas para manter comportamento atual
  - Verificar que todos os recursos continuam funcionando
  - _Requirements: 5.1, 5.4_

- [ ]* 3.3 Adicionar testes para FornecedoresPage refatorada
  - Criar testes unitários para verificar integração com novos serviços
  - Testar carregamento de dados e renderização de componentes
  - Verificar comportamento de filtros e paginação
  - _Requirements: 1.1, 5.1_

- [x] 4. Refatorar completamente página de categoria





  - Simplificar `CategoriaPage` para usar arquitetura compartilhada
  - Remover dependências de hooks complexos (`useCategoriaData`, `FornecedoresDataProvider`)
  - Implementar filtro de categoria usando `CategoryFilterService`
  - _Requirements: 2.1, 2.2, 2.3, 4.1_

- [x] 4.1 Simplificar estrutura da CategoriaPage


  - Remover `CategoriasFornecedores` complexo e substituir por implementação simples
  - Eliminar dependência de `useCategoriaData` e hooks relacionados
  - Usar `FornecedoresDataService` como fonte única de dados
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 4.2 Implementar filtro de categoria na CategoriaPage


  - Usar `CategoryFilterService` para validar parâmetro de categoria da URL
  - Aplicar filtro de categoria aos dados carregados do `FornecedoresDataService`
  - Implementar redirecionamento para categorias inválidas
  - _Requirements: 2.2, 2.3, 4.1, 4.3_

- [x] 4.3 Integrar componentes compartilhados na CategoriaPage


  - Usar mesmos componentes da `FornecedoresPage` (tabela, stats, gráficos, filtros)
  - Configurar componentes para mostrar apenas dados da categoria filtrada
  - Manter interface consistente entre as duas páginas
  - _Requirements: 2.1, 5.1, 5.4_

- [x] 4.4 Implementar tratamento de erros na CategoriaPage


  - Adicionar validação de categoria antes de carregar dados
  - Implementar fallback para categorias inexistentes (404 ou redirect)
  - Exibir mensagens de erro apropriadas para problemas de carregamento
  - _Requirements: 4.2, 4.4_

- [ ]* 4.5 Adicionar testes para CategoriaPage refatorada
  - Criar testes para validação de categoria e filtros
  - Testar comportamento com categorias válidas e inválidas
  - Verificar integração com componentes compartilhados
  - _Requirements: 2.1, 4.1, 5.1_

- [x] 5. Limpar código legado e otimizar




  - Remover hooks e contextos não utilizados (`useCategoriaData`, partes do `FornecedoresDataProvider`)
  - Limpar imports quebrados e dependências desnecessárias
  - Otimizar performance e adicionar error boundaries
  - _Requirements: 3.4, 5.2_

- [x] 5.1 Remover código legado não utilizado


  - Deletar ou deprecar `useCategoriaData` e hooks relacionados
  - Limpar `FornecedoresDataProvider` removendo funcionalidades duplicadas
  - Remover imports quebrados e dependências não utilizadas
  - _Requirements: 3.4, 5.2_

- [x] 5.2 Implementar error boundaries


  - Criar error boundary para capturar erros de carregamento de dados
  - Implementar fallbacks apropriados para diferentes tipos de erro
  - Adicionar logging detalhado para debugging
  - _Requirements: 3.4, 4.2_

- [ ]* 5.3 Otimizar performance
  - Implementar memoização adequada nos componentes reutilizáveis
  - Otimizar re-renders desnecessários
  - Verificar performance de filtros com grandes datasets
  - _Requirements: 3.5_
-

- [x] 6. Validar integração completa




  - Testar navegação entre `/gastos/fornecedores` e `/gastos/categorias/[categoria]`
  - Verificar consistência de dados entre as duas páginas
  - Confirmar que filtros e funcionalidades trabalham corretamente
  - _Requirements: 1.1, 2.1, 3.1, 4.1_

- [x] 6.1 Testar fluxo completo de navegação


  - Verificar que página geral carrega todos os fornecedores corretamente
  - Testar navegação para páginas de categoria específica
  - Confirmar que dados filtrados são consistentes com expectativa
  - _Requirements: 1.1, 2.1, 4.1_

- [x] 6.2 Validar consistência de dados




  - Comparar dados exibidos na página geral vs página de categoria
  - Verificar que estatísticas e gráficos refletem filtros aplicados
  - Confirmar que paginação e ordenação funcionam em ambas as páginas
  - _Requirements: 2.1, 3.1, 5.4_

- [ ]* 6.3 Executar testes de regressão
  - Testar todas as funcionalidades existentes para garantir que não foram quebradas
  - Verificar performance com datasets grandes
  - Testar em diferentes navegadores e dispositivos
  - _Requirements: 1.3, 3.5_