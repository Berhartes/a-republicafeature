# Implementation Plan

- [x] 1. Setup and verify UI primitives compatibility





  - Verify that existing UI primitives (tabs, card, button, select, badge, tooltip) in packages/monitor-despesas-next/src/components/ui/ are compatible with backup requirements
  - Compare props, variants, and styling between backup and Next.js versions
  - Create compatibility layer or local copies if needed for premiações-specific styling
  - Test rendering of all primitives in isolation with backup styles
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Refactor services layer to follow project pattern (Server Actions + Pure Utils)



- [x] 2.1 Refactor services to pure utility functions


  - Refactor packages/monitor-despesas-next/src/services/unified-ranking-service.ts to be pure (no I/O)
  - Refactor packages/monitor-despesas-next/src/services/premiacao-unificada.ts to be pure (no I/O)
  - Keep packages/monitor-despesas-next/src/services/premiacoes-processor.ts as is (already pure)
  - Remove etl-cache.service.ts (not following project pattern)
  - Ensure all functions receive data as parameters instead of fetching it
  - _Requirements: 4.2, 4.3, 7.1, 7.2, 7.3, 7.4_

- [x] 2.2 Update getPremiacoes Server Action in data-actions.ts


  - Modify packages/monitor-despesas-next/src/app/gastos/actions/data-actions.ts
  - Update getPremiacoes() to use utility functions from unified-ranking-service
  - Update getPremiacoes() to use utility functions from premiacao-unificada
  - Ensure it reads from public/cache/deputies-cache.json like other actions
  - Apply filters (ano, categoria, uf) using getRankingFiltrado()
  - Compute rankings using getRankingGeral(), getRankingPorAno(), getRankingPorCategoria()
  - Compute premiações using processarPremiacoes(), processarCoroas(), processarTrofeus(), processarMedalhas()
  - Return complete data structure matching PremiacoesPageClient props
  - _Requirements: 4.2, 4.3, 4.5, 5.5, 8.2, 8.3, 8.4, 10.1_

- [ ]* 2.3 Write unit tests for utility functions
  - Create test files for unified-ranking-service, premiacao-unificada, premiacoes-processor
  - Test filtering logic with mock deputados data
  - Test premiação classification rules (coroas vs troféus vs medalhas)
  - Test edge cases (empty data, single deputado, ties in ranking)
  - _Requirements: 4.2, 4.3, 4.4_

- [x] 3. Implement page.tsx Server Component




- [x] 3.1 Create page.tsx following project pattern


  - Create packages/monitor-despesas-next/src/app/gastos/premiacoes/page.tsx (already exists, needs update)
  - Define metadata with title and description
  - Set revalidate = 3600 (1 hour cache)
  - Define PageProps interface with searchParams (ano, categoria, uf)
  - Implement async function to resolve searchParams (handle Promise and URLSearchParams)
  - Call getPremiacoes(searchParams) Server Action
  - Pass premiacoesData to PremiacoesPageClient
  - Wrap in Suspense with loading fallback
  - _Requirements: 1.1, 4.5, 5.1, 5.2_

- [ ]* 3.2 Add error boundary
  - Wrap page content in DataErrorBoundary component (like fornecedores page)
  - Handle errors gracefully with user-friendly messages
  - _Requirements: 13.1, 13.2, 13.3_
  - Test loading states transition correctly
  - Test error handling and fallback logic
  - Test cache status updates
  - Mock etl-cache.service methods
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4. Update PremiacoesPageClient to follow project pattern







- [ ] 4.1 Refactor PremiacoesPageClient component structure
  - Update packages/monitor-despesas-next/src/app/gastos/premiacoes/PremiacoesPageClient.tsx
  - Add 'use client' directive at top
  - Define PremiacoesPageClientProps interface to receive premiacoesData from page.tsx
  - Use useRouter, usePathname, useSearchParams hooks (like DeputadosClient)
  - Use useTransition for smooth filter transitions
  - Implement updateURL() helper to update searchParams and navigate


  - _Requirements: 1.1, 2.1, 7.1, 7.2, 7.3_

