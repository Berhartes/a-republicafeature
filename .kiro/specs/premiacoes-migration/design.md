# Design Document - Migração da Página de Premiações

## Overview

Este documento detalha o design técnico para migrar a página de Premiações do backup (monitordespesas-backup) para o projeto Next.js atual (monitor-despesas-next) com 100% de fidelidade visual e funcional. A migração envolve:

1. **Portabilidade de componentes UI**: Garantir que todos os primitives (tabs, card, button, select, badge, tooltip) sejam compatíveis
2. **Estrutura modular**: Replicar a arquitetura de componentes do backup
3. **Camada de dados**: Adaptar serviços ETL e criar adaptadores para Next.js
4. **Interações**: Implementar filtros, ordenação, navegação e painel admin
5. **Fidelidade visual**: Manter classes Tailwind, ícones e layout idênticos

## Architecture

### High-Level Architecture

**Seguindo o padrão Next.js App Router do projeto:**

```
┌─────────────────────────────────────────────────────────────┐
│              page.tsx (Server Component)                     │
│  - Recebe searchParams                                       │
│  - Chama getPremiacoes() Server Action                       │
│  - Passa dados para PremiacoesPageClient                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         PremiacoesPageClient (Client Component)              │
│  - Recebe premiacoesData como props                          │
│  - Gerencia estado local (filtros, UI)                       │
│  - Usa useRouter/useSearchParams para navegação              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Controles   │ │  Exibição    │ │  Rankings    │
│   Filtros    │ │  Premiações  │ │  Filtrados   │
└──────────────┘ └──────────────┘ └──────────────┘

Server-Side (data-actions.ts):
┌─────────────────────────────────────────────────────────────┐
│              getPremiacoes() Server Action                   │
│  - Lê dados de public/cache/*.json                           │
│  - Usa utilitários puros para processar dados                │
│  - Retorna dados processados                                 │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Unified    │ │  Premiacao  │ │  Premiacoes │
│  Ranking    │ │  Unificada  │ │  Processor  │
│  Utils      │ │  Utils      │ │  Utils      │
│  (puros)    │ │  (puros)    │ │  (puros)    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Component Hierarchy

```
PremiacoesPageModular
├── TooltipProvider (wrapper)
├── Header
│   ├── Title & Description
│   ├── ETL Status Indicator
│   └── Admin Panel Button (Settings Icon)
│       └── Admin Dropdown
│           ├── Calcular Premiações
│           ├── Atualizar Rankings
│           ├── Atualizar Dados ETL
│           ├── Limpar Cache
│           └── Status Info
├── Loading/Error Alerts
├── Dashboard Stats (4 Cards)
│   ├── Total Premiações
│   ├── Total Deputados
│   ├── Total Coroas
│   └── Total Troféus & Medalhas
└── Main Tabs
    ├── Tab: Rankings
    │   ├── ControlesFiltrosPremiacoes
    │   │   ├── Filtro Ano (Select)
    │   │   ├── Filtro Categoria (Button → Grid)
    │   │   └── Filtro UF (Select)
    │   └── RankingsFiltrados
    │       └── UnifiedRankingDisplay
    │           ├── Ranking Items (List)
    │           │   ├── Position Badge
    │           │   ├── Deputado Info
    │           │   ├── BadgesPremiacaoDeputado
    │           │   └── Valor & Transações
    │           └── Ver Mais Button
    └── Tab: Premiações
        ├── BannerPremiacaoDeputado (Campeão Geral)
        └── ExibicaoPremiacoes
            ├── Sub-Tab: Coroas
            │   └── Grid de Cards (Coroas)
            ├── Sub-Tab: Troféus
            │   └── Grid de Cards (Troféus)
            └── Sub-Tab: Medalhas
                └── Grid de Cards (Medalhas)
