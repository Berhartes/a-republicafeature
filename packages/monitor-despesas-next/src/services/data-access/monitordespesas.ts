
import type {
  DeputadoHierarchicalData,
  DeputadoAnnualData,
  FornecedorHierarchicalData,
  FornecedorAnnualData
} from '@/types/hierarchical-data.types'


export interface MonitorDespesasManifest {
  version: string
  generatedAt: string
  source: 'etl' | 'local' | 'fallback'
  estrutura: {
    deputados: { total: number; anos: number[] }
    fornecedores: { total: number; anos: number[] }
  }
  caches: {
    [key: string]: {
      path: string
      size: number
      hash: string
      lastModified: string
    }
  }
  metadata: {
    periodoAnalise: string
    arquivoFonte: string
    totalVolume: number
    totalTransacoes: number
  }
}

export interface DataAccessOptions {
  forceRefresh?: boolean
  timeout?: number
  includeMetadata?: boolean
  cacheStrategy?: 'memory' | 'indexeddb' | 'localstorage' | 'auto'
}

export interface DataAccessResult<T> {
  data: T
  source: 'cache' | 'remote' | 'fallback'
  timestamp: string
  metadata?: any
}


class MonitorDespesasDataAccess {
  private manifest: MonitorDespesasManifest | null = null
  private memoryCache: Map<string, any> = new Map()
  private indexedDBCache: IDBDatabase | null = null
  private initialized = false

  private readonly CACHE_KEYS = {
    MANIFEST: 'monitordespesas_manifest',
    DEPUTADOS: 'monitordespesas_deputados',
    FORNECEDORES: 'monitordespesas_fornecedores',
    HIERARCHY: 'monitordespesas_hierarchy'
  }

  private readonly DEFAULT_MANIFEST_URL = '/cache/monitordespesas-manifest.json'
  private readonly DEFAULT_TIMEOUT = 10000


  async initialize(): Promise<void> {
    if (this.initialized) return

    console.log('🚀 [MonitorDespesasDataAccess] Inicializando sistema...')

    try {
      await this.initializeIndexedDB()

      await this.loadManifest()

      this.initialized = true
      console.log('✅ [MonitorDespesasDataAccess] Sistema inicializado com sucesso')
    } catch (error) {
      console.error('❌ [MonitorDespesasDataAccess] Erro na inicialização:', error)
      this.initialized = true
    }
  }

  private async initializeIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      const request = indexedDB.open('MonitorDespesasCache', 1)

      request.onerror = () => {
        console.warn('[MonitorDespesasDataAccess] IndexedDB não disponível, usando localStorage')
        resolve()
      }

      request.onsuccess = () => {
        this.indexedDBCache = request.result
        console.log('✅ [MonitorDespesasDataAccess] IndexedDB inicializado')
        resolve()
      }

      request.onupgradeneeded = () => {
        const db = request.result

        if (!db.objectStoreNames.contains('hierarchy')) {
          db.createObjectStore('hierarchy', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('caches')) {
          db.createObjectStore('caches', { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains('manifest')) {
          db.createObjectStore('manifest', { keyPath: 'version' })
        }
      }
    })
  }

