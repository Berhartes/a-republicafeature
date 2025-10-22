export interface PremiacaoResumo {
  deputadoId: string
  deputadoNome: string
  partido?: string
  uf?: string
  tipo: 'geral' | 'categoria'
  categoria?: string
  ano?: number
  valor: number
  quantidadeTransacoes?: number
  posicao?: number
  dataConquista: string
}

export interface PremiacoesGlobais {
  coroas: PremiacaoResumo[]
  trofeus: PremiacaoResumo[]
  medalhas: PremiacaoResumo[]
  estatisticas: {
    totalCoroas: number
    totalTrofeus: number
    totalMedalhas: number
    totalPremiacoes: number
  }
  top10Geral: Array<{
    id: string
    nome: string
    partido?: string
    uf?: string
    valorTotal?: number
    totalGastos?: number
    totalTransacoes?: number
  }>
  top10PorCategoria: Record<string, Array<{
    id: string
    nome: string
    partido?: string
    uf?: string
    valorTotal?: number
    totalGastos?: number
    totalTransacoes?: number
  }>>
  campeaoGeral: PremiacaoResumo | null
  campeoesCategorias: PremiacaoResumo[]
  campeoesPorAno: Record<string, PremiacaoResumo[]>
  medalhasHistoricas: PremiacaoResumo[]
  medalhasPorAno: Record<string, PremiacaoResumo[]>
  ultimaAtualizacao: string
}

export interface DeputadoRankingV4 {
  id: string
  nome: string
  partido: string
  uf: string
  valorTotal: number
  totalGastos: number
  totalTransacoes: number
  posicao: number
  percentualDoTotal: number
  premiacoes: string[]
  categoria?: string
  valorCategoria?: number
  ano?: number
  metadata?: Record<string, unknown>
}

export interface ProcessedPremiacoesData {
  premiacoes: PremiacoesGlobais
  rankings: {
    geral: DeputadoRankingV4[]
    porCategoria: Record<string, DeputadoRankingV4[]>
    porAno: Record<string, DeputadoRankingV4[]>
  }
  estatisticas: {
    totalPremiacoes: number
    valorTotal: number
    totalDeputados: number
    totalCategorias: number
    valorTotalGeral: number
    deputadoComMaisGastos: { nome: string; valor: number }
    categoriaComMaisGastos: { nome: string; valor: number }
    anosDisponiveis: number[]
    totalTransacoes: number
  }
  categorias: Record<string, {
    nome: string
    total: number
    valor: number
  }>
  metadata: {
    processedAt: string
    dataVersion: string
    tempoProcessamento: number
    versao: string
    baseadoEm: 'cache-premiacoes' | 'cache-transacoes' | 'systemv4-fallback'
    totalTransacoesFonte: number
    lastUpdatedAt: string
  }
}

export interface PremiacoesCacheInfo {
  hasValidCache: boolean
  hasAcceptableCache: boolean
  hasStaleCache: boolean
  status: 'fresh' | 'valid' | 'aging' | 'expired' | 'empty'
  lastUpdated: string | null
  age: number | null
  ageLabel: string | null
  source: 'memory' | 'storage' | 'none'
}

const STORAGE_KEY = 'premiacoesGlobaisCache:v1'
const STORAGE_META_KEY = 'premiacoesGlobaisCacheMeta:v1'
const VALID_WINDOW_MS = 1000 * 60 * 5 // 5 minutos
const ACCEPTABLE_WINDOW_MS = 1000 * 60 * 20 // 20 minutos
const STALE_WINDOW_MS = 1000 * 60 * 60 // 60 minutos

function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof window.document !== 'undefined'
}

function humanizeDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

function isLocalStorageAvailable(): boolean {
  if (!isBrowserEnvironment()) return false
  try {
    const testKey = '__premiacoes_cache_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch (error) {
    console.warn('⚠️ [PremiacoesCache] LocalStorage indisponível:', error)
    return false
  }
}

