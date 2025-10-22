import { useMemo } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Status, EmptyDataPlaceholder } from '@/components/Status'
import { UnifiedRankingDisplay } from '@/components/unified/UnifiedRankingDisplay'
import { useRankingService } from '@/services/unified-ranking-service'

interface RankingProps {
  categoria?: string
  ano?: number
  tipo?: 'geral' | 'categoria'
  onDeputadoClick?: (deputadoId: string) => void
}

export function Ranking({ categoria, ano, tipo = categoria ? 'categoria' : 'geral', onDeputadoClick }: RankingProps) {
  const { ranking, loading, error, ultimaAtualizacao, refetch } = useRankingService({ tipo, ano, categoria })

  const titulo = useMemo(() => {
    if (tipo === 'categoria' && categoria) {
      return `Ranking por categoria: ${categoria}`
    }
    if (tipo === 'geral' && typeof ano === 'number') {
      return `Ranking geral ${ano}`
    }
    return 'Ranking Geral'
  }, [categoria, tipo, ano])

  const descricao = useMemo(() => {
    if (tipo === 'categoria' && categoria) {
      return 'Comparativo de gastos por categoria específica com base nos dados processados pelo ETL'
    }
    if (tipo === 'geral' && typeof ano === 'number') {
      return 'Ranking consolidado para o ano selecionado'
    }
    return 'Ranking consolidado de deputados utilizando os dados mais recentes do ETL'
  }, [categoria, tipo, ano])

  const handleDeputadoClick = (deputado: { id: string }) => {
    onDeputadoClick?.(deputado.id)
  }

  return (
    <Card className="w-full">
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{titulo}</CardTitle>
            <CardDescription>
              {descricao}
              {ultimaAtualizacao && (
                <span className="block text-xs text-muted-foreground mt-1">
                  Última atualização: {ultimaAtualizacao.toLocaleString('pt-BR')}
                </span>
              )}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        <Status loading={loading} error={error} onRetry={refetch} />
      </CardHeader>

      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar o ranking automaticamente. Verifique se o ETL foi executado ou tente novamente.
            </AlertDescription>
          </Alert>
        )}

        {!loading && !error && ranking.length === 0 && (
          <EmptyDataPlaceholder
            title="Ranking não disponível"
            description="Nenhum dado de ranking foi encontrado para os filtros selecionados."
          />
        )}

        <UnifiedRankingDisplay
          ranking={ranking}
          loading={loading}
          categoria={tipo === 'categoria' ? categoria : undefined}
          ano={ano?.toString()}
          onDeputadoClick={deputado => handleDeputadoClick({ id: deputado.id })}
        />
      </CardContent>
    </Card>
  )
}
