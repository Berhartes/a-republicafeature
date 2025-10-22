import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, ExternalLink, AlertTriangle, Users, TrendingUp, MapPin, Hash } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { getCategoriaIconJSX } from '@/components/premiacoes/utils/categoria-icons'
import type { FornecedorStats } from '@/services/fornecedores-service'

interface FornecedoresGridProps {
  fornecedores: FornecedorStats[]
  loading: boolean
  carregandoMais: boolean
  temMaisItens: boolean
  onCarregarMais: () => void
}

const obterCategoriaRisco = (score: number): string => {
  if (score >= 80) return 'Crítico'
  if (score >= 60) return 'Alto'
  if (score >= 40) return 'Médio'
  return 'Baixo'
}

export function FornecedoresGrid({
  fornecedores,
  loading,
  carregandoMais,
  temMaisItens,
  onCarregarMais
}: FornecedoresGridProps) {
  const navigate = useNavigate()

  const navegarParaFornecedor = (cnpj: string) => {
    if (cnpj && cnpj !== 'N/A' && cnpj.trim()) {
      navigate({ to: `/gastos/fornecedor/${encodeURIComponent(cnpj)}` })
    }
  }

  const obterCorScore = (score: number): string => {
    const categoria = obterCategoriaRisco(score)
    switch (categoria) {
      case 'Crítico': return 'text-red-700 bg-red-100 border-red-200'
      case 'Alto': return 'text-red-600 bg-red-50 border-red-200'
      case 'Médio': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'Baixo': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const obterVariantBadgeScore = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    const categoria = obterCategoriaRisco(score)
    switch (categoria) {
      case 'Crítico':
      case 'Alto':
        return 'destructive'
      case 'Médio':
        return 'secondary'
      case 'Baixo':
        return 'default'
      default:
        return 'outline'
    }
  }

  if (loading && fornecedores.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-8 h-8 border-4 border-current border-r-transparent rounded-full animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando fornecedores...</p>
      </div>
    )
  }

  if (fornecedores.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</p>
            <p className="text-sm">
              Tente ajustar os filtros ou verificar se há dados disponíveis para o período selecionado.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Grid de Fornecedores */}
      <div className="space-y-4">
        {fornecedores.map((fornecedor, index) => {
          const categoria = obterCategoriaRisco(fornecedor.scoreSuspeicao)
          const corScore = obterCorScore(fornecedor.scoreSuspeicao)
          
          return (
            <Card key={index} className={`hover:shadow-md transition-shadow ${
              fornecedor.scoreSuspeicao >= 70 ? 'border-red-200' : 
              fornecedor.scoreSuspeicao >= 30 ? 'border-orange-200' : ''
            }`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Nome e Score */}
                    <div className="flex items-center gap-3 mb-3">
                      <Building2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg leading-tight">
                          {fornecedor.nome}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={obterVariantBadgeScore(fornecedor.scoreSuspeicao)}>
                            Score: {fornecedor.scoreSuspeicao.toFixed(1)}
                          </Badge>
                          <Badge variant="outline">
                            {categoria}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* CNPJ */}
                    <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4" />
                      <span>CNPJ: {fornecedor.cnpj || 'Não informado'}</span>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
                        <div className="text-sm font-semibold">
                          R$ {fornecedor.totalTransacionado.toLocaleString('pt-BR')}
                        </div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Hash className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                        <div className="text-sm font-semibold">
                          {fornecedor.totalTransacoes}
                        </div>
                        <div className="text-xs text-muted-foreground">Transações</div>
                      </div>
                      
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <Users className="h-4 w-4 mx-auto mb-1 text-purple-600" />
                        <div className="text-sm font-semibold">
                          {fornecedor.deputadosAtendidos.length}
                        </div>
                        <div className="text-xs text-muted-foreground">Deputados</div>
                      </div>
                      
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <TrendingUp className="h-4 w-4 mx-auto mb-1 text-orange-600" />
                        <div className="text-sm font-semibold">
                          R$ {fornecedor.totalTransacoes > 0 
                            ? (fornecedor.totalTransacionado / fornecedor.totalTransacoes).toLocaleString('pt-BR')
                            : '0'
                          }
                        </div>
                        <div className="text-xs text-muted-foreground">Média</div>
                      </div>
                    </div>

                    {/* Categorias */}
                    <div className="mb-3">
                      <div className="text-xs text-muted-foreground mb-1">Categorias:</div>
                      <div className="flex flex-wrap gap-1">
                        {fornecedor.categorias.slice(0, 3).map((categoria, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <span className="mr-1">{getCategoriaIconJSX(categoria)}</span>
                            {categoria.length > 25 ? categoria.substring(0, 25) + '...' : categoria}
                          </Badge>
                        ))}
                        {fornecedor.categorias.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{fornecedor.categorias.length - 3} mais
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Deputados Atendidos */}
                    {fornecedor.deputadosAtendidos.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs text-muted-foreground mb-1">Deputados atendidos:</div>
                        <div className="flex flex-wrap gap-1">
                          {fornecedor.deputadosAtendidos.slice(0, 3).map((deputado, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {deputado}
                            </Badge>
                          ))}
                          {fornecedor.deputadosAtendidos.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{fornecedor.deputadosAtendidos.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alertas de Score Alto */}
                    {fornecedor.scoreSuspeicao >= 50 && (
                      <div className={`p-2 rounded border ${corScore} text-xs`}>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span className="font-medium">
                            Fornecedor com score {categoria.toLowerCase()} - requer análise
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Ações */}
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold mb-2 text-right">
                      R$ {fornecedor.totalTransacionado.toLocaleString('pt-BR')}
                    </div>
                    
                    {fornecedor.cnpj && fornecedor.cnpj !== 'N/A' && fornecedor.cnpj.trim() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navegarParaFornecedor(fornecedor.cnpj)}
                        className="text-xs"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver Perfil
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Botão Carregar Mais */}
      {temMaisItens && (
        <div className="text-center py-6">
          <Button
            variant="outline"
            onClick={onCarregarMais}
            disabled={carregandoMais}
            className="flex items-center gap-2"
          >
            {carregandoMais ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                Carregando mais...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4" />
                Carregar mais fornecedores
              </>
            )}
          </Button>
        </div>
      )}

      {/* Indicador de fim da lista */}
      {!loading && !temMaisItens && fornecedores.length > 20 && (
        <div className="text-center py-6 text-muted-foreground">
          <div className="text-sm">
            📋 Todos os fornecedores foram carregados ({fornecedores.length} total)
          </div>
        </div>
      )}
    </div>
  )
}