```

## Components and Interfaces

### 1. UI Primitives (packages/monitor-despesas-next/src/components/ui/)

**Status**: Já existem no Next.js. Verificar compatibilidade e alinhar se necessário.

#### Componentes necessários:
- `tabs.tsx` - Tabs, TabsList, TabsTrigger, TabsContent
- `card.tsx` - Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `button.tsx` - Button com variantes (default, outline, ghost)
- `select.tsx` - Select, SelectTrigger, SelectValue, SelectContent, SelectItem
- `badge.tsx` - Badge com variantes (default, secondary, outline)
- `tooltip.tsx` - Tooltip, TooltipTrigger, TooltipContent, TooltipProvider
- `alert.tsx` - Alert, AlertDescription

**Decisão de Design**: Usar os primitives existentes do Next.js. Se houver divergências visuais, ajustar via props ou criar variantes específicas.

### 2. ControlesFiltrosPremiacoes Component

**Path**: `packages/monitor-despesas-next/src/components/premiacoes/ControlesFiltrosPremiacoes.tsx`

**Props Interface**:
```typescript
interface ControlesFiltrosPremiacoesProps {
  anoSelecionado: string
  categoriaSelecionada: string
  ufSelecionada?: string
  anosDisponiveis: number[]
  categoriasDisponiveis: string[]
  ufsDisponiveis?: string[]
  onAnoChange: (ano: string) => void
  onCategoriaChange: (categoria: string) => void
  onUfChange?: (uf: string) => void
  showCategoriaSelection: boolean
  onToggleCategoriaSelection: () => void
  loading?: boolean
}
```

**Responsibilities**:
- Renderizar filtros de ano, categoria e UF
- Exibir botão "Escolher uma categoria" que expande grid de categorias
- Aplicar ícones de categoria via `getCategoriaIconJSX()`
- Gerenciar estado de expansão do seletor de categorias

**Visual Design**:
- Card com título "Filtros" e ícone Filter
- Layout horizontal com selects e botão
- Grid de categorias (2-4 colunas responsivo) quando expandido
- Botões de categoria com ícone + texto truncado

### 3. ExibicaoPremiacoes Component

**Path**: `packages/monitor-despesas-next/src/components/premiacoes/ExibicaoPremiacoes.tsx`

**Props Interface**:
```typescript
interface ExibicaoPremiacoesProps {
  premiacoes: PremiacoesProcessadas
  loading?: boolean
}
```

**Responsibilities**:
- Renderizar sub-tabs para Coroas, Troféus e Medalhas
- Exibir contadores de premiações em cada tab
- Renderizar grid de cards para cada tipo de premiação
- Mostrar mensagem quando não há premiações

**Visual Design**:
- Tabs com ícones (Crown, Trophy, Medal) e contadores
- Grid responsivo (2-3 colunas)
- Cards com borda colorida (amarelo/azul/laranja)
- Cada card: ícone, título, descrição, categoria badge, valor

### 4. RankingsFiltrados Component

**Path**: `packages/monitor-despesas-next/src/components/premiacoes/RankingsFiltrados.tsx`

**Props Interface**:
```typescript
interface RankingsFiltradosProps {
  ranking: DeputadoProcessado[]
  titulo: string
  loading?: boolean
  onDeputadoClick?: (id: string) => void
  premiacoes?: PremiacoesProcessadas
}
```

**Responsibilities**:
- Renderizar lista de deputados usando UnifiedRankingDisplay
- Implementar paginação "Ver mais +50"
- Aplicar estilos de medalha para top 3
- Integrar badges de premiação

**Visual Design**:
- Card com título dinâmico baseado em filtros
- Lista de items com hover effect
- Top 3 com cores especiais (ouro/prata/bronze)
- Botão "Ver mais" centralizado

### 5. UnifiedRankingDisplay Component

**Path**: `packages/monitor-despesas-next/src/components/unified/UnifiedRankingDisplay.tsx`

**Props Interface**:
```typescript
interface UnifiedRankingDisplayProps {
  deputados: DeputadoProcessado[]
  premiacoes?: PremiacoesProcessadas
  onDeputadoClick?: (id: string) => void
  showBadges?: boolean
  maxItems?: number
}
```

**Responsibilities**:
- Renderizar cada item do ranking com layout consistente
- Exibir posição, nome, partido, UF, valor e transações
- Integrar BadgesPremiacaoDeputado quando aplicável
- Implementar navegação para perfil ao clicar

**Visual Design**:
- Flex layout: posição (badge circular) | info | valor
- Hover effect com transição suave
- Top 3 com background colorido
- Badges de premiação overlay no canto superior direito

### 6. BannerPremiacaoDeputado Component

**Path**: `packages/monitor-despesas-next/src/components/premiacoes/BannerPremiacaoDeputado.tsx`

**Props Interface**:
```typescript
interface BannerPremiacaoDeputadoProps {
  campeao: {
    nomeEleitoral: string
    siglaPartido: string
    siglaUf: string
    valorTotal: number
  }
}
```

**Responsibilities**:
- Renderizar banner hero do campeão geral
- Exibir ícone de coroa, nome, partido, UF e valor
- Aplicar estilo destacado com gradiente

**Visual Design**:
- Card com borda roxa (border-2 border-purple-200)
- Background gradiente roxo (bg-purple-50)
- Ícone Crown grande (h-10 w-10)
- Título "🏆 Campeão Geral dos Gastos"
- Layout centralizado com destaque visual

### 7. BadgesPremiacaoDeputado Component

**Path**: `packages/monitor-despesas-next/src/components/premiacoes/BadgesPremiacaoDeputado.tsx`

**Props Interface**:
```typescript
interface BadgesPremiacaoDeputadoProps {
  deputadoId: string
  premiacoes: PremiacoesProcessadas
  maxVisible?: number
}
```

**Responsibilities**:
- Filtrar premiações do deputado específico
- Renderizar badges com ícones (Crown/Trophy/Medal)
- Exibir tooltips com detalhes ao hover
- Agrupar badges e mostrar contador "+N" quando exceder maxVisible

**Visual Design**:
- Badges pequenas (h-6 w-6) com ícones coloridos
- Tooltip com título, categoria, ano e valor
- Layout horizontal com gap pequeno
- Contador "+N" em badge cinza quando necessário

## Data Models

### Core Types (já existem em etl-deputados.types.ts)

```typescript
// Deputado processado com dados agregados
interface DeputadoProcessado {
  id: string
  nomeEleitoral: string
  siglaPartido: string
  siglaUf: string
  foto: string
  totalGastos: number
  totalTransacoes: number
  gastosPorAno: Record<number, number>
  topCategorias: Array<{ categoria: string; valor: number }>
  // ... outros campos
}