class PremiacoesGlobalCache {
  private cache: ProcessedPremiacoesData | null = null
  private timestamp: number | null = null
  private source: PremiacoesCacheInfo['source'] = 'none'

  private ensureLoaded(): void {
    if (this.cache || !isLocalStorageAvailable()) {
      return
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const rawMeta = window.localStorage.getItem(STORAGE_META_KEY)

      if (raw && rawMeta) {
        const parsed = JSON.parse(raw) as ProcessedPremiacoesData
        const meta = JSON.parse(rawMeta) as { timestamp: number }

        this.cache = parsed
        this.timestamp = meta.timestamp
        this.source = 'storage'
      }
    } catch (error) {
      console.error('❌ [PremiacoesCache] Erro ao carregar do storage:', error)
      this.cache = null
      this.timestamp = null
      this.source = 'none'
    }
  }

  private getAge(): number | null {
    if (!this.timestamp) return null
    return Date.now() - this.timestamp
  }

  private getStatusFromAge(age: number | null): PremiacoesCacheInfo['status'] {
    if (age == null || !this.cache) return 'empty'
    if (age <= VALID_WINDOW_MS / 2) return 'fresh'
    if (age <= VALID_WINDOW_MS) return 'valid'
    if (age <= ACCEPTABLE_WINDOW_MS) return 'aging'
    if (age <= STALE_WINDOW_MS) return 'expired'
    return 'empty'
  }

  private persist(): void {
    if (!isLocalStorageAvailable()) return
    if (!this.cache || !this.timestamp) {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(STORAGE_META_KEY)
      return
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache))
      window.localStorage.setItem(STORAGE_META_KEY, JSON.stringify({ timestamp: this.timestamp }))
    } catch (error) {
      console.error('❌ [PremiacoesCache] Erro ao persistir cache:', error)
    }
  }

  getCache(): ProcessedPremiacoesData | null {
    this.ensureLoaded()

    if (this.hasValidCache()) {
      this.source = this.source === 'none' ? 'memory' : this.source
      return this.cache
    }

    return null
  }

  getAcceptableCache(): ProcessedPremiacoesData | null {
    this.ensureLoaded()
    const age = this.getAge()

    if (this.cache && age != null && age <= ACCEPTABLE_WINDOW_MS) {
      return this.cache
    }

    return null
  }

  getStaleCache(): ProcessedPremiacoesData | null {
    this.ensureLoaded()
    const age = this.getAge()

    if (this.cache && age != null && age <= STALE_WINDOW_MS) {
      return this.cache
    }

    return null
  }

  hasValidCache(): boolean {
    const age = this.getAge()
    return !!this.cache && age != null && age <= VALID_WINDOW_MS
  }

  hasAcceptableCache(): boolean {
    const age = this.getAge()
    return !!this.cache && age != null && age <= ACCEPTABLE_WINDOW_MS
  }

  hasStaleCache(): boolean {
    const age = this.getAge()
    return !!this.cache && age != null && age <= STALE_WINDOW_MS
  }

  setCache(data: ProcessedPremiacoesData): void {
    this.cache = data
    this.timestamp = Date.now()
    this.source = 'memory'
    this.persist()
  }

  clearCache(): void {
    this.cache = null
    this.timestamp = null
    this.source = 'none'
    if (isLocalStorageAvailable()) {
      window.localStorage.removeItem(STORAGE_KEY)
      window.localStorage.removeItem(STORAGE_META_KEY)
    }
  }

  getCacheInfo(): PremiacoesCacheInfo {
    this.ensureLoaded()
    const age = this.getAge()
    const status = this.getStatusFromAge(age)

    return {
      hasValidCache: this.hasValidCache(),
      hasAcceptableCache: this.hasAcceptableCache(),
      hasStaleCache: this.hasStaleCache(),
      status,
      lastUpdated: this.timestamp ? new Date(this.timestamp).toISOString() : null,
      age,
      ageLabel: age != null ? humanizeDuration(age) : null,
      source: this.source
    }
  }
}

export const premiacoesGlobalCache = new PremiacoesGlobalCache()