- [ ] 4.2 Implement filter controls in PremiacoesPageClient
  - Add Select for ano with options: "Todos os anos" + metadata.anosDisponiveis
  - Add Select for categoria with options: "Todas as categorias" + metadata.categoriasDisponiveis
  - Add Select for UF with options: "Todos" + metadata.ufsDisponiveis
  - Connect to updateURL() to modify searchParams on change
  - Add Calendar, Trophy, TrendingUp icons to respective filters


  - Disable controls when isPending is true
  - Add "Limpar Filtros" button to reset all filters
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 4.3 Implement category selection UI
  - Add button to toggle category selection grid
  - Create grid layout (2-4 columns responsive) for category buttons
  - Add "Todas as categorias" button with Filter icon
  - Map metadata.categoriasDisponiveis to buttons with icons
  - Apply variant="default" to selected category, "outline" to others
  - Truncate long category names with text-xs and leading-tight
  - Call updateURL({ categoria: value }) on click
  - _Requirements: 2.2, 7.2_
-

- [x] 5. Create ExibicaoPremiacoes component




- [x] 5.1 Implement component structure with tabs


  - Create packages/monitor-despesas-next/src/components/premiacoes/ExibicaoPremiacoes.tsx
  - Define ExibicaoPremiacoesProps interface
  - Implement Tabs with TabsList containing Coroas, Troféus, Medalhas triggers
  - Add Crown, Trophy, Medal icons to respective tabs
  - Add counters to tab labels (e.g., "Coroas (5)")
  - Disable tabs when corresponding array is empty
  - _Requirements: 2.3, 8.1, 8.6_

- [x] 5.2 Implement Coroas tab content

  - Create TabsContent for "coroas" value
  - Render Card with CardHeader "Campeões históricos" and Crown icon
  - Create grid layout (2-3 columns responsive) for coroas
  - Map premiacoes.coroas to cards with: nome, partido, UF, tipo badge, ano badge, valor
  - Apply border-2 border-yellow-200 bg-yellow-50 styling
  - Show "Nenhuma coroa disponível" when empty
  - _Requirements: 8.2, 8.5_

- [x] 5.3 Implement Troféus tab content

  - Create TabsContent for "trofeus" value
  - Render Card with CardHeader "Campeões anuais" and Trophy icon
  - Create grid layout (2-3 columns responsive) for trofeus
  - Map premiacoes.trofeus to cards with same structure as coroas
  - Apply border-2 border-blue-200 bg-blue-50 styling
  - Show "Nenhum troféu disponível" when empty
  - _Requirements: 8.3, 8.5_

- [x] 5.4 Implement Medalhas tab content




  - Create TabsContent for "medalhas" value


  - Render Card with CardHeader "Menções honrosas" and Medal icon
  - Create grid layout (2-3 columns responsive) for medalhas
  - Map premiacoes.medalhas to cards with same structure as coroas
  - Apply border-2 border-orange-200 bg-orange-50 styling
  - Show "Nenhuma medalha disponível" when empty
  - _Requirements: 8.4, 8.5_


- [ ] 6. Create UnifiedRankingDisplay component

- [ ] 6.1 Implement component structure and ranking items
  - Create packages/monitor-despesas-next/src/components/unified/UnifiedRankingDisplay.tsx
  - Define UnifiedRankingDisplayProps interface
  - Map deputados to ranking items with flex layout
  - Render position badge (circular, numbered) on left

  - Render deputado info (nome, partido, UF, transações) in center
  - Render valor and optional year-specific valor on right
  - _Requirements: 3.2, 15.1_

- [ ] 6.2 Implement top 3 medal styling
  - Apply bg-yellow-100 text-yellow-700 border-yellow-200 for position 1
  - Apply bg-gray-100 text-gray-700 border-gray-200 for position 2

  - Apply bg-amber-100 text-amber-700 border-amber-200 for position 3
  - Apply hover:bg-accent/50 for positions 4+
  - Add transition-colors for smooth hover effect



  - _Requirements: 3.2, 12.1, 12.4_