// Rankings organizados
interface RankingDeputados {
  geral: DeputadoProcessado[]
  porCategoria: Record<string, DeputadoProcessado[]>
  porAno: Record<number, DeputadoProcessado[]>
  estatisticas: {
    totalDeputados: number
    totalGastos: number
    mediaGastos: number
  }
}

// Premiações processadas
interface PremiacoesProcessadas {
  coroas: PremiacaoItem[]
  trofeus: PremiacaoItem[]
  medalhas: PremiacaoItem[]
  campeaoGeral?: {
    nomeEleitoral: string
    siglaPartido: string
    siglaUf: string
    valorTotal: number
  }
  estatisticas: {
    totalCoroas: number
    totalTrofeus: number
    totalMedalhas: number
    totalPremiacoes: number
  }
}

// Item de premiação
interface PremiacaoItem {
  deputadoId: string
  titulo: string
  descricao: string
  categoria: string
  valor: number
  nomeEleitoral?: string
  siglaPartido?: string
  siglaUf?: string
  ano?: number
  posicao?: number
}
```

### Service Layer Architecture

**Seguindo o padrão do projeto, a camada de serviços é dividida em:**

#### 1. Server Actions (data-actions.ts)
Server Actions que rodam no servidor e leem dados de arquivos JSON:

```typescript
// Server Action principal para premiações
export async function getPremiacoes(filters: {
  ano?: string
  categoria?: string
  uf?: string
}): Promise<{
  rankingsFiltrados: Deputado[]
  estatisticas: { totalDeputados: number; campeao: string; maiorGasto: number }
  metadata: {
    anosDisponiveis: number[]
    categoriasDisponiveis: string[]
    ufsDisponiveis: string[]
    lastUpdate: string
    totalPremiacoes: number
  }
  premiacoes: {
    coroas: PremiacaoItem[]
    trofeus: PremiacaoItem[]
    medalhas: PremiacaoItem[]
  }
}>
```

#### 2. Utility Functions (puros, sem I/O)
Funções puras para processar dados, usadas pelos Server Actions:

```typescript
// unified-ranking-service.ts (utilitários puros)
export function getRankingGeral(deputados: DeputadoProcessado[]): DeputadoProcessado[]
export function getRankingPorAno(deputados: DeputadoProcessado[], ano: number): DeputadoProcessado[]
export function getRankingPorCategoria(deputados: DeputadoProcessado[], categoria: string): DeputadoProcessado[]
export function getRankingFiltrado(deputados: DeputadoProcessado[], filtros: FiltrosRanking): DeputadoProcessado[]
export function calcularEstatisticasRanking(ranking: DeputadoProcessado[]): EstatisticasRanking

