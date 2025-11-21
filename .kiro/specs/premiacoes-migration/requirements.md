# Requirements Document

## Introduction

Este documento define os requisitos para migrar a página de Premiações do backup (monitordespesas-backup) para o projeto Next.js atual (monitor-despesas-next) com 100% de fidelidade visual e funcional. A migração envolve reproduzir a estrutura modular completa, incluindo componentes de UI, camada de dados ETL, sistema de premiações (coroas/troféus/medalhas), rankings filtráveis, painel administrativo e todas as interações do usuário.

## Glossary

- **Sistema de Premiações**: O módulo completo que gerencia e exibe premiações (coroas, troféus, medalhas) para deputados baseado em gastos parlamentares
- **PremiacoesPageModular**: Componente React principal do backup que implementa a página completa de premiações
- **PremiacoesPageClient**: Componente React atual no Next.js que será substituído/atualizado
- **ETL**: Extract, Transform, Load - sistema de processamento de dados de deputados e gastos
- **Ranking Unificado**: Sistema que consolida rankings gerais, por ano e por categoria em uma única interface
- **Painel Admin**: Interface administrativa para recalcular premiações, atualizar rankings e limpar cache
- **Primitives UI**: Componentes base reutilizáveis (tabs, card, button, select, badge, tooltip) no padrão shadcn/ui
- **Coroas**: Premiações de nível mais alto para maiores destaques em gastos
- **Troféus**: Premiações de nível intermediário para campeões anuais
- **Medalhas**: Premiações de nível básico para menções honrosas em categorias específicas
- **Campeão Geral**: Deputado com maior gasto total identificado no período
- **Filtros de Ranking**: Controles para filtrar rankings por ano, categoria e UF
- **Badges de Premiação**: Indicadores visuais que mostram premiações de um deputado com tooltips informativos
- **Banner de Premiação**: Componente hero que destaca o campeão atual com estatísticas

## Requirements

### Requirement 1

**User Story:** Como desenvolvedor, eu quero portar todos os componentes UI primitives do backup para o Next.js, para que a base visual seja idêntica

#### Acceptance Criteria

