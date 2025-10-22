import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, CheckCircle, DollarSign, BarChart3, TrendingUp, Users, Clock, Zap, Shield } from 'lucide-react'
import type { AlertasMetrics } from '../hooks/useAlertasData.js'

interface AlertasDashboardPageProps {
  metricas: AlertasMetrics
  loading: boolean
}

export function AlertasDashboardPage({
  metricas,
  loading
}: AlertasDashboardPageProps) {

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'SUPERFATURAMENTO': return <DollarSign className="h-4 w-4" />
      case 'LIMITE_EXCEDIDO': return <TrendingUp className="h-4 w-4" />
      case 'FORNECEDOR_SUSPEITO': return <Shield className="h-4 w-4" />
      case 'CONCENTRACAO_TEMPORAL': return <Clock className="h-4 w-4" />
      case 'VALOR_REPETIDO': return <Zap className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'SUPERFATURAMENTO': 'Superfaturamento',
      'LIMITE_EXCEDIDO': 'Limite Excedido',
      'FORNECEDOR_SUSPEITO': 'Fornecedor Suspeito',
      'CONCENTRACAO_TEMPORAL': 'Concentração Temporal',
      'VALOR_REPETIDO': 'Valor Repetido'
    }
    return labels[tipo] || tipo
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-800">Gravidade Alta</p>
                <p className="text-3xl font-bold text-red-900">{metricas.alta}</p>
                <p className="text-xs text-red-600">Requer ação imediata</p>
              </div>
              <div className="h-12 w-12 bg-red-200 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-800">Gravidade Média</p>
                <p className="text-3xl font-bold text-yellow-900">{metricas.media}</p>
                <p className="text-xs text-yellow-600">Monitoramento ativo</p>
              </div>
              <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-800">Gravidade Baixa</p>
                <p className="text-3xl font-bold text-blue-900">{metricas.baixa}</p>
                <p className="text-xs text-blue-600">Acompanhamento</p>
              </div>
              <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-800">Valor Total</p>
                <p className="text-2xl font-bold text-purple-900">
                  R$ {(metricas.valorTotal / 1000000).toFixed(1)}M
                </p>
                <p className="text-xs text-purple-600">Em irregularidades</p>
              </div>
              <div className="h-12 w-12 bg-purple-200 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribuição por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metricas.porTipo).map(([tipo, count]) => {
                const porcentagem = metricas.total > 0 ? (((count as number) / metricas.total) * 100).toFixed(1) : '0'
                return (
                  <div key={tipo} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTipoIcon(tipo)}
                        <span className="text-sm font-medium">{getTipoLabel(tipo)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold">{count as number}</span>
                        <span className="text-xs text-muted-foreground ml-1">({porcentagem}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${porcentagem}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Métricas Avançadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Métricas Gerais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold text-primary">{metricas.deputadosUnicos}</div>
                <div className="text-sm text-muted-foreground">Deputados com Alertas</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{metricas.alta}</div>
                  <div className="text-xs text-red-500">Alta Prioridade</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">{metricas.media}</div>
                  <div className="text-xs text-yellow-500">Média Prioridade</div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Valor Total em Irregularidades</div>
                  <div className="text-2xl font-bold text-destructive">
                    R$ {metricas.valorTotal.toLocaleString('pt-BR')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Combustível (se houver dados) */}
      {metricas.combustivel.total > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">⛽</span>
              Alertas de Combustível - Visão Geral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{metricas.combustivel.extremo}</div>
                <div className="text-sm text-red-500">Risco Extremo</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{metricas.combustivel.alto}</div>
                <div className="text-sm text-orange-500">Risco Alto</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{metricas.combustivel.moderado}</div>
                <div className="text-sm text-yellow-500">Risco Moderado</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  R$ {(metricas.combustivel.valorTotal / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-blue-500">Valor Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}