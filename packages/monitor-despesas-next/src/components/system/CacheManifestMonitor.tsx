
import React, { useState, useEffect } from 'react'
import { useMonitorDespesas } from '@/hooks/useMonitorDespesas'

interface CacheManifestMonitorProps {
  className?: string
  showDetails?: boolean
  autoRefresh?: boolean
  refreshInterval?: number
}

export function CacheManifestMonitor({
  className = '',
  showDetails = false,
  autoRefresh = false,
  refreshInterval = 30000 // 30 segundos
}: CacheManifestMonitorProps) {
  const {
    isInitialized,
    isLoading,
    error,
    manifest,
    checkUpdates,
    updateToLatest,
    getCacheStats,
    clearCache,
    clearError
  } = useMonitorDespesas({ autoInitialize: true })

  const [hasUpdates, setHasUpdates] = useState(false)
  const [checkingUpdates, setCheckingUpdates] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [cacheStats, setCacheStats] = useState<any>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)


  const handleCheckUpdates = async () => {
    try {
      setCheckingUpdates(true)
      const updates = await checkUpdates()
      setHasUpdates(updates)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Erro ao verificar atualizações:', error)
    } finally {
      setCheckingUpdates(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      await updateToLatest()
      setHasUpdates(false)
      setLastCheck(new Date())

      setCacheStats(getCacheStats())
    } catch (error) {
      console.error('Erro na atualização:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await clearCache()
      setCacheStats(getCacheStats())
    } catch (error) {
      console.error('Erro ao limpar cache:', error)
    }
  }


  useEffect(() => {
    if (isInitialized) {
      setCacheStats(getCacheStats())
    }
  }, [isInitialized, getCacheStats])

  useEffect(() => {
    if (!autoRefresh || !isInitialized) return

    const interval = setInterval(() => {
      handleCheckUpdates()
      setCacheStats(getCacheStats())
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, isInitialized])


  if (!isInitialized) {
    return (
      <div className={`p-4 border rounded-lg ${className}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-gray-600">Inicializando sistema de dados...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-4 border rounded-lg space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Monitor de Cache - MonitorDespesas</h3>

        <div className="flex items-center gap-2">
          {/* Status */}
          <div className={`px-2 py-1 text-xs rounded-full ${
            error ? 'bg-red-100 text-red-800' :
            hasUpdates ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {error ? 'Erro' : hasUpdates ? 'Atualização Disponível' : 'Atualizado'}
          </div>

          {/* Botões de controle */}
          <button
            onClick={handleCheckUpdates}
            disabled={checkingUpdates || isLoading}
            className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {checkingUpdates ? 'Verificando...' : 'Verificar'}
          </button>

          {hasUpdates && (
            <button
              onClick={handleUpdate}
              disabled={updating || isLoading}
              className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              {updating ? 'Atualizando...' : 'Atualizar'}
            </button>
          )}

          <button
            onClick={handleClearCache}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
          >
            Limpar Cache
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Informações do Manifest */}
      {manifest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Manifest</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Versão:</span> {manifest.version}</div>
              <div><span className="font-medium">Fonte:</span> {manifest.source}</div>
              <div><span className="font-medium">Gerado em:</span> {new Date(manifest.generatedAt).toLocaleString('pt-BR')}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Estrutura</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Deputados:</span> {manifest.estrutura?.deputados?.total || 0}</div>
              <div><span className="font-medium">Fornecedores:</span> {manifest.estrutura?.fornecedores?.total || 0}</div>
              <div><span className="font-medium">Anos:</span> {manifest.estrutura?.deputados?.anos?.join(', ') || 'N/A'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Metadata</h4>
            <div className="text-sm space-y-1">
              <div><span className="font-medium">Período:</span> {manifest.metadata?.periodoAnalise || 'N/A'}</div>
              <div><span className="font-medium">Volume Total:</span> {manifest.metadata?.totalVolume?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'N/A'}</div>
              <div><span className="font-medium">Transações:</span> {manifest.metadata?.totalTransacoes?.toLocaleString('pt-BR') || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Estatísticas do Cache */}
      {cacheStats && (
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-medium text-gray-700 mb-2">Cache</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Entradas em Memória:</span>
              <div>{cacheStats.memoryEntries}</div>
            </div>
            <div>
              <span className="font-medium">IndexedDB:</span>
              <div>{cacheStats.hasIndexedDB ? '✅ Disponível' : '❌ Indisponível'}</div>
            </div>
            {cacheStats.manifest && (
              <>
                <div>
                  <span className="font-medium">Versão Cache:</span>
                  <div>{cacheStats.manifest.version}</div>
                </div>
                <div>
                  <span className="font-medium">Fonte Cache:</span>
                  <div>{cacheStats.manifest.source}</div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Informações detalhadas */}
      {showDetails && manifest?.caches && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-700">Caches Disponíveis</h4>
          <div className="max-h-48 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-2">Chave</th>
                  <th className="text-left p-2">Tamanho</th>
                  <th className="text-left p-2">Hash</th>
                  <th className="text-left p-2">Modificado</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(manifest.caches).map(([key, cache]: [string, any]) => (
                  <tr key={key} className="border-t">
                    <td className="p-2 font-mono text-xs">{key}</td>
                    <td className="p-2">{(cache.size / 1024).toFixed(1)}KB</td>
                    <td className="p-2 font-mono text-xs">{cache.hash?.substring(0, 8)}...</td>
                    <td className="p-2">{new Date(cache.lastModified).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rodapé */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <div>
          {lastCheck && `Última verificação: ${lastCheck.toLocaleTimeString('pt-BR')}`}
        </div>
        <div>
          {autoRefresh && `Auto-refresh: ${refreshInterval / 1000}s`}
        </div>
      </div>
    </div>
  )
}

export default CacheManifestMonitor