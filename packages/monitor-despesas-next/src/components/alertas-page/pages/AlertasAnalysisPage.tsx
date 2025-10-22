import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Shield, TrendingUp, AlertTriangle, Users, DollarSign, Clock, Zap, BarChart3, Eye } from 'lucide-react'
import type { AlertasMetrics } from '../hooks/useAlertasData.js'
import { AlertaSuspeito } from '@/types/gastos'

interface AlertasAnalysisPageProps {
  metricas: AlertasMetrics
  alertasFiltrados: AlertaSuspeito[]
  dadosCombustivel: any
  loadingCombustivel: boolean
  loading: boolean
  onCarregarDadosCombustivel: () => void
  onViewProfile?: (deputadoId: string) => void
}

export function AlertasAnalysisPage({
  metricas,
  alertasFiltrados,
  dadosCombustivel,
  loadingCombustivel,
  loading,
  onCarregarDadosCombustivel,
  onViewProfile
}: AlertasAnalysisPageProps) {

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const analises = {
    tendencias: {
      tipoMaisComum: Object.entries(metricas.porTipo).sort(([,a], [,b]) => (b as number) - (a as number))[0],
      percentualAlta: metricas.total > 0 ? (metricas.alta / metricas.total * 100).toFixed(1) : '0',
      valorMedio: metricas.total > 0 ? (metricas.valorTotal / metricas.total).toFixed(0) : '0'
    },
    padroes: {
      deputadosRecorrentes: alertasFiltrados.reduce((acc: Record<string, number>, alerta) => {
        acc[alerta.deputado] = (acc[alerta.deputado] || 0) + 1
        return acc
      }, {}),
      fornecedoresSuspeitos: alertasFiltrados
        .filter(a => a.detalhes?.fornecedor)
        .reduce((acc: Record<string, number>, alerta) => {
          const fornecedor = alerta.detalhes!.fornecedor!
          acc[fornecedor] = (acc[fornecedor] || 0) + 1
          return acc
        }, {})
    }
  }

  const topDeputadosRecorrentes = Object.entries(analises.padroes.deputadosRecorrentes)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  const topFornecedoresSuspeitos = Object.entries(analises.padroes.fornecedoresSuspeitos)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Análise Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendências
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Tipo mais comum</p>
              <p className="font-semibold">
                {analises.tendencias.tipoMaisComum ? 
                  `${analises.tendencias.tipoMaisComum[0]} (${analises.tendencias.tipoMaisComum[1]} casos)` : 
                  'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">% de alta gravidade</p>
              <p className="font-semibold text-red-600">{analises.tendencias.percentualAlta}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor médio por alerta</p>
              <p className="font-semibold">R$ {Number(analises.tendencias.valorMedio).toLocaleString('pt-BR')}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Impacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Deputados envolvidos</p>
              <p className="font-semibold">{metricas.deputadosUnicos}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor total em risco</p>
              <p className="font-semibold text-red-600">
                R$ {(metricas.valorTotal / 1000000).toFixed(1)}M
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas críticos</p>
              <p className="font-semibold text-red-600">{metricas.alta} casos</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Monitoramento</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">Ativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Última atualização</span>
              <span className="text-xs text-muted-foreground">Agora</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cobertura</span>
              <span className="text-xs font-medium">100%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise de Padrões */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deputados com Mais Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Deputados com Mais Alertas
            </CardTitle>
            <CardDescription>
              Deputados que aparecem com mais frequência nos alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topDeputadosRecorrentes.length > 0 ? topDeputadosRecorrentes.map(([deputado, count], index) => (
                <div key={deputado} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-red-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{deputado}</div>
                      <div className="text-xs text-muted-foreground">{count} alertas</div>
                    </div>
                  </div>
                  {onViewProfile && (
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">Nenhum padrão identificado</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Fornecedores Suspeitos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Fornecedores Mais Citados
            </CardTitle>
            <CardDescription>
              Fornecedores que aparecem em múltiplos alertas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFornecedoresSuspeitos.length > 0 ? topFornecedoresSuspeitos.map(([fornecedor, count], index) => (
                <div key={fornecedor} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{fornecedor}</div>
                      <div className="text-xs text-muted-foreground">{count} alertas</div>
                    </div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">Nenhum fornecedor identificado</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Análise Específica de Combustível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-lg">⛽</span>
            Análise Específica - Combustível
          </CardTitle>
          <CardDescription>
            Análise detalhada dos alertas relacionados a combustível
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!dadosCombustivel ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Carregue dados específicos da categoria combustível para análise detalhada
              </p>
              <Button 
                onClick={onCarregarDadosCombustivel}
                disabled={loadingCombustivel}
                className="flex items-center gap-2"
              >
                {loadingCombustivel ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Carregando...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4" />
                    Carregar Análise de Combustível
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{metricas.combustivel.extremo}</div>
                <div className="text-sm text-red-500">Risco Extremo</div>
                <div className="text-xs text-muted-foreground mt-1">Requer ação imediata</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{metricas.combustivel.alto}</div>
                <div className="text-sm text-orange-500">Risco Alto</div>
                <div className="text-xs text-muted-foreground mt-1">Monitoramento intensivo</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {(metricas.combustivel.valorTotal / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-blue-500">Valor Total</div>
                <div className="text-xs text-muted-foreground mt-1">Em irregularidades</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recomendações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metricas.alta > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="font-medium text-red-800">Ação Imediata Necessária</p>
                  <p className="text-sm text-red-600">
                    {metricas.alta} alertas de alta gravidade requerem investigação prioritária.
                  </p>
                </div>
              </div>
            )}
            
            {metricas.deputadosUnicos > 10 && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <Users className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Monitoramento Ampliado</p>
                  <p className="text-sm text-orange-600">
                    {metricas.deputadosUnicos} deputados envolvidos - considere análise de padrões comportamentais.
                  </p>
                </div>
              </div>
            )}

            {metricas.combustivel.total > 0 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Foco em Combustível</p>
                  <p className="text-sm text-blue-600">
                    {metricas.combustivel.total} alertas de combustível identificados - categoria de alto risco.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}