// premiacao-unificada.ts (utilitários puros)
export function processarPremiacoes(deputados: DeputadoProcessado[], rankings: RankingDeputados): PremiacoesProcessadas
export function processarCoroas(rankings: RankingDeputados): PremiacaoItem[]
export function processarTrofeus(rankings: RankingDeputados): PremiacaoItem[]
export function processarMedalhas(rankings: RankingDeputados): PremiacaoItem[]
export function identificarCampeaoGeral(deputados: DeputadoProcessado[]): CampeaoGeral

// premiacoes-processor.ts (utilitários puros)
export function processarPremiacaoItem(deputado: DeputadoProcessado, tipo: string, contexto: ContextoPremiacoes): PremiacaoItem
export function gerarTituloPremiacoes(tipo: string, categoria?: string, ano?: number): string
export function gerarDescricaoPremiacoes(deputado: DeputadoProcessado, contexto: ContextoPremiacoes): string
export function mapCategoriaToIcon(categoria: string): string
```

**Importante**: Os utilitários NÃO fazem I/O (não leem arquivos, não fazem fetch). Eles apenas transformam dados que recebem como parâmetros.

## Data Flow

### 1. Initial Load Flow (Seguindo padrão Next.js App Router)

```
User navigates to /gastos/premiacoes?ano=2024&categoria=COMBUSTIVEIS
         ↓
page.tsx (Server Component) receives searchParams
         ↓
Calls getPremiacoes(searchParams) Server Action
         ↓
getPremiacoes() reads public/cache/deputies-cache.json
         ↓
Normalizes data using normalizeDeputado()
         ↓
Applies filters (ano, categoria, uf)
         ↓
Uses utility functions:
  - getRankingFiltrado() to compute rankings
  - processarPremiacoes() to compute awards
  - calcularEstatisticasRanking() for stats
         ↓
Returns processed data to page.tsx
         ↓
page.tsx passes data to PremiacoesPageClient
         ↓
PremiacoesPageClient renders with data
ETL Cache   localStorage
    │         │
    └────┬────┘
         ↓
carregarDeputados()
         ↓
carregarRankings()
         ↓
carregarPremiacoes()
         ↓
Update component state
         ↓
Render UI with data
```

### 2. Filter Change Flow

```
User changes filter (ano/categoria/uf)
         ↓
handleFilterChange() called
         ↓
carregarRankingFiltrado(ano, categoria, uf)
         ↓
Query rankings service with filters
         ↓
    ┌────┴────┐
    │         │
Categoria !== 'TODAS'?
    │         │
   Yes       No
    │         │
    ↓         ↓
Get ranking  Get ranking
por categoria  geral
    │         │
    └────┬────┘
         ↓
    ┌────┴────┐
    │         │
Ano !== 'todos'?
    │         │
   Yes       No
    │         │
    ↓         ↓