- [ ] 6.3 Implement badges integration and navigation
  - Conditionally render BadgesPremiacaoDeputado when showBadges is true and deputado has premiações
  - Position badges in top-right corner with absolute positioning
  - Wrap entire item in clickable div that calls onDeputadoClick(deputado.id)
  - Use Next.js Link for client-side navigation to /gastos/perfil/:id
  - Add cursor-pointer class to indicate clickability

  - _Requirements: 3.3, 11.1, 15.1, 15.2, 15.3_

- [ ] 6.4 Implement empty state
  - Check if deputados array is empty
  - Render centered message "Nenhum registro disponível para esta combinação de filtros"
  - Apply text-sm text-muted-foreground py-12 styling
  - _Requirements: 3.6, 13.4_


- [ ] 7. Create RankingsFiltrados component

- [ ] 7.1 Implement component structure and pagination
  - Create packages/monitor-despesas-next/src/components/premiacoes/RankingsFiltrados.tsx
  - Define RankingsFiltradosProps interface
  - Implement Card with CardHeader showing dynamic titulo

  - Add CardDescription showing "Exibindo X de Y deputados"
  - Implement useState for deputadosExibidos (initial: 50)
  - Slice ranking array to show only first deputadosExibidos items
  - _Requirements: 2.4, 7.6_

- [ ] 7.2 Integrate UnifiedRankingDisplay
  - Render UnifiedRankingDisplay inside CardContent
  - Pass sliced ranking array as deputados prop
  - Pass premiacoes prop for badges integration
  - Pass onDeputadoClick handler for navigation
  - Set showBadges to true
  - _Requirements: 2.4, 3.2, 11.1_

- [ ] 7.3 Implement "Ver mais" button
  - Conditionally render Button when deputadosExibidos < ranking.length
  - Show text "Ver mais +50 deputados (X restantes)"
  - Center button with flex justify-center
  - On click, increment deputadosExibidos by 50 (max: ranking.length)
  - Apply variant="outline" size="lg"
  - _Requirements: 2.4_

- [ ] 8. Create BannerPremiacaoDeputado component

- [ ] 8.1 Implement banner structure
  - Create packages/monitor-despesas-next/src/components/premiacoes/BannerPremiacaoDeputado.tsx
  - Define BannerPremiacaoDeputadoProps interface
  - Implement Card with border-2 border-purple-200 bg-purple-50
  - Add CardHeader with title "🏆 Campeão Geral dos Gastos"
  - Add CardContent with centered layout
  - _Requirements: 2.5, 10.1, 10.4_

- [ ] 8.2 Implement campeão display
  - Render Crown icon (h-10 w-10 text-purple-600)
  - Render campeao.nomeEleitoral with text-xl font-bold text-purple-800
  - Render campeao.siglaPartido and campeao.siglaUf with text-purple-700
  - Render campeao.valorTotal formatted as currency with text-lg font-bold
  - Apply inline-flex items-center gap-3 p-4 bg-purple-100 rounded-lg wrapper
  - _Requirements: 10.2, 10.3_

- [ ] 9. Create BadgesPremiacaoDeputado component

- [ ] 9.1 Implement badge filtering and rendering
  - Create packages/monitor-despesas-next/src/components/premiacoes/BadgesPremiacaoDeputado.tsx
  - Define BadgesPremiacaoDeputadoProps interface with deputadoId, premiacoes, maxVisible (default: 3)
  - Filter premiacoes.coroas, premiacoes.trofeus, premiacoes.medalhas by deputadoId
  - Map filtered premiações to Badge components with appropriate icons (Crown/Trophy/Medal)
  - Apply colors: text-yellow-600 for coroas, text-blue-600 for troféus, text-orange-600 for medalhas
  - Render badges in horizontal layout with gap-1
  - _Requirements: 2.6, 11.1, 11.4, 11.5_

- [ ] 9.2 Implement tooltips and overflow counter
  - Wrap each Badge in Tooltip with TooltipTrigger
  - Render TooltipContent with premiação details: tipo, categoria, ano, valor
  - If total badges > maxVisible, show first maxVisible and add "+N" counter badge
  - Apply variant="secondary" to counter badge
  - _Requirements: 11.2, 11.3_

- [ ] 10. Update PremiacoesPageClient to use modular components

