import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, AlertTriangle, Eye, DollarSign, TrendingUp, Shield, Clock, Zap, User, Calendar } from 'lucide-react'
import { AlertaSuspeito } from '@/types/gastos'
import { formatDateBR } from '@/lib/utils'

interface AlertasListPageProps {
  alertasFiltrados: AlertaSuspeito[]
  loading: boolean
  onViewProfile?: (deputadoId: string) => void
}

export function AlertasListPage({
  alertasFiltrados,
  loading,
  onViewProfile
}: AlertasListPageProps) {

  const getGravidadeColor = (gravidade: string): 'destructive' | 'default' | 'secondary' => {
    switch (gravidade) {
      case 'ALTA': return 'destructive'
      case 'MEDIA': return 'default'
      case 'BAIXA': return 'secondary'
      default: return 'default'
    }
  }

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
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-6">
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

  if (alertasFiltrados.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🚨</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Nenhum alerta encontrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Não há alertas que correspondam aos filtros aplicados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header da lista */}
      <div className="text-sm text-muted-foreground mb-4">
        Mostrando {alertasFiltrados.length} alertas
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {alertasFiltrados.map((alerta) => (
          <Card key={alerta.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    alerta.gravidade === 'ALTA' ? 'bg-red-100' :
                    alerta.gravidade === 'MEDIA' ? 'bg-yellow-100' : 'bg-blue-100'
                  }`}>
                    {getTipoIcon(alerta.tipo)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{getTipoLabel(alerta.tipo)}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <User className="h-3 w-3" />
                      {alerta.deputado}
                      {alerta.dataDeteccao && (
                        <>
                          <Calendar className="h-3 w-3 ml-2" />
                          {formatDateBR(alerta.dataDeteccao)}
                        </>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getGravidadeColor(alerta.gravidade)}>
                    {alerta.gravidade}
                  </Badge>
                  {alerta.valor && (
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        R$ {alerta.valor.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Descrição */}
                <p className="text-sm text-gray-700">
                  {alerta.descricao}
                </p>

                {/* Detalhes adicionais */}
                {alerta.detalhes && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {alerta.detalhes.fornecedor && (
                      <div>
                        <span className="font-medium text-muted-foreground">Fornecedor:</span>
                        <span className="ml-2">{alerta.detalhes.fornecedor}</span>
                      </div>
                    )}
                    {alerta.detalhes.categoria && (
                      <div>
                        <span className="font-medium text-muted-foreground">Categoria:</span>
                        <span className="ml-2">{alerta.detalhes.categoria}</span>
                      </div>
                    )}
                    {alerta.detalhes.periodo && (
                      <div>
                        <span className="font-medium text-muted-foreground">Período:</span>
                        <span className="ml-2">{alerta.detalhes.periodo}</span>
                      </div>
                    )}
                    {alerta.detalhes.frequencia && (
                      <div>
                        <span className="font-medium text-muted-foreground">Frequência:</span>
                        <span className="ml-2">{alerta.detalhes.frequencia}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <AlertTriangle className="h-4 w-4" />
                    <span>ID: {String(alerta.id)}</span>
                  </div>
                  {onViewProfile && alerta.deputadoId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewProfile(String(alerta.deputadoId))}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Ver Perfil
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resumo da página */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {alertasFiltrados.length}
              </div>
              <div className="text-sm text-muted-foreground">Total de Alertas</div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {alertasFiltrados.filter(a => a.gravidade === 'ALTA').length}
              </div>
              <div className="text-sm text-muted-foreground">Alta Gravidade</div>
            </div>
            <div>
              <div className="text-lg font-bold text-green-600">
                R$ {(alertasFiltrados.reduce((sum, a) => sum + (a.valor || 0), 0) / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-muted-foreground">Valor Total</div>
            </div>
            <div>
              <div className="text-lg font-bold text-purple-600">
                {new Set(alertasFiltrados.map(a => a.deputadoId)).size}
              </div>
              <div className="text-sm text-muted-foreground">Deputados Únicos</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}