Filter by   Use full
specific    ranking
year
    │         │
    └────┬────┘
         ↓
setRankingGeral(filtered)
         ↓
Component re-renders with new ranking
```

### 3. Admin Action Flow

```
User clicks admin action
         ↓
    ┌────┴────┐
    │         │
Which action?
    │         │
    ├─ Calcular Premiações
    │         ↓
    │  setProcessandoPremiacoes(true)
    │         ↓
    │  carregarPremiacoes()
    │         ↓
    │  setProcessandoPremiacoes(false)
    │
    ├─ Atualizar Rankings
    │         ↓
    │  carregarRankings()
    │         ↓
    │  carregarRankingFiltrado()
    │
    ├─ Atualizar Dados ETL
    │         ↓
    │  carregarDeputados()
    │
    └─ Limpar Cache
              ↓
         limparCache()
              ↓
         localStorage.clear()
```

## Services Layer

### 1. useEtlDeputadosData Hook

**Path**: `packages/monitor-despesas-next/src/hooks/useEtlDeputadosData.ts`

**Responsibilities**:
- Orquestrar carregamento de deputados, rankings e premiações
- Gerenciar estados de loading, error e cache
- Expor métodos para atualização e limpeza de dados
- Calcular estatísticas agregadas (total deputados, gastos, médias)
- Gerenciar fallback entre ETL, localStorage e cache público

**Key Methods**:
```typescript
{
  // Data
  deputados: DeputadoProcessado[]
  rankings: RankingDeputados | null
  premiacoes: PremiacoesProcessadas | null
  
  // State
  loading: boolean
  error: string | null
  cacheStatus: EtlCacheStatus
  
  // Actions
  carregarDeputados: () => Promise<void>
  carregarRankings: () => Promise<void>
  carregarPremiacoes: () => Promise<void>
  limparCache: () => void
  
  // Computed
  totalDeputados: number
  totalGastos: number
  mediaGastos: number
  anosDisponiveis: number[]
  ufsDisponiveis: string[]
  partidosDisponiveis: string[]
  ultimaAtualizacao: Date | null
  fonteAtual: 'etl' | 'localStorage' | 'none'
}
```

**Implementation Strategy**:
- Use `useState` para gerenciar dados e estados
- Use `useEffect` para carregamento inicial
- Use `useCallback` para memoizar funções
- Implementar retry logic para falhas de carregamento
- Armazenar dados em localStorage como backup

### 2. Unified Ranking Service

**Path**: `packages/monitor-despesas-next/src/services/unified-ranking-service.ts`

**Responsibilities**:
- Normalizar rankings de diferentes fontes
- Filtrar e ordenar rankings por critérios
- Calcular estatísticas de ranking
- Buscar ranking específico por ano/categoria/UF

**Key Functions**:
```typescript
export function getRankingGeral(
  deputados: DeputadoProcessado[]
): DeputadoProcessado[]

export function getRankingPorAno(
  deputados: DeputadoProcessado[],
  ano: number
): DeputadoProcessado[]

export function getRankingPorCategoria(
  deputados: DeputadoProcessado[],
  categoria: string
): DeputadoProcessado[]

export function getRankingFiltrado(
  deputados: DeputadoProcessado[],
  filtros: FiltrosRanking
): DeputadoProcessado[]

export function calcularEstatisticasRanking(
  ranking: DeputadoProcessado[]
): { totalDeputados: number; totalGastos: number; mediaGastos: number }
```

### 3. Premiacao Unificada Service

**Path**: `packages/monitor-despesas-next/src/services/premiacao-unificada.ts`

**Responsibilities**:
- Processar deputados e gerar premiações
- Classificar premiações em coroas/troféus/medalhas
- Identificar campeão geral
- Calcular estatísticas de premiações

**Key Functions**:
```typescript
export function getPremiacoes(
  deputados: DeputadoProcessado[],
  rankings: RankingDeputados
): PremiacoesProcessadas

export function processarCoroas(
  rankings: RankingDeputados
): PremiacaoItem[]