- [ ] 10.1 Implement page structure and header
  - Update packages/monitor-despesas-next/src/app/gastos/premiacoes/PremiacoesPageClient.tsx
  - Wrap entire page in TooltipProvider
  - Add header with title "🏆 Premiações" and description
  - Add ETL status indicator with colored dot (green/red) and text
  - Add Settings button that toggles admin panel dropdown
  - _Requirements: 6.2, 9.1, 13.5_

- [ ] 10.2 Implement admin panel dropdown
  - Create dropdown positioned absolute right-0 top-10
  - Add buttons: "Calcular Premiações", "Atualizar Rankings", "Atualizar Dados ETL", "Limpar Cache"
  - Connect buttons to handleCalcularPremiacoes, handleAtualizarRankings, handleAtualizarDados, handleLimparCache
  - Show loading text ("Calculando...", "Atualizando...") when actions in progress
  - Add status info section showing totalDeputados, totalGastos, totalPremiacoes
  - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ] 10.3 Implement loading and error alerts
  - Add Alert with blue styling when loadingDeputados is true
  - Add Alert with purple styling when processandoPremiacoes is true
  - Add Alert with orange styling when errorDeputados is not null
  - Include "Tentar Novamente" and "Processar Dados" buttons in error alert
  - _Requirements: 13.1, 13.2, 13.3_

- [ ] 10.4 Implement dashboard stats cards
  - Create grid with 4 cards (md:grid-cols-4)
  - Card 1: Total Premiações with Trophy icon
  - Card 2: Total Deputados with Star icon
  - Card 3: Total Coroas with Crown icon
  - Card 4: Total Troféus & Medalhas with Award icon
  - Display computed values from premiacoes.estatisticas
  - _Requirements: 6.3_

- [ ] 10.5 Implement main tabs structure
  - Create Tabs with TabsList containing "Rankings" and "Premiações" triggers
  - Add TrendingUp icon to Rankings tab
  - Add Trophy icon to Premiações tab
  - Show premiações counter in Premiações tab label (e.g., "Premiações (45)")
  - Set defaultValue based on data availability
  - _Requirements: 6.4_

- [ ] 10.6 Implement Rankings tab content
  - Create TabsContent for "rankings" value
  - Render ControlesFiltrosPremiacoes with filter props and handlers
  - Render RankingsFiltrados with filtered ranking, titulo, premiacoes
  - Implement handleAnoChange to call carregarRankingFiltrado
  - Implement handleCategoriaChange to call carregarRankingFiltrado
  - Implement handleUfChange to call carregarRankingFiltrado (optional)
  - _Requirements: 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 10.7 Implement Premiações tab content
  - Create TabsContent for "premiacoes" value
  - Conditionally render BannerPremiacaoDeputado when campeaoGeral exists
  - Render ExibicaoPremiacoes with premiacoes prop
  - Show loading message when premiacoes is null
  - Show "Calcular Premiações" button when no premiações and error exists
  - _Requirements: 6.5, 8.1, 10.1, 10.5_

- [ ] 11. Implement filter logic and state management
- [ ] 11.1 Implement carregarRankingFiltrado method
  - Create carregarRankingFiltrado(ano, categoria, uf) method in PremiacoesPageClient
  - Use unified-ranking-service.getRankingFiltrado() with filter params
  - Handle "todos" and "TODAS" as null filters
  - Update rankingGeral state with filtered results
  - Log filter application and results to console
  - Use useCallback to memoize method
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11.2 Implement filter change handlers
  - Implement handleAnoChange to update anoSelecionado and call carregarRankingFiltrado
  - Implement handleCategoriaChange to update categoriaSelecionada and call carregarRankingFiltrado
  - Implement handleUfChange to update ufSelecionada and call carregarRankingFiltrado
  - Reset deputadosExibidos to 50 on any filter change
  - Use useCallback to memoize handlers
  - _Requirements: 7.1, 7.2, 7.3, 7.5_

- [ ] 11.3 Implement dynamic ranking title
  - Create useMemo to compute titulo based on active filters
  - Format: "Top X Deputados • [Categoria] • [UF] • [Ano]"
  - Omit segments when filter is "TODAS" or "todos"
  - Update on any filter change
  - _Requirements: 7.6_

