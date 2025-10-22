
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  monitorDespesasDataAccess,
  type DataAccessOptions,
  type DataAccessResult
} from '@/services/data-access/monitordespesas'
import type {
  DeputadoHierarchicalData,
  DeputadoAnnualData,
  FornecedorHierarchicalData,
  FornecedorAnnualData
} from '@/types/hierarchical-data.types'


export interface UseMonitorDespesasOptions {
  autoInitialize?: boolean
  enableCache?: boolean
  cacheStrategy?: 'memory' | 'indexeddb' | 'localstorage' | 'auto'
}

export interface UseMonitorDespesasReturn {
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  manifest: any | null

  getDeputado: (deputadoId: string, options?: DataAccessOptions) => Promise<DataAccessResult<DeputadoHierarchicalData | null>>
  getDeputadoAnnual: (deputadoId: string, ano: number, options?: DataAccessOptions) => Promise<DataAccessResult<DeputadoAnnualData | null>>

  getFornecedor: (cnpjCpf: string, options?: DataAccessOptions) => Promise<DataAccessResult<FornecedorHierarchicalData | null>>
  getFornecedorAnnual: (cnpjCpf: string, ano: number, options?: DataAccessOptions) => Promise<DataAccessResult<FornecedorAnnualData | null>>
  getFornecedoresPorCategoria: (categoria: string, options?: DataAccessOptions) => Promise<DataAccessResult<FornecedorHierarchicalData[]>>

  clearCache: (key?: string) => Promise<void>
  checkUpdates: () => Promise<boolean>
  updateToLatest: () => Promise<void>
  getCacheStats: () => any

  refresh: () => Promise<void>
  clearError: () => void
}