1. WHEN o desenvolvedor inspeciona o diretório components/ui/ do Next.js, THE Sistema de Premiações SHALL conter os arquivos tabs.tsx, card.tsx, button.tsx, select.tsx, badge.tsx e tooltip.tsx com implementação idêntica ao backup
2. WHEN um componente primitive é renderizado, THE Sistema de Premiações SHALL aplicar as mesmas classes Tailwind e comportamentos do backup
3. WHEN os primitives são importados em outros componentes, THE Sistema de Premiações SHALL resolver os imports usando o alias @/components/ui/* sem erros
4. THE Sistema de Premiações SHALL garantir que todos os primitives suportem as mesmas props e variantes do backup
5. WHEN há conflito entre primitives existentes e do backup, THE Sistema de Premiações SHALL criar versões locais específicas para premiações ou alinhar os existentes

### Requirement 2

**User Story:** Como desenvolvedor, eu quero replicar a estrutura de componentes de premiações do backup, para que toda a funcionalidade modular esteja disponível

#### Acceptance Criteria

1. THE Sistema de Premiações SHALL criar o diretório packages/monitor-despesas-next/src/components/premiacoes/ contendo ControlesFiltrosPremiacoes.tsx, ExibicaoPremiacoes.tsx, RankingsFiltrados.tsx, BannerPremiacaoDeputado.tsx e BadgesPremiacaoDeputado.tsx
2. WHEN ControlesFiltrosPremiacoes é renderizado, THE Sistema de Premiações SHALL exibir cabeçalho, painel admin com botão de engrenagem e filtros de ano/categoria/UF
3. WHEN ExibicaoPremiacoes é renderizado, THE Sistema de Premiações SHALL exibir tabs para coroas, troféus e medalhas com contadores e listas detalhadas
4. WHEN RankingsFiltrados é renderizado, THE Sistema de Premiações SHALL exibir lista de deputados ordenada com estatísticas e badges de premiação
5. WHEN BannerPremiacaoDeputado é renderizado, THE Sistema de Premiações SHALL exibir hero/banner do campeão com counters e destaques visuais
6. WHEN BadgesPremiacaoDeputado é renderizado, THE Sistema de Premiações SHALL exibir badges agrupadas com tooltips e contador de premiações

### Requirement 3

**User Story:** Como desenvolvedor, eu quero implementar o componente UnifiedRankingDisplay, para que rankings sejam exibidos com ordenação, estatísticas e navegação

#### Acceptance Criteria

1. THE Sistema de Premiações SHALL criar o arquivo packages/monitor-despesas-next/src/components/unified/UnifiedRankingDisplay.tsx
2. WHEN UnifiedRankingDisplay recebe dados de ranking, THE Sistema de Premiações SHALL exibir lista ordenada de deputados com posição, nome, partido, UF e valores
3. WHEN o usuário clica em um deputado no ranking, THE Sistema de Premiações SHALL navegar para /gastos/perfil/:id
4. WHEN UnifiedRankingDisplay renderiza um item, THE Sistema de Premiações SHALL exibir overlay de badges de premiação quando aplicável
5. THE Sistema de Premiações SHALL suportar ordenação por maior gasto, menor gasto, número de transações, nome, partido e UF
6. WHEN o ranking está vazio, THE Sistema de Premiações SHALL exibir mensagem "Nenhum registro disponível para esta combinação de filtros"

### Requirement 4

**User Story:** Como desenvolvedor, eu quero criar adaptadores de dados que espelhem os serviços do backup, para que a camada de dados seja compatível

#### Acceptance Criteria

1. THE Sistema de Premiações SHALL criar arquivos de serviço em packages/monitor-despesas-next/src/services/ incluindo premiacao-unificada.ts, deputado-premiacao-unificado.ts, premiacoes-processor.ts e unified-ranking-service.ts
2. WHEN premiacao-unificada.getPremiacoes é chamado, THE Sistema de Premiações SHALL retornar objeto com arrays coroas, trofeus, medalhas e estatísticas
3. WHEN unified-ranking-service é usado, THE Sistema de Premiações SHALL fornecer métodos para buscar ranking geral, por ano e por categoria
4. THE Sistema de Premiações SHALL normalizar tipos de dados para casar com DeputadoRanking e PremiacoesProcessadas do backup
5. WHEN dados ETL não estão disponíveis, THE Sistema de Premiações SHALL usar fallback de public/cache/* com estrutura idêntica

### Requirement 5

**User Story:** Como desenvolvedor, eu quero implementar o hook useEtlDeputadosData ou adaptá-lo para server actions, para que dados sejam orquestrados corretamente

#### Acceptance Criteria

1. THE Sistema de Premiações SHALL criar ou adaptar hook em packages/monitor-despesas-next/src/hooks/useEtlDeputadosData.ts
2. WHEN o hook é usado, THE Sistema de Premiações SHALL expor métodos carregarDeputados, carregarRankings, carregarPremiacoes e limparCache
3. WHEN o hook é usado, THE Sistema de Premiações SHALL expor estados loading, error, deputados, rankings, premiacoes e cacheStatus
4. WHEN o hook é usado, THE Sistema de Premiações SHALL expor estatísticas totalDeputados, totalGastos, mediaGastos, anosDisponiveis, ufsDisponiveis e ultimaAtualizacao
5. THE Sistema de Premiações SHALL abstrair busca e geração de dados via etl-cache.service.ts ou equivalente

### Requirement 6

**User Story:** Como desenvolvedor, eu quero substituir PremiacoesPageClient.tsx pelo layout modular do backup, para que a página principal seja idêntica

#### Acceptance Criteria

1. THE Sistema de Premiações SHALL atualizar packages/monitor-despesas-next/src/app/gastos/premiacoes/PremiacoesPageClient.tsx para usar PremiacoesPageModular
2. WHEN a página é renderizada, THE Sistema de Premiações SHALL exibir cabeçalho com título "🏆 Premiações", descrição e status do ETL
3. WHEN a página é renderizada, THE Sistema de Premiações SHALL exibir dashboard com 4 cards de estatísticas (Premiações, Deputados, Coroas, Troféus & Medalhas)
4. WHEN a página é renderizada, THE Sistema de Premiações SHALL exibir tabs principais para "Rankings" e "Premiações" com contadores
5. THE Sistema de Premiações SHALL integrar ControlesFiltrosPremiacoes, RankingsFiltrados, ExibicaoPremiacoes, BannerPremiacaoDeputado e BadgesPremiacaoDeputado

### Requirement 7

**User Story:** Como usuário, eu quero filtrar rankings por ano, categoria e UF, para que eu possa visualizar dados específicos

#### Acceptance Criteria

1. WHEN o usuário seleciona um ano no filtro, THE Sistema de Premiações SHALL atualizar o ranking exibido para mostrar apenas dados daquele ano
2. WHEN o usuário seleciona uma categoria no filtro, THE Sistema de Premiações SHALL atualizar o ranking exibido para mostrar apenas dados daquela categoria
3. WHEN o usuário seleciona uma UF no filtro, THE Sistema de Premiações SHALL atualizar o ranking exibido para mostrar apenas dados daquela UF
4. WHEN múltiplos filtros são aplicados, THE Sistema de Premiações SHALL combinar os filtros usando operação AND
5. WHEN o usuário seleciona "Todos os anos", "Todas as categorias" ou "Todos os estados", THE Sistema de Premiações SHALL remover o respectivo filtro
6. WHEN filtros são alterados, THE Sistema de Premiações SHALL atualizar o título do ranking para refletir os filtros ativos

### Requirement 8

**User Story:** Como usuário, eu quero visualizar premiações organizadas em tabs de coroas, troféus e medalhas, para que eu possa explorar diferentes níveis de reconhecimento

#### Acceptance Criteria

1. WHEN a tab "Premiações" é selecionada, THE Sistema de Premiações SHALL exibir sub-tabs para "Coroas", "Troféus" e "Medalhas"
2. WHEN a sub-tab "Coroas" é selecionada, THE Sistema de Premiações SHALL exibir grid de cards com todas as coroas, incluindo nome do deputado, partido, UF, tipo, ano, categoria e valor
3. WHEN a sub-tab "Troféus" é selecionada, THE Sistema de Premiações SHALL exibir grid de cards com todos os troféus no mesmo formato das coroas
4. WHEN a sub-tab "Medalhas" é selecionada, THE Sistema de Premiações SHALL exibir grid de cards com todas as medalhas no mesmo formato das coroas
5. WHEN uma sub-tab não tem premiações, THE Sistema de Premiações SHALL exibir mensagem "Nenhuma [tipo] disponível"
6. THE Sistema de Premiações SHALL exibir contador de premiações ao lado de cada sub-tab (ex: "Coroas (5)")

### Requirement 9

**User Story:** Como administrador, eu quero acessar painel admin para recalcular premiações e atualizar dados, para que eu possa manter o sistema atualizado

#### Acceptance Criteria

1. WHEN o usuário clica no botão de engrenagem no cabeçalho, THE Sistema de Premiações SHALL exibir painel dropdown com opções administrativas
2. WHEN o usuário clica em "Calcular Premiações", THE Sistema de Premiações SHALL executar carregarPremiacoes e exibir estado de loading
3. WHEN o usuário clica em "Atualizar Rankings", THE Sistema de Premiações SHALL executar carregarRankings e atualizar a visualização
4. WHEN o usuário clica em "Atualizar Dados ETL", THE Sistema de Premiações SHALL executar carregarDeputados e recarregar dados base
5. WHEN o usuário clica em "Limpar Cache", THE Sistema de Premiações SHALL executar limparCache e exibir confirmação
6. THE Sistema de Premiações SHALL exibir no painel admin estatísticas resumidas (total de deputados, gastos totais, total de premiações)
7. WHEN uma ação admin está em progresso, THE Sistema de Premiações SHALL desabilitar o botão correspondente e exibir texto "Calculando..." ou "Atualizando..."

### Requirement 10

**User Story:** Como usuário, eu quero ver o banner do campeão geral destacado, para que eu possa identificar rapidamente o maior gastador

#### Acceptance Criteria

1. WHEN a página é carregada e há um campeão geral, THE Sistema de Premiações SHALL exibir BannerPremiacaoDeputado no topo da seção de premiações
2. WHEN BannerPremiacaoDeputado é renderizado, THE Sistema de Premiações SHALL exibir ícone de coroa, nome do deputado, partido, UF e valor total
3. WHEN BannerPremiacaoDeputado é renderizado, THE Sistema de Premiações SHALL aplicar estilo destacado com borda roxa e fundo gradiente
4. THE Sistema de Premiações SHALL exibir título "🏆 Campeão Geral dos Gastos" no banner
5. WHEN não há campeão geral, THE Sistema de Premiações SHALL ocultar o banner

### Requirement 11

**User Story:** Como usuário, eu quero ver badges de premiação sobre cada deputado no ranking, para que eu possa identificar rapidamente quem tem premiações

#### Acceptance Criteria

1. WHEN um deputado no ranking possui premiações, THE Sistema de Premiações SHALL exibir BadgesPremiacaoDeputado sobre o item
2. WHEN o usuário passa o mouse sobre uma badge, THE Sistema de Premiações SHALL exibir tooltip com detalhes da premiação (tipo, categoria, ano, valor)
3. WHEN um deputado tem múltiplas premiações, THE Sistema de Premiações SHALL agrupar badges e exibir contador (ex: "+3")
4. THE Sistema de Premiações SHALL usar ícones distintos para coroas (Crown), troféus (Trophy) e medalhas (Medal)
5. THE Sistema de Premiações SHALL aplicar cores distintas para cada tipo de premiação (amarelo para coroas, azul para troféus, laranja para medalhas)

### Requirement 12

**User Story:** Como desenvolvedor, eu quero garantir fidelidade visual 100% com o backup, para que a experiência do usuário seja idêntica

#### Acceptance Criteria

1. THE Sistema de Premiações SHALL usar as mesmas classes Tailwind do backup em todos os componentes
2. THE Sistema de Premiações SHALL usar os mesmos ícones lucide-react do backup (Crown, Trophy, Medal, Star, Filter, Settings, etc.)
3. THE Sistema de Premiações SHALL usar os mesmos textos, títulos, descrições e microcopy do backup
4. THE Sistema de Premiações SHALL usar a mesma hierarquia de cards, tabs e layout do backup
5. THE Sistema de Premiações SHALL usar os mesmos espaçamentos, tamanhos de fonte e cores do backup
6. WHEN a página é visualizada em http://localhost:[porta]/gastos/premiacoes, THE Sistema de Premiações SHALL ter aparência pixel-idêntica ao backup

### Requirement 13

**User Story:** Como usuário, eu quero ver estados de loading e erro apropriados, para que eu entenda o status do sistema

#### Acceptance Criteria

1. WHEN dados estão sendo carregados, THE Sistema de Premiações SHALL exibir Alert azul com mensagem "Carregando dados de deputados do Sistema ETL..."
2. WHEN premiações estão sendo processadas, THE Sistema de Premiações SHALL exibir Alert roxo com mensagem "Processando premiações e rankings..."
3. WHEN ocorre erro ao carregar dados, THE Sistema de Premiações SHALL exibir Alert laranja com mensagem de erro e botões "Tentar Novamente" e "Processar Dados"
4. WHEN não há dados disponíveis para filtros selecionados, THE Sistema de Premiações SHALL exibir mensagem "Nenhum registro disponível para esta combinação de filtros"
5. THE Sistema de Premiações SHALL exibir indicador de status do ETL no cabeçalho (conectado/local/sem dados) com ícone colorido

### Requirement 14

**User Story:** Como desenvolvedor, eu quero garantir que dados sejam carregados do ETL com fallback para cache, para que o sistema funcione offline

#### Acceptance Criteria

1. WHEN o sistema ETL está disponível, THE Sistema de Premiações SHALL carregar dados via etl-cache.service.ts ou equivalente
2. WHEN o sistema ETL não está disponível, THE Sistema de Premiações SHALL carregar dados de public/cache/* com estrutura idêntica
3. WHEN dados são carregados de localStorage, THE Sistema de Premiações SHALL exibir indicador "💾 Dados locais" no status
4. WHEN dados são carregados do ETL, THE Sistema de Premiações SHALL exibir indicador "🔗 Conectado ao Sistema ETL" no status
5. THE Sistema de Premiações SHALL exibir timestamp de última atualização no formato legível (ex: "há 2 horas")

### Requirement 15

**User Story:** Como usuário, eu quero navegar para o perfil de um deputado ao clicar nele, para que eu possa ver detalhes completos

#### Acceptance Criteria

1. WHEN o usuário clica em um deputado no ranking, THE Sistema de Premiações SHALL navegar para /gastos/perfil/:id onde :id é o ID do deputado
2. WHEN o usuário clica em um deputado em uma premiação, THE Sistema de Premiações SHALL navegar para /gastos/perfil/:id
3. THE Sistema de Premiações SHALL usar Link do Next.js para navegação client-side sem reload
4. WHEN a navegação ocorre, THE Sistema de Premiações SHALL preservar o estado da página de premiações no histórico do browser