- [ ] 12. Implement visual fidelity adjustments
- [ ] 12.1 Verify and adjust Tailwind classes
  - Compare all component classes with backup versions
  - Ensure spacing (p-, m-, gap-) matches exactly
  - Ensure colors (bg-, text-, border-) match exactly
  - Ensure typography (text-xs, font-bold, leading-) matches exactly
  - Ensure layout (flex, grid, items-, justify-) matches exactly
  - _Requirements: 12.1, 12.5_

- [ ] 12.2 Verify and adjust icons
  - Ensure all lucide-react icons match backup (Crown, Trophy, Medal, Star, Filter, Settings, etc.)
  - Verify icon sizes (h-4 w-4, h-5 w-5, h-8 w-8, h-10 w-10)
  - Verify icon colors (text-primary, text-yellow-500, etc.)
  - _Requirements: 12.2_

- [ ] 12.3 Verify and adjust text content
  - Compare all titles, descriptions, labels, and microcopy with backup
  - Ensure emojis are included (🏆, 💾, 🔗, ⚠️, 📊, 💰)
  - Ensure button text matches ("Escolher uma categoria", "Ver mais +50 deputados", etc.)
  - _Requirements: 12.3_

- [ ] 12.4 Test responsive breakpoints
  - Test mobile view (< 640px): single column, stacked filters
  - Test tablet view (640px - 1024px): 2 columns for grids
  - Test desktop view (> 1024px): 3-4 columns for grids
  - Verify all components adapt correctly
  - _Requirements: 12.1, 12.4_

- [ ] 13. Integration testing and bug fixes
- [ ] 13.1 Test complete filter flow
  - Select different anos and verify ranking updates
  - Select different categorias and verify ranking updates
  - Combine filters and verify AND logic
  - Reset filters to "todos"/"TODAS" and verify full ranking
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 13.2 Test admin actions
  - Click "Calcular Premiações" and verify premiações recalculated
  - Click "Atualizar Rankings" and verify rankings refreshed
  - Click "Atualizar Dados ETL" and verify deputados reloaded
  - Click "Limpar Cache" and verify cache cleared and data reloaded
  - Verify loading states display during actions
  - _Requirements: 9.2, 9.3, 9.4, 9.5, 9.7_

- [ ] 13.3 Test navigation and state preservation
  - Click deputado in ranking and verify navigation to /gastos/perfil/:id
  - Use browser back button and verify return to premiações with filters preserved
  - Refresh page and verify data reloads correctly
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ] 13.4 Test error states and fallbacks
  - Simulate ETL connection error and verify fallback to localStorage
  - Simulate no data available and verify empty state messages
  - Simulate processing error and verify error alert with actions
  - Test "Tentar Novamente" button functionality
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [ ] 14. Performance optimization and final polish
- [ ] 14.1 Optimize data loading
  - Implement lazy loading for premiações tab (only load when selected)
  - Verify pagination works correctly (50 items per page)
  - Verify useMemo caches computed values correctly
  - _Requirements: 4.2, 4.3_

- [ ] 14.2 Optimize rendering performance
  - Wrap expensive components in React.memo if needed
  - Verify useCallback memoizes handlers correctly
  - Test filter changes complete in < 300ms
  - Test tab switches complete in < 100ms
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 14.3 Final visual comparison
  - Open backup page and Next.js page side-by-side
  - Compare pixel-by-pixel for each section
  - Fix any remaining visual discrepancies
  - Take screenshots for documentation
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 14.4 Accessibility audit
  - Test keyboard navigation (Tab, Enter, Escape)
  - Verify all interactive elements have focus indicators
  - Test with screen reader (NVDA/JAWS)
  - Verify color contrast ratios pass WCAG AA
  - Add missing aria-labels and aria-describedby
  - _Requirements: 12.1_

- [ ] 14.5 Final acceptance testing
  - Run through complete user flow: load page → apply filters → view premiações → click deputado
  - Verify all requirements are met
  - Verify all acceptance criteria pass
  - Document any known issues or limitations
  - Get stakeholder approval
  - _Requirements: All_