export function processarTrofeus(
  rankings: RankingDeputados
): PremiacaoItem[]

export function processarMedalhas(
  rankings: RankingDeputados
): PremiacaoItem[]

export function identificarCampeaoGeral(
  deputados: DeputadoProcessado[]
): CampeaoGeral | null
```

### 4. Premiacoes Processor

**Path**: `packages/monitor-despesas-next/src/services/premiacoes-processor.ts`

**Responsibilities**:
- Converter dados brutos em formato de premiação
- Aplicar regras de negócio para classificação
- Gerar títulos e descrições de premiações
- Mapear categorias para ícones

**Key Functions**:
```typescript
export function processarPremiacaoItem(
  deputado: DeputadoProcessado,
  tipo: 'coroa' | 'trofeu' | 'medalha',
  contexto: { categoria?: string; ano?: number; posicao: number }
): PremiacaoItem

export function gerarTituloPremiacoes(
  tipo: string,
  categoria?: string,
  ano?: number
): string

export function gerarDescricaoPremiacoes(
  deputado: DeputadoProcessado,
  contexto: any
): string
```

### 5. ETL Cache Service (Adapter)

**Path**: `packages/monitor-despesas-next/src/services/etl-cache.service.ts`

**Responsibilities**:
- Abstrair acesso a dados ETL
- Implementar fallback para cache público e localStorage
- Gerenciar TTL e invalidação de cache
- Expor status de conexão

**Key Functions**:
```typescript
export async function fetchDeputados(): Promise<DeputadoProcessado[]>

export async function fetchRankings(): Promise<RankingDeputados>

export async function fetchPremiacoes(): Promise<PremiacoesProcessadas>

export function getCacheStatus(): EtlCacheStatus

export function clearCache(): void

