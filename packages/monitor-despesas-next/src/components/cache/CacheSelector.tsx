import React, { useState, useEffect } from 'react'
import { listAvailableCaches } from '@/app/gastos/actions/cache-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Clock,
  HardDrive,
  FileText,
  Download,
  AlertCircle,
  Settings
} from 'lucide-react'

export interface CacheInfo {
  name: string
  displayName: string
  size: string
  lastModified: Date
  entries: number
  description: string
  available: boolean
  etlSource?: string
  metadata?: any
}

interface CacheSelectorProps {
  onCacheSelected: (cache: CacheInfo) => void
  selectedCache?: string
  className?: string
  pageType?: 'fornecedores' | 'deputados' | 'transacoes' | 'premiacoes' | 'all'
  title?: string
}

export default function CacheSelector({
  onCacheSelected,
  selectedCache,
  className = '',
  pageType = 'all',
  title
}: CacheSelectorProps) {
  const [caches, setCaches] = useState<CacheInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const loadAvailableCaches = async () => {
    try {
      setLoading(true)
      setError(null)
      const cacheResults = await listAvailableCaches(pageType)
      setCaches(cacheResults as CacheInfo[])
      console.log('📦 Caches carregados:', (cacheResults as any[]).map(c => ({ name: c.name, available: c.available, entries: c.entries, size: c.size })))
    } catch (error) {
      console.error('❌ Erro ao carregar caches:', error)
      setError('Erro ao carregar lista de caches disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const refreshCaches = async () => {
    setRefreshing(true)
    await loadAvailableCaches()
    setRefreshing(false)
  }

  useEffect(() => {
    loadAvailableCaches()
  }, [])

  const handleCacheSelection = (cacheName: string) => {
    const cache = caches.find(c => c.name === cacheName)
    if (cache && cache.available) {
      onCacheSelected(cache)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatLastModified = (date: Date): string => {
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return 'Agora mesmo'
    if (diffMinutes < 60) return `${diffMinutes}min atrás`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h atrás`
    return `${Math.floor(diffMinutes / 1440)}d atrás`
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Carregando Caches
          </CardTitle>
          <CardDescription>
            Verificando caches disponíveis...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Erro ao Carregar Caches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={refreshCaches} className="mt-4" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  const availableCaches = caches.filter(c => c.available)
  const unavailableCaches = caches.filter(c => !c.available)

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              {title || 'Seletor de Cache'}
            </CardTitle>
            <CardDescription>
              {pageType === 'fornecedores' ? 'Escolha qual cache de fornecedores usar' :
               pageType === 'deputados' ? 'Escolha qual cache de deputados usar' :
               pageType === 'transacoes' ? 'Escolha qual cache de análises usar' :
               pageType === 'premiacoes' ? 'Escolha qual cache de rankings usar' :
               'Escolha qual cache usar para processamento'}
            </CardDescription>
          </div>
          <Button
            onClick={refreshCaches}
            variant="outline"
            size="sm"
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Seletor Dropdown */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Cache Ativo:</label>
          <Select value={selectedCache} onValueChange={handleCacheSelection}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar cache..." />
            </SelectTrigger>
            <SelectContent>
              {availableCaches.map((cache) => (
                <SelectItem key={cache.name} value={cache.name}>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{cache.displayName}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {cache.entries} itens
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Informações do Cache Selecionado */}
        {selectedCache && availableCaches.find(c => c.name === selectedCache) && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">Cache Ativo</span>
            </div>
            {(() => {
              const cache = availableCaches.find(c => c.name === selectedCache)!
              return (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Entradas:</span>
                    <span className="ml-2 font-medium">{cache.entries.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tamanho:</span>
                    <span className="ml-2 font-medium">{cache.size}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Atualizado:</span>
                    <span className="ml-2 font-medium">{formatLastModified(cache.lastModified)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Fonte:</span>
                    <span className="ml-2 font-medium">{cache.etlSource || 'Cache Local'}</span>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Lista Detalhada de Caches */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Caches Disponíveis:</h4>

          {availableCaches.map((cache) => (
            <div
              key={cache.name}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedCache === cache.name
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleCacheSelection(cache.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{cache.displayName}</span>
                  </div>
                  <Badge variant="secondary">
                    {cache.entries.toLocaleString()} itens
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <HardDrive className="h-3 w-3" />
                    {cache.size}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatLastModified(cache.lastModified)}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{cache.description}</p>
            </div>
          ))}

          {unavailableCaches.length > 0 && (
            <>
              <h4 className="text-sm font-medium text-gray-700 mt-6">Caches Indisponíveis:</h4>
              {unavailableCaches.map((cache) => (
                <div
                  key={cache.name}
                  className="p-3 border border-gray-200 rounded-lg bg-gray-50 opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-600">{cache.displayName}</span>
                      </div>
                      <Badge variant="secondary">Indisponível</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{cache.description}</p>
                </div>
              ))}
            </>
          )}
        </div>

        {availableCaches.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhum cache disponível. Execute o ETL para gerar os caches necessários.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
