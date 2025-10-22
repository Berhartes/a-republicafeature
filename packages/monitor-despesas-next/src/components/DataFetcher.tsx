import { useCallback, useMemo, useState } from 'react'
import { Database, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Status } from '@/components/Status'
import { useGlobalData } from '@/contexts/GlobalDataContext'

interface DataFetcherProps {
  onDataFetched?: () => void
  className?: string
}

export function DataFetcher({ onDataFetched, className = '' }: DataFetcherProps) {
  const { loadDeputados, data, isLoading, error, refetch } = useGlobalData()
  const [isFetching, setIsFetching] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const deputados = data?.deputados ?? []
  const estatisticas = data?.analise?.estatisticas

  const handleFetch = useCallback(async () => {
    setIsFetching(true)
    try {
      await loadDeputados()
      setLastUpdated(new Date())
      onDataFetched?.()
    } catch (err) {
      console.error('Erro ao sincronizar dados do DataFetcher:', err)
    } finally {
      setIsFetching(false)
    }
  }, [loadDeputados, onDataFetched])

  const totalGasto = useMemo(() => {
    if (estatisticas?.totalGasto) return estatisticas.totalGasto
    return deputados.reduce((total, deputado) => total + (deputado.totalGasto ?? 0), 0)
  }, [deputados, estatisticas?.totalGasto])

  const totalTransacoes = useMemo(() => {
    return deputados.reduce((total, deputado) => total + (deputado.numTransacoes ?? deputado.gastos?.length ?? 0), 0)
  }, [deputados])

  const formattedLastUpdate = lastUpdated?.toLocaleString('pt-BR')

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Sincronização de Dados
            </CardTitle>
            <CardDescription>
              Carregue ou atualize os dados processados pelo sistema ETL para uso no dashboard
            </CardDescription>
          </div>
          {deputados.length > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Dados disponíveis
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <Status loading={isLoading || isFetching} error={error ?? undefined} onRetry={refetch} />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar os dados automaticamente. Tente novamente ou execute o ETL para gerar novos caches.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border p-4 bg-muted/40">
            <p className="text-muted-foreground">Deputados carregados</p>
            <p className="text-2xl font-semibold">{deputados.length.toLocaleString('pt-BR')}</p>
          </div>
          <div className="rounded-lg border p-4 bg-muted/40">
            <p className="text-muted-foreground">Gasto total</p>
            <p className="text-2xl font-semibold text-green-600">
              R$ {(totalGasto / 1_000_000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M
            </p>
          </div>
          <div className="rounded-lg border p-4 bg-muted/40">
            <p className="text-muted-foreground">Transações processadas</p>
            <p className="text-2xl font-semibold">{totalTransacoes.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {formattedLastUpdate && (
          <p className="text-xs text-muted-foreground">
            Última sincronização manual: {formattedLastUpdate}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>
            O componente consome os caches ETL disponíveis ou usa dados mock como fallback.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading || isFetching}
          >
            Recarregar dados
          </Button>
          <Button
            onClick={handleFetch}
            disabled={isLoading || isFetching}
            className="min-w-[180px]"
          >
            {isLoading || isFetching ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sincronizando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Carregar dados ETL
              </span>
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