export function useMonitorDespesas(options: UseMonitorDespesasOptions = {}): UseMonitorDespesasReturn {
  const {
    autoInitialize = true,
    enableCache: _enableCache = true,
    cacheStrategy = 'auto'
  } = options

  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manifest, setManifest] = useState<any | null>(null)

  const initializationAttempted = useRef(false)


  const initialize = useCallback(async () => {
    if (initializationAttempted.current) return
    initializationAttempted.current = true

    try {
      setIsLoading(true)
      setError(null)

      console.log('🚀 [useMonitorDespesas] Inicializando sistema de dados...')

      await monitorDespesasDataAccess.initialize()

      const currentManifest = monitorDespesasDataAccess.getManifest()
      setManifest(currentManifest)
      setIsInitialized(true)

      console.log('✅ [useMonitorDespesas] Sistema inicializado:', {
        version: currentManifest?.version,
        source: currentManifest?.source
      })

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na inicialização'
      console.error('❌ [useMonitorDespesas] Erro na inicialização:', err)
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    initializationAttempted.current = false
    setIsInitialized(false)
    await initialize()
  }, [initialize])

  useEffect(() => {
    if (autoInitialize && !initializationAttempted.current) {
      initialize()
    }
  }, [autoInitialize, initialize])


  const getDeputado = useCallback(async (
    deputadoId: string,
    options: DataAccessOptions = {}
  ): Promise<DataAccessResult<DeputadoHierarchicalData | null>> => {
    try {
      setError(null)
      return await monitorDespesasDataAccess.getDeputadoData(deputadoId, {
        cacheStrategy,
        ...options
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar deputado'
      setError(errorMessage)
      throw err
    }
  }, [cacheStrategy])

  const getDeputadoAnnual = useCallback(async (
    deputadoId: string,
    ano: number,
    options: DataAccessOptions = {}
  ): Promise<DataAccessResult<DeputadoAnnualData | null>> => {
    try {
      setError(null)
      return await monitorDespesasDataAccess.getDeputadoAnnualData(deputadoId, ano, {
        cacheStrategy,
        ...options
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dados anuais do deputado'
      setError(errorMessage)
      throw err
    }
  }, [cacheStrategy])

  const getFornecedor = useCallback(async (
    cnpjCpf: string,
    options: DataAccessOptions = {}
  ): Promise<DataAccessResult<FornecedorHierarchicalData | null>> => {
    try {
      setError(null)
      return await monitorDespesasDataAccess.getFornecedorData(cnpjCpf, {
        cacheStrategy,
        ...options
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar fornecedor'
      setError(errorMessage)
      throw err
    }
  }, [cacheStrategy])

  const getFornecedorAnnual = useCallback(async (
    cnpjCpf: string,
    ano: number,
    options: DataAccessOptions = {}
  ): Promise<DataAccessResult<FornecedorAnnualData | null>> => {
    try {
      setError(null)
      return await monitorDespesasDataAccess.getFornecedorAnnualData(cnpjCpf, ano, {
        cacheStrategy,
        ...options
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar dados anuais do fornecedor'
      setError(errorMessage)
      throw err
    }
  }, [cacheStrategy])

  const getFornecedoresPorCategoria = useCallback(async (
    categoria: string,
    options: DataAccessOptions = {}
  ): Promise<DataAccessResult<FornecedorHierarchicalData[]>> => {
    try {
      setError(null)
      return await monitorDespesasDataAccess.getFornecedoresPorCategoria(categoria, {
        cacheStrategy,
        ...options
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar fornecedores por categoria'
      setError(errorMessage)
      throw err
    }
  }, [cacheStrategy])


  const clearCache = useCallback(async (key?: string) => {
    try {
      setError(null)
      await monitorDespesasDataAccess.clearCache(key)
      console.log(`🗑️ [useMonitorDespesas] Cache ${key || 'completo'} limpo`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao limpar cache'
      setError(errorMessage)
      throw err
    }
  }, [])

  const checkUpdates = useCallback(async (): Promise<boolean> => {
    try {
      setError(null)
      const hasUpdates = await monitorDespesasDataAccess.checkForUpdates()
      console.log(`🔍 [useMonitorDespesas] Verificação de atualizações: ${hasUpdates ? 'disponível' : 'não há'}`)
      return hasUpdates
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao verificar atualizações'
      setError(errorMessage)
      return false
    }
  }, [])

  const updateToLatest = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      await monitorDespesasDataAccess.updateToLatest()

      const newManifest = monitorDespesasDataAccess.getManifest()
      setManifest(newManifest)

      console.log('✅ [useMonitorDespesas] Atualização concluída:', {
        version: newManifest?.version
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na atualização'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getCacheStats = useCallback(() => {
    return monitorDespesasDataAccess.getCacheStats()
  }, [])


  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isInitialized,
    isLoading,
    error,
    manifest,

    getDeputado,
    getDeputadoAnnual,

    getFornecedor,
    getFornecedorAnnual,
    getFornecedoresPorCategoria,

    clearCache,
    checkUpdates,
    updateToLatest,
    getCacheStats,

    refresh,
    clearError
  }
}


export function useDeputado(deputadoId: string | null, options: DataAccessOptions = {}) {
  const [data, setData] = useState<DeputadoHierarchicalData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const { getDeputado } = useMonitorDespesas({ autoInitialize: true })

  const fetchData = useCallback(async () => {
    if (!deputadoId) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await getDeputado(deputadoId, options)
      setData(result.data)
      setSource(result.source)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar deputado'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [deputadoId, getDeputado, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    source,
    refetch: fetchData,
    clearError: () => setError(null)
  }
}

export function useFornecedor(cnpjCpf: string | null, options: DataAccessOptions = {}) {
  const [data, setData] = useState<FornecedorHierarchicalData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const { getFornecedor } = useMonitorDespesas({ autoInitialize: true })

  const fetchData = useCallback(async () => {
    if (!cnpjCpf) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await getFornecedor(cnpjCpf, options)
      setData(result.data)
      setSource(result.source)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar fornecedor'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [cnpjCpf, getFornecedor, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    source,
    refetch: fetchData,
    clearError: () => setError(null)
  }
}

export function useFornecedoresPorCategoria(categoria: string | null, options: DataAccessOptions = {}) {
  const [data, setData] = useState<FornecedorHierarchicalData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [source, setSource] = useState<string | null>(null)

  const { getFornecedoresPorCategoria } = useMonitorDespesas({ autoInitialize: true })

  const fetchData = useCallback(async () => {
    if (!categoria) return

    try {
      setIsLoading(true)
      setError(null)

      const result = await getFornecedoresPorCategoria(categoria, options)
      setData(result.data)
      setSource(result.source)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar fornecedores'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [categoria, getFornecedoresPorCategoria, options])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    isLoading,
    error,
    source,
    refetch: fetchData,
    clearError: () => setError(null)
  }
}

export default useMonitorDespesas