export function isDataStale(lastUpdate: Date, maxAge: number): boolean
```

## Error Handling

### Error States

1. **ETL Connection Error**
   - Display: Alert laranja com mensagem "Erro ao carregar dados"
   - Actions: Botões "Tentar Novamente" e "Processar Dados"
   - Fallback: Tentar localStorage, depois cache público

2. **No Data Available**
   - Display: Mensagem "Nenhum registro disponível para esta combinação de filtros"
   - Context: Dentro de cards/tabs vazios
   - Style: Texto cinza centralizado

3. **Processing Error**
   - Display: Alert vermelho com mensagem específica
   - Actions: Botão "Recarregar Página"
   - Log: Console.error com stack trace

4. **Network Timeout**
   - Display: Alert amarelo "Carregamento lento detectado"
   - Actions: Continuar aguardando ou usar cache
   - Timeout: 30 segundos

### Error Recovery Strategy

```typescript
async function carregarComFallback<T>(
  primary: () => Promise<T>,
  fallbacks: Array<() => Promise<T>>,
  errorHandler: (error: Error) => void
): Promise<T> {
  try {
    return await primary()
  } catch (primaryError) {
    console.warn('Primary source failed:', primaryError)
    
    for (const fallback of fallbacks) {
      try {
        return await fallback()
      } catch (fallbackError) {
        console.warn('Fallback failed:', fallbackError)
      }
    }
    
    errorHandler(new Error('All sources failed'))
    throw new Error('No data source available')
  }
}
```

## Testing Strategy

### Unit Tests

1. **Services**
   - Test `unified-ranking-service` filtering logic
   - Test `premiacao-unificada` classification rules
   - Test `premiacoes-processor` title/description generation
   - Mock data: Use fixtures with known deputados

2. **Components**
   - Test `ControlesFiltrosPremiacoes` filter changes
   - Test `ExibicaoPremiacoes` tab switching
   - Test `BadgesPremiacaoDeputado` badge rendering
   - Mock props: Use minimal valid data

3. **Hook**
   - Test `useEtlDeputadosData` loading states
   - Test cache fallback logic
   - Test error handling
   - Mock services: Use jest.mock()

### Integration Tests

1. **Filter Flow**
   - User selects ano → ranking updates
   - User selects categoria → ranking updates
   - User combines filters → ranking updates correctly

2. **Admin Actions**
   - User clicks "Calcular Premiações" → premiações recalculated
   - User clicks "Limpar Cache" → cache cleared, data reloaded

3. **Navigation**
   - User clicks deputado → navigates to /gastos/perfil/:id
   - Browser back button → returns to premiações with state preserved

### Visual Regression Tests

1. **Pixel Comparison**
   - Compare screenshots of backup vs Next.js
   - Test responsive breakpoints (mobile, tablet, desktop)
   - Test hover states and transitions

2. **Accessibility**
   - Test keyboard navigation (Tab, Enter, Escape)
   - Test screen reader labels (aria-label, aria-describedby)
   - Test color contrast ratios

## Performance Considerations

### Optimization Strategies

1. **Data Loading**
   - Lazy load premiações only when tab is selected
   - Implement pagination for rankings (50 items per page)
   - Cache processed data in memory (useMemo)

2. **Rendering**
   - Virtualize long lists (react-window) if > 100 items
   - Memoize expensive components (React.memo)
   - Debounce filter changes (300ms)

3. **Bundle Size**
   - Code-split premiações page (dynamic import)
   - Tree-shake unused lucide-react icons
   - Compress images and assets

### Performance Metrics

- **Initial Load**: < 2s (LCP)
- **Filter Change**: < 300ms (interaction)
- **Tab Switch**: < 100ms (instant)
- **Bundle Size**: < 150KB (gzipped)

## Migration Path

### Phase 1: UI Primitives (Day 1 - Morning)
1. Verify existing primitives in Next.js
2. Create local copies if needed
3. Test rendering in isolation

### Phase 2: Services Layer (Day 1 - Afternoon)
1. Create `unified-ranking-service.ts`
2. Create `premiacao-unificada.ts`
3. Create `premiacoes-processor.ts`
4. Create `etl-cache.service.ts` adapter
5. Write unit tests for services

### Phase 3: Hook Implementation (Day 2 - Morning)
1. Create/adapt `useEtlDeputadosData.ts`
2. Implement loading, error, cache states
3. Test with mock data

### Phase 4: Component Migration (Day 2 - Afternoon)
1. Create `ControlesFiltrosPremiacoes.tsx`
2. Create `ExibicaoPremiacoes.tsx`
3. Create `RankingsFiltrados.tsx`
4. Create `UnifiedRankingDisplay.tsx`
5. Create `BannerPremiacaoDeputado.tsx`
6. Create `BadgesPremiacaoDeputado.tsx`

### Phase 5: Page Integration (Day 3 - Morning)
1. Update `PremiacoesPageClient.tsx`
2. Integrate all components
3. Connect to data layer
4. Test filter interactions

### Phase 6: Visual Fidelity (Day 3 - Afternoon)
1. Compare with backup pixel-by-pixel
2. Adjust Tailwind classes
3. Fix spacing and colors
4. Test responsive breakpoints

### Phase 7: Testing & Polish (Day 4)
1. Run integration tests
2. Test admin actions
3. Test error states
4. Performance audit
5. Accessibility audit
6. Final acceptance

## Acceptance Criteria

### Visual Fidelity
- [ ] Layout matches backup exactly
- [ ] Colors and spacing identical
- [ ] Icons and typography match
- [ ] Hover states and transitions work
- [ ] Responsive breakpoints aligned

### Functional Completeness
- [ ] All filters work correctly
- [ ] Tabs switch properly
- [ ] Admin actions execute
- [ ] Navigation to profiles works
- [ ] Loading states display
- [ ] Error handling works

### Data Integrity
- [ ] Rankings calculate correctly
- [ ] Premiações classify properly
- [ ] Filters combine with AND logic
- [ ] Cache fallback works
- [ ] Statistics accurate

### Performance
- [ ] Initial load < 2s
- [ ] Filter changes < 300ms
- [ ] No memory leaks
- [ ] Bundle size acceptable

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes WCAG AA
- [ ] Focus indicators visible
