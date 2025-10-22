import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, MapPin, Building2, TrendingUp, AlertTriangle, Crown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { DeputadoProcessado } from '../hooks/useListaDeputadosData.js'

interface DeputadosListPageProps {
  deputadosPaginados: DeputadoProcessado[]
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalFiltrados: number
  loading: boolean
  onPageChange: (page: number) => void
  onNextPage: () => void
  onPrevPage: () => void
  onDeputadoClick?: (deputado: DeputadoProcessado) => void
}

export function DeputadosListPage({
  deputadosPaginados,
  currentPage,
  totalPages,
  itemsPerPage,
  totalFiltrados,
  loading,
  onPageChange,
  onNextPage,
  onPrevPage,
  onDeputadoClick
}: DeputadosListPageProps) {

  const getRiskBadge = (score: number) => {
    if (score >= 80) return { variant: 'destructive' as const, label: 'Crítico' }
    if (score >= 60) return { variant: 'default' as const, label: 'Alto' }
    if (score >= 40) return { variant: 'secondary' as const, label: 'Médio' }
    return { variant: 'outline' as const, label: 'Baixo' }
  }

  const getCategoryBadge = (categoria: string) => {
    switch (categoria) {
      case 'critico': return { color: 'bg-red-100 text-red-800', label: 'Crítico' }
      case 'alto': return { color: 'bg-orange-100 text-orange-800', label: 'Alto' }
      case 'medio': return { color: 'bg-yellow-100 text-yellow-800', label: 'Médio' }
      default: return { color: 'bg-green-100 text-green-800', label: 'Baixo' }
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: itemsPerPage }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-24 h-8 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (deputadosPaginados.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Lista vazia
          </h3>
          <p className="text-muted-foreground mb-4">
            Nenhum deputado corresponde aos filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lista de Deputados */}
      <div className="space-y-3">
        {deputadosPaginados.map((deputado, index) => {
          const riskBadge = getRiskBadge(deputado.scoreSuspeicao)
          const categoryBadge = getCategoryBadge(deputado.categoria)
          const posicaoGlobal = ((currentPage - 1) * itemsPerPage) + index + 1

          return (
            <Card 
              key={deputado.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onDeputadoClick && onDeputadoClick(deputado)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {/* Informações principais */}
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Posição */}
                    <div className="flex-shrink-0 w-8 text-center">
                      <div className="text-lg font-bold text-muted-foreground">
                        #{posicaoGlobal}
                      </div>
                    </div>

                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
                        {deputado.urlFoto ? (
                          <img
                            src={deputado.urlFoto}
                            alt={`Foto de ${deputado.nomeEleitoral}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling!.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <User className="h-6 w-6 text-blue-600" />
                        )}
                        <div className="hidden w-full h-full bg-blue-100 rounded-full items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      </div>
                    </div>

                    {/* Dados do deputado */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {deputado.nomeEleitoral}
                        </h3>
                        {deputado.hasCoroas && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {deputado.hasAlertas && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {deputado.siglaPartido}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {deputado.siglaUf}
                        </div>
                      </div>
                    </div>

                    {/* Métricas */}
                    <div className="hidden md:flex items-center gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          R$ {deputado.totalGasto.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                        </div>
                        <div className="text-xs text-muted-foreground">Total Gasto</div>
                      </div>
                      
                      <div>
                        <div className="text-lg font-bold text-orange-600">
                          {deputado.scoreSuspeicao.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {deputado.alertas.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Alertas</div>
                      </div>
                    </div>
                  </div>

                  {/* Badges e ações */}
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={riskBadge.variant}>
                        {riskBadge.label}
                      </Badge>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${categoryBadge.color}`}>
                        {categoryBadge.label}
                      </span>
                    </div>
                    
                    <div className="md:hidden text-right">
                      <div className="text-sm font-bold text-green-600">
                        R$ {(deputado.totalGasto / 1000).toFixed(0)}k
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Score: {deputado.scoreSuspeicao.toFixed(1)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informações extras em mobile */}
                <div className="md:hidden mt-3 pt-3 border-t flex justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">
                      Score: <span className="font-medium">{deputado.scoreSuspeicao.toFixed(1)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Alertas: <span className="font-medium">{deputado.alertas.length}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {deputado.hasCoroas && <Crown className="h-4 w-4 text-yellow-500" />}
                    {deputado.hasAlertas && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages} • {totalFiltrados} deputados
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>

            {/* Páginas rápidas */}
            <div className="hidden md:flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = Math.max(1, currentPage - 2) + i
                return page <= totalPages ? (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(page)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                ) : null
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Resumo da página */}
      <Card className="bg-gray-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {deputadosPaginados.length}
              </div>
              <div className="text-sm text-muted-foreground">Deputados</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                R$ {(deputadosPaginados.reduce((acc, d) => acc + d.totalGasto, 0) / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground">Total Gastos</div>
            </div>
            <div>
              <div className="text-lg font-bold text-orange-600">
                {(deputadosPaginados.reduce((acc, d) => acc + d.scoreSuspeicao, 0) / deputadosPaginados.length).toFixed(1)}
              </div>
              <div className="text-sm text-muted-foreground">Score Médio</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {deputadosPaginados.filter(d => d.hasAlertas).length}
              </div>
              <div className="text-sm text-muted-foreground">Com Alertas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}