  private async loadManifest(options: DataAccessOptions = {}): Promise<void> {
    try {
      if (!options.forceRefresh) {
        const cachedManifest = await this.getCachedData<MonitorDespesasManifest>(this.CACHE_KEYS.MANIFEST)
        if (cachedManifest) {
          this.manifest = cachedManifest
          console.log('⚡ [MonitorDespesasDataAccess] Manifest carregado do cache')
          return
        }
      }

      console.log('🌐 [MonitorDespesasDataAccess] Carregando manifest remoto...')

      const response = await fetch(this.DEFAULT_MANIFEST_URL, {
        signal: AbortSignal.timeout(options.timeout || this.DEFAULT_TIMEOUT)
      })

      if (response.ok) {
        const manifest = await response.json() as MonitorDespesasManifest
        this.manifest = manifest

        await this.setCachedData(this.CACHE_KEYS.MANIFEST, manifest)

        console.log('✅ [MonitorDespesasDataAccess] Manifest remoto carregado')
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

    } catch (error) {
      console.warn('[MonitorDespesasDataAccess] Falha ao carregar manifest remoto:', error)

      this.manifest = this.createFallbackManifest()
      console.log('🔄 [MonitorDespesasDataAccess] Usando manifest fallback')
    }
  }

  private createFallbackManifest(): MonitorDespesasManifest {
    return {
      version: `fallback-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      source: 'fallback',
      estrutura: {
        deputados: { total: 0, anos: [new Date().getFullYear()] },
        fornecedores: { total: 0, anos: [new Date().getFullYear()] }
      },
      caches: {},
      metadata: {
        periodoAnalise: `${new Date().getFullYear()}`,
        arquivoFonte: 'fallback',
        totalVolume: 0,
        totalTransacoes: 0
      }
    }
  }


  async getDeputadoData(deputadoId: string, options: DataAccessOptions = {}): Promise<DataAccessResult<DeputadoHierarchicalData | null>> {
    await this.ensureInitialized()

    const cacheKey = `deputado_${deputadoId}`

    try {
      if (!options.forceRefresh) {
        const cached = await this.getCachedData<DeputadoHierarchicalData>(cacheKey)
        if (cached) {
          return {
            data: cached,
            source: 'cache',
            timestamp: new Date().toISOString(),
            metadata: { cacheHit: true }
          }
        }
      }

      const { hierarchicalDataManager } = await import('@/services/hierarchical-data-manager')
      const deputadoData = await hierarchicalDataManager.getDeputadoBasicData(deputadoId)

      if (deputadoData) {
        await this.setCachedData(cacheKey, deputadoData)

        return {
          data: deputadoData,
          source: 'remote',
          timestamp: new Date().toISOString(),
          metadata: { source: 'hierarchical-system' }
        }
      }

      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        metadata: { notFound: true }
      }

    } catch (error) {
      console.error(`[MonitorDespesasDataAccess] Erro ao buscar deputado ${deputadoId}:`, error)
      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async getDeputadoAnnualData(deputadoId: string, ano: number, options: DataAccessOptions = {}): Promise<DataAccessResult<DeputadoAnnualData | null>> {
    await this.ensureInitialized()

    const cacheKey = `deputado_${deputadoId}_${ano}`

    try {
      if (!options.forceRefresh) {
        const cached = await this.getCachedData<DeputadoAnnualData>(cacheKey)
        if (cached) {
          return {
            data: cached,
            source: 'cache',
            timestamp: new Date().toISOString()
          }
        }
      }

      const { hierarchicalDataManager } = await import('@/services/hierarchical-data-manager')
      const annualData = await hierarchicalDataManager.getDeputadoAnnualData(deputadoId, ano)

      if (annualData) {
        await this.setCachedData(cacheKey, annualData)
        return {
          data: annualData,
          source: 'remote',
          timestamp: new Date().toISOString()
        }
      }

      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`[MonitorDespesasDataAccess] Erro ao buscar dados anuais do deputado ${deputadoId}/${ano}:`, error)
      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }


  async getFornecedorData(cnpjCpf: string, options: DataAccessOptions = {}): Promise<DataAccessResult<FornecedorHierarchicalData | null>> {
    await this.ensureInitialized()

    const cacheKey = `fornecedor_${cnpjCpf.replace(/[.-]/g, '')}`

    try {
      if (!options.forceRefresh) {
        const cached = await this.getCachedData<FornecedorHierarchicalData>(cacheKey)
        if (cached) {
          return {
            data: cached,
            source: 'cache',
            timestamp: new Date().toISOString()
          }
        }
      }

      const { hierarchicalDataManager } = await import('@/services/hierarchical-data-manager')
      const fornecedorData = await hierarchicalDataManager.getFornecedorBasicData(cnpjCpf)

      if (fornecedorData) {
        await this.setCachedData(cacheKey, fornecedorData)
        return {
          data: fornecedorData,
          source: 'remote',
          timestamp: new Date().toISOString()
        }
      }

      const { fornecedoresGlobalCache } = await import('@/services/fornecedores-global-cache')
      const fallbackData = fornecedoresGlobalCache.getFornecedorHierarchical(cnpjCpf)

      if (fallbackData) {
        return {
          data: fallbackData.dadosBasicos,
          source: 'fallback',
          timestamp: new Date().toISOString(),
          metadata: { source: 'global-cache' }
        }
      }

      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`[MonitorDespesasDataAccess] Erro ao buscar fornecedor ${cnpjCpf}:`, error)
      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async getFornecedorAnnualData(cnpjCpf: string, ano: number, options: DataAccessOptions = {}): Promise<DataAccessResult<FornecedorAnnualData | null>> {
    await this.ensureInitialized()

    const cacheKey = `fornecedor_${cnpjCpf.replace(/[.-]/g, '')}_${ano}`

    try {
      if (!options.forceRefresh) {
        const cached = await this.getCachedData<FornecedorAnnualData>(cacheKey)
        if (cached) {
          return {
            data: cached,
            source: 'cache',
            timestamp: new Date().toISOString()
          }
        }
      }

      const { hierarchicalDataManager } = await import('@/services/hierarchical-data-manager')
      const annualData = await hierarchicalDataManager.getFornecedorAnnualData(cnpjCpf, ano)

      if (annualData) {
        await this.setCachedData(cacheKey, annualData)
        return {
          data: annualData,
          source: 'remote',
          timestamp: new Date().toISOString()
        }
      }

      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`[MonitorDespesasDataAccess] Erro ao buscar dados anuais do fornecedor ${cnpjCpf}/${ano}:`, error)
      return {
        data: null,
        source: 'fallback',
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  async getFornecedoresPorCategoria(categoria: string, options: DataAccessOptions = {}): Promise<DataAccessResult<FornecedorHierarchicalData[]>> {
    await this.ensureInitialized()

    const cacheKey = `categoria_${categoria.replace(/[^a-zA-Z0-9]/g, '_')}`

    try {
      if (!options.forceRefresh) {
        const cached = await this.getCachedData<FornecedorHierarchicalData[]>(cacheKey)
        if (cached) {
          return {
            data: cached,
            source: 'cache',
            timestamp: new Date().toISOString()
          }
        }
      }

      const { fornecedoresGlobalCache } = await import('@/services/fornecedores-global-cache')
      const fornecedoresData = fornecedoresGlobalCache.getFornecedoresPorCategoriaComFallback(categoria)

      if (fornecedoresData && fornecedoresData.length > 0) {
        const hierarchicalData: FornecedorHierarchicalData[] = fornecedoresData.map(f => ({
          cnpjCpfFornecedor: f.cnpj || f.cnpjCpf || '',
          nomeFornecedor: f.nome,
          tipoFornecedor: 'PJ',
          cpfCnpj: 'EXCLUSIVO',
          categoriasPrincipais: f.categorias || [categoria],
          tipoDespesaPrincipal: categoria,
          totalAnos: 1,
          anosDisponiveis: [new Date().getFullYear()],
          ultimaAtualizacao: new Date().toISOString(),
          totalRecebidoTodos: f.totalTransacionado || f.totalRecebido || 0,
          numeroTotalTransacoes: f.transacoes || f.numeroTransacoes || 0,
          numeroDeputadosRelacionados: Array.isArray(f.deputadosAtendidos)
            ? f.deputadosAtendidos.length
            : typeof f.deputadosAtendidos === 'number'
              ? f.deputadosAtendidos
              : 0,
          anoMaiorRecebimento: new Date().getFullYear(),
          valorMaiorRecebimento: f.totalTransacionado || f.totalRecebido || 0,
          topDeputados: [],
          scoreSuspeicao: f.scoreSuspeicao || 0,
          alertas: [],
          lastUpdated: new Date().toISOString(),
          metadata: {
            versao: '1.0.0',
            processedAt: new Date().toISOString(),
            dataSource: 'global-cache'
          }
        }))

        await this.setCachedData(cacheKey, hierarchicalData)

        return {
          data: hierarchicalData,
          source: 'remote',
          timestamp: new Date().toISOString(),
          metadata: { source: 'global-cache', count: hierarchicalData.length }
        }
      }

      return {
        data: [],
        source: 'fallback',
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error(`[MonitorDespesasDataAccess] Erro ao buscar fornecedores da categoria ${categoria}:`, error)
      return {
        data: [],
        source: 'fallback',
        timestamp: new Date().toISOString(),
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }


  private async getCachedData<T>(key: string): Promise<T | null> {
    try {
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key)
      }

      if (this.indexedDBCache) {
        const transaction = this.indexedDBCache.transaction(['caches'], 'readonly')
        const store = transaction.objectStore('caches')
        const request = store.get(key)

        return new Promise((resolve) => {
          request.onsuccess = () => {
            const result = request.result
            if (result && result.data) {
              this.memoryCache.set(key, result.data)
              resolve(result.data)
            } else {
              resolve(null)
            }
          }
          request.onerror = () => resolve(null)
        })
      }

      const stored = localStorage.getItem(`monitordespesas_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        this.memoryCache.set(key, parsed)
        return parsed
      }

      return null
    } catch (error) {
      console.warn(`[MonitorDespesasDataAccess] Erro ao ler cache ${key}:`, error)
      return null
    }
  }

