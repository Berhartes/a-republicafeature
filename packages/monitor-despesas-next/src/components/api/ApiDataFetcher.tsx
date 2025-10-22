import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, Database, AlertCircle, RefreshCw } from 'lucide-react'
import { fetchManifest, fetchSuppliersCache, fetchDeputiesCache, fetchDashboardCache, fetchAnalysisCache, fetchRankingsCache } from '@/data-access/monitordespesas'
import { toast } from '@/hooks/useToast'
import { Badge } from '@/components/ui/badge'

interface ApiDataFetcherProps {
  onDataFetched?: (data: any) => void
}

export function ApiDataFetcher({ onDataFetched }: ApiDataFetcherProps) {
  const [loading, setLoading] = useState(false)
  const [cacheStatus, setCacheStatus] = useState<{
    available: boolean
    lastUpdate?: Date
    totalCaches?: number
  }>({ available: false })

  const checkCacheAvailability = async () => {
    setLoading(true)
    try {
      const manifest = await fetchManifest()
      if (manifest) {
        const [suppliersCache, deputiesCache, dashboardCache, analysisCache, rankingsCache] = await Promise.all([
          fetchSuppliersCache(manifest),
          fetchDeputiesCache(manifest),
          fetchDashboardCache(manifest),
          fetchAnalysisCache(manifest),
          fetchRankingsCache(manifest)
        ])

        const availableCaches = [suppliersCache, deputiesCache, dashboardCache, analysisCache, rankingsCache].filter(cache => cache && cache.data)
        const hasRequiredCaches = suppliersCache && suppliersCache.data && deputiesCache && deputiesCache.data && dashboardCache && dashboardCache.data

        const cacheDates = availableCaches.map(cache => new Date(cache!.fetchedAt)).filter(date => !isNaN(date.getTime()))
        const latestUpdate = cacheDates.length > 0 ? new Date(Math.max(...cacheDates.map(d => d.getTime()))) : undefined

        setCacheStatus({
          available: !!hasRequiredCaches,
          totalCaches: availableCaches.length,
          lastUpdate: latestUpdate
        })

        if (hasRequiredCaches) {
          toast({
            title: 'Caches do ETL disponíveis',
            description: `${availableCaches.length} caches encontradas e prontas para uso.`
          })
        }
      } else {
        setCacheStatus({ available: false })
      }
    } catch (error) {
      console.error('Erro ao verificar caches:', error)
      setCacheStatus({ available: false })
      toast({
        title: 'Erro na verificação',
        description: 'Não foi possível verificar a disponibilidade dos caches.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkCacheAvailability()
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Status dos Caches ETL
            </CardTitle>
            <CardDescription>
              Verifique se os dados processados pelo Sistema ETL estão disponíveis
            </CardDescription>
          </div>
          {cacheStatus.available && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Caches OK
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status dos caches */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : cacheStatus.available ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">
              {loading ? 'Verificando caches...' :
               cacheStatus.available ? 'Caches do ETL disponíveis' : 'Caches não encontrados'}
            </span>
          </div>

          {cacheStatus.available && cacheStatus.totalCaches && (
            <div className="text-xs text-muted-foreground">
              • {cacheStatus.totalCaches} caches encontradas
              {cacheStatus.lastUpdate && (
                <span> • Última atualização: {cacheStatus.lastUpdate.toLocaleDateString('pt-BR')}</span>
              )}
            </div>
          )}
        </div>

        {/* Informações sobre o ETL */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema ETL:</strong> Todos os dados são processados pelo Sistema ETL que gera caches otimizados.
            Este componente apenas verifica se os caches estão disponíveis para consumo.
          </AlertDescription>
        </Alert>

        {/* Botão de verificação */}
        <Button
          onClick={checkCacheAvailability}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Verificar Caches ETL
            </>
          )}
        </Button>

        {/* Informações sobre os caches */}
        <div className="pt-4 border-t space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Caches esperados:</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• suppliers-cache.json - Dados de fornecedores processados</li>
              <li>• deputies-cache.json - Lista completa de deputados</li>
              <li>• dashboard-cache.json - Dados para dashboard</li>
              <li>• analysis-cache.json - Análises pré-processadas</li>
              <li>• rankings-cache.json - Rankings e estatísticas</li>
            </ul>
          </div>

          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Nota:</strong> Este sistema não processa dados - apenas consome os caches gerados pelo Sistema ETL.
              Se os caches não estiverem disponíveis, execute o ETL primeiro.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}