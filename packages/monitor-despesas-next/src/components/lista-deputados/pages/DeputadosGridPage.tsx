import { Button } from '@/components/ui/button'
import { DeputadoCard } from '@/components/DeputadoCard'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import type { DeputadoProcessado } from '@/types/etl-deputados.types'

interface DeputadosGridPageProps {
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

export function DeputadosGridPage({
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
}: DeputadosGridPageProps) {

  console.log('🔍 [DeputadosGridPage] deputadosPaginados:', deputadosPaginados?.length || 0)
  console.log('🔍 [DeputadosGridPage] loading:', loading)

  const generatePageNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      const startPage = Math.max(1, currentPage - 2)
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  const pageNumbers = generatePageNumbers()

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (deputadosPaginados.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum deputado encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Tente ajustar os filtros para encontrar deputados que correspondam aos seus critérios.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Loading State */}
      {loading && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Carregando deputados...</div>
        </div>
      )}

      {/* Empty State */}
      {!loading && deputadosPaginados.length === 0 && (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Nenhum deputado encontrado.</div>
        </div>
      )}

      {/* Grid de Deputados */}
      {!loading && deputadosPaginados.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deputadosPaginados.map((deputado) => (
          <div 
            key={deputado.id}
            className="transform transition-transform duration-200 hover:scale-105"
            onClick={() => onDeputadoClick && onDeputadoClick(deputado)}
          >
            <DeputadoCard
              id={deputado.id}
              nome={deputado.nomeEleitoral}
              partido={deputado.siglaPartido}
              uf={deputado.siglaUf}
              foto={deputado.foto || deputado.urlFoto}
              totalGasto={deputado.totalGastos || deputado.totalGasto || 0}
              ranking={deputado.ranking}
              compact={false}
            />
          </div>
        ))}
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} até {Math.min(currentPage * itemsPerPage, totalFiltrados)} de {totalFiltrados} deputados
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Botão Página Anterior */}
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

            {/* Números das páginas */}
            <div className="flex items-center space-x-1">
              {/* Primeira página se não estiver visível */}
              {pageNumbers[0] > 1 && (
                <>
                  <Button
                    variant={1 === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(1)}
                  >
                    1
                  </Button>
                  {pageNumbers[0] > 2 && (
                    <span className="px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  )}
                </>
              )}

              {/* Páginas visíveis */}
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              ))}

              {/* Última página se não estiver visível */}
              {pageNumbers[pageNumbers.length - 1] < totalPages && (
                <>
                  {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                    <span className="px-2">
                      <MoreHorizontal className="h-4 w-4" />
                    </span>
                  )}
                  <Button
                    variant={totalPages === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>

            {/* Botão Próxima Página */}
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

      {/* Informações Adicionais da Página */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {deputadosPaginados.length}
          </div>
          <div className="text-sm text-blue-700">Deputados nesta página</div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            R$ {deputadosPaginados.reduce((acc, d) => acc + d.totalGasto, 0).toLocaleString('pt-BR')}
          </div>
          <div className="text-sm text-green-700">Total de gastos na página</div>
        </div>
        
        <div className="p-4 bg-orange-50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {deputadosPaginados.filter(d => d.hasAlertas).length}
          </div>
          <div className="text-sm text-orange-700">Deputados com alertas</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t">
        <span className="text-sm text-muted-foreground">Ir para página:</span>
        <div className="flex items-center gap-1">
          {[1, Math.ceil(totalPages / 4), Math.ceil(totalPages / 2), Math.ceil(3 * totalPages / 4), totalPages]
            .filter((page, index, arr) => page <= totalPages && arr.indexOf(page) === index)
            .map((page) => (
              <Button
                key={page}
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(page)}
                className={page === currentPage ? 'bg-blue-100' : ''}
              >
                {page}
              </Button>
            ))}
        </div>
      </div>
    </div>
  )
}