  private async setCachedData(key: string, data: any): Promise<void> {
    try {
      this.memoryCache.set(key, data)

      if (this.indexedDBCache) {
        const transaction = this.indexedDBCache.transaction(['caches'], 'readwrite')
        const store = transaction.objectStore('caches')
        store.put({
          key,
          data,
          timestamp: Date.now()
        })
      }

      try {
        const serialized = JSON.stringify(data)
        if (serialized.length < 500000) { // Limite de 500KB
          localStorage.setItem(`monitordespesas_${key}`, serialized)
        }
      } catch (error) {
        console.warn(`[MonitorDespesasDataAccess] localStorage cheio, ignorando cache ${key}`)
      }

    } catch (error) {
      console.warn(`[MonitorDespesasDataAccess] Erro ao salvar cache ${key}:`, error)
    }
  }

  async clearCache(key?: string): Promise<void> {
    try {
      if (key) {
        this.memoryCache.delete(key)
        localStorage.removeItem(`monitordespesas_${key}`)

        if (this.indexedDBCache) {
          const transaction = this.indexedDBCache.transaction(['caches'], 'readwrite')
          const store = transaction.objectStore('caches')
          store.delete(key)
        }
      } else {
        this.memoryCache.clear()

        const keysToRemove: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const storageKey = localStorage.key(i)
          if (storageKey?.startsWith('monitordespesas_')) {
            keysToRemove.push(storageKey)
          }
        }
        keysToRemove.forEach(k => localStorage.removeItem(k))

        if (this.indexedDBCache) {
          const transaction = this.indexedDBCache.transaction(['caches'], 'readwrite')
          const store = transaction.objectStore('caches')
          store.clear()
        }
      }

      console.log(`🗑️ [MonitorDespesasDataAccess] Cache ${key || 'completo'} limpo`)
    } catch (error) {
      console.error('[MonitorDespesasDataAccess] Erro ao limpar cache:', error)
    }
  }


  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }
  }

  getManifest(): MonitorDespesasManifest | null {
    return this.manifest
  }

  async checkForUpdates(): Promise<boolean> {
    try {
      const response = await fetch(this.DEFAULT_MANIFEST_URL, {
        signal: AbortSignal.timeout(5000)
      })

      if (response.ok) {
        const remoteManifest = await response.json() as MonitorDespesasManifest
        return this.manifest?.version !== remoteManifest.version
      }
    } catch (error) {
      console.warn('[MonitorDespesasDataAccess] Erro ao verificar atualizações:', error)
    }

    return false
  }

  async updateToLatest(): Promise<void> {
    console.log('🔄 [MonitorDespesasDataAccess] Atualizando para versão mais recente...')

    await this.clearCache()

    await this.loadManifest({ forceRefresh: true })

    console.log('✅ [MonitorDespesasDataAccess] Atualização concluída')
  }

  getCacheStats() {
    return {
      memoryEntries: this.memoryCache.size,
      hasIndexedDB: !!this.indexedDBCache,
      manifest: this.manifest ? {
        version: this.manifest.version,
        source: this.manifest.source,
        deputados: this.manifest.estrutura.deputados.total,
        fornecedores: this.manifest.estrutura.fornecedores.total
      } : null
    }
  }
}


export const monitorDespesasDataAccess = new MonitorDespesasDataAccess()
export default monitorDespesasDataAccess
