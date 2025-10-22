import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, ExternalLink, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import type { DespesaDetalhada } from '../hooks/useDeputadoData.js'
import { DeputadoDataProcessing } from '../utils/deputadoDataProcessing.js'

interface DeputadoFornecedoresPageProps {
  despesasDetalhadas: DespesaDetalhada[]
  filtroFornecedorCategoria: string
  setFiltroFornecedorCategoria: (categoria: string) => void
  anoSelecionado: number
  mesSelecionado: string
}

export function DeputadoFornecedoresPage({
  despesasDetalhadas,
  filtroFornecedorCategoria,
  setFiltroFornecedorCategoria,
  anoSelecionado,
  mesSelecionado
}: DeputadoFornecedoresPageProps) {
  const navigate = useNavigate()

  const categoriasDisponiveis = useMemo(() => {
    const categorias = Array.from(new Set(
      despesasDetalhadas
        .map(d => d.tipoDespesa)
        .filter(Boolean)
    )).sort()
    
    return [
      { valor: 'TODAS', nome: 'Todas as Categorias' },
      ...categorias.map(cat => ({ valor: cat, nome: cat }))
    ]
  }, [despesasDetalhadas])

  const fornecedoresProcessados = useMemo(() => {
    return DeputadoDataProcessing.processarFornecedoresAgregados(
      despesasDetalhadas,
      filtroFornecedorCategoria
    )
  }, [despesasDetalhadas, filtroFornecedorCategoria])

  const estatisticasFornecedores = useMemo(() => {
    const totalFornecedores = fornecedoresProcessados.length
    const totalTransacionado = fornecedoresProcessados.reduce((acc, f) => acc + f.valor, 0)
    const mediaTransacao = fornecedoresProcessados.length > 0 
      ? totalTransacionado / fornecedoresProcessados.reduce((acc, f) => acc + f.transacoes, 0)
      : 0
    
    const concentracaoTop3 = fornecedoresProcessados.slice(0, 3).reduce((acc, f) => acc + f.valor, 0)
    const percentualTop3 = totalTransacionado > 0 ? (concentracaoTop3 / totalTransacionado) * 100 : 0
    
    return {
      totalFornecedores,
      totalTransacionado,
      mediaTransacao,
      concentracaoTop3: percentualTop3,
      fornecedoresSuspeitos: fornecedoresProcessados.filter(f => 
        f.transacoes === 1 && f.valor > 50000 // Transação única alta
      ).length
    }
  }, [fornecedoresProcessados])

  const navegarParaFornecedor = (cnpj: string) => {
    if (cnpj && cnpj !== 'N/A' && cnpj.trim()) {
      navigate({ to: `/gastos/fornecedor/${encodeURIComponent(cnpj)}` })
    }
  }

  const calcularRiscoFornecedor = (fornecedor: any): { nivel: string, cor: string, motivos: string[] } => {
    const motivos: string[] = []
    let pontuacao = 0

    if (fornecedor.transacoes === 1 && fornecedor.valor > 50000) {
      pontuacao += 30
      motivos.push('Transação única de alto valor')
    }

    if (fornecedor.transacoes > 20 && (fornecedor.valor / fornecedor.transacoes) < 1000) {
      pontuacao += 20
      motivos.push('Muitas transações de baixo valor')
    }

    if (fornecedor.valor > 200000) {
      pontuacao += 25
      motivos.push('Valor total muito elevado')
    }

    if (!fornecedor.cnpj || fornecedor.cnpj === 'N/A') {
      pontuacao += 15
      motivos.push('CNPJ não informado')
    }

    if (fornecedor.categorias.length > 3) {
      pontuacao += 10
      motivos.push('Atua em muitas categorias')
    }

    if (pontuacao >= 40) {
      return { nivel: 'Alto', cor: 'bg-red-500', motivos }
    } else if (pontuacao >= 20) {
      return { nivel: 'Médio', cor: 'bg-orange-500', motivos }
    } else {
      return { nivel: 'Baixo', cor: 'bg-green-500', motivos }
    }
  }

  return (
    <div className="space-y-6">
      {/* Controles de Filtro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Fornecedores do Deputado
          </CardTitle>
          <CardDescription>
            Análise dos fornecedores e prestadores de serviços
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Filtrar por categoria:</label>
              <Select value={filtroFornecedorCategoria} onValueChange={setFiltroFornecedorCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoriasDisponiveis.map(cat => (
                    <SelectItem key={cat.valor} value={cat.valor}>
                      {cat.nomeEleitoral}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas dos Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">{estatisticasFornecedores.totalFornecedores}</div>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {estatisticasFornecedores.totalTransacionado.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Total Transacionado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {estatisticasFornecedores.mediaTransacao.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Média por Transação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className={`h-4 w-4 ${
                estatisticasFornecedores.concentracaoTop3 > 70 ? 'text-red-600' :
                estatisticasFornecedores.concentracaoTop3 > 50 ? 'text-orange-600' :
                'text-green-600'
              }`} />
              <div>
                <div className="text-lg font-bold">
                  {estatisticasFornecedores.concentracaoTop3.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Concentração Top 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Concentração */}
      {estatisticasFornecedores.concentracaoTop3 > 70 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">
                  Alta concentração de fornecedores
                </div>
                <div className="text-sm text-orange-700">
                  Os 3 principais fornecedores representam {estatisticasFornecedores.concentracaoTop3.toFixed(1)}% dos gastos.
                  Isso pode indicar falta de diversificação ou preferências específicas.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Fornecedores</CardTitle>
          <CardDescription>
            {filtroFornecedorCategoria === 'TODAS' 
              ? 'Todos os fornecedores' 
              : `Categoria: ${filtroFornecedorCategoria}`
            } • Período: {mesSelecionado === 'todos' ? 'Ano' : 'Mês'} {mesSelecionado !== 'todos' ? mesSelecionado + '/' : ''}{anoSelecionado}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fornecedoresProcessados.length > 0 ? (
            <div className="space-y-4">
              {fornecedoresProcessados.map((fornecedor, index) => {
                const risco = calcularRiscoFornecedor(fornecedor)
                return (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{fornecedor.nomeEleitoral}</span>
                          
                          {/* Indicador de Risco */}
                          <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${risco.cor}`} />
                            <span className="text-xs text-muted-foreground">
                              Risco {risco.nivel}
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          CNPJ: {fornecedor.cnpj || 'Não informado'}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-2">
                          {fornecedor.transacoes} transação(ões) • 
                          Média: R$ {(fornecedor.valor / fornecedor.transacoes).toLocaleString('pt-BR')}
                        </div>
                        
                        {/* Categorias */}
                        <div className="flex flex-wrap gap-1 mb-2">
                          {fornecedor.categorias.slice(0, 3).map((categoria, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {categoria.length > 20 ? categoria.substring(0, 20) + '...' : categoria}
                            </Badge>
                          ))}
                          {fornecedor.categorias.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{fornecedor.categorias.length - 3} mais
                            </Badge>
                          )}
                        </div>

                        {/* Motivos de Risco */}
                        {risco.motivos.length > 0 && risco.nivel !== 'Baixo' && (
                          <div className="text-xs text-orange-700 mt-1">
                            <strong>Fatores de risco:</strong> {risco.motivos.join(', ')}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xl font-bold mb-2">
                          R$ {fornecedor.valor.toLocaleString('pt-BR')}
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
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum fornecedor encontrado para os filtros aplicados.</p>
              <p className="text-sm mt-2">
                Tente ajustar os filtros ou verificar se há dados para o período selecionado.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}