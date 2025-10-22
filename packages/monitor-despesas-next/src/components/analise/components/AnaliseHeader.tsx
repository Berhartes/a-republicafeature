import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, Users, Building2, Download, RefreshCw } from 'lucide-react'
import type { AnaliseGeral } from '../hooks/useAnaliseData.js'

interface AnaliseHeaderProps {
  analiseGeral: AnaliseGeral
  loading: boolean
  isConnected: boolean
  onRefresh: () => void
  onExport: () => void
}

export function AnaliseHeader({
  analiseGeral,
  loading,
  isConnected,
  onRefresh,
  onExport
}: AnaliseHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Título e Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Análise Avançada
          </h1>
          <p className="text-muted-foreground mt-1">
            Padrões suspeitos e anomalias nos gastos parlamentares
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Online" : "Offline"}
          </Badge>
          
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={onExport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {analiseGeral.totalGastos.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Total de Gastos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {analiseGeral.deputadosAtivos.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Deputados Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {analiseGeral.fornecedoresUnicos.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {analiseGeral.totalTransacoes.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Transações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${analiseGeral.alertasSuspeitos > 0 ? 'border-red-200 bg-red-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                analiseGeral.alertasSuspeitos > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div>
                <div className={`text-2xl font-bold ${
                  analiseGeral.alertasSuspeitos > 0 ? 'text-red-600' : ''
                }`}>
                  {analiseGeral.alertasSuspeitos}
                </div>
                <p className="text-xs text-muted-foreground">Alertas Críticos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Status */}
      {analiseGeral.alertasSuspeitos > 10 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800">
                  Alto número de alertas detectados
                </div>
                <div className="text-sm text-red-700">
                  {analiseGeral.alertasSuspeitos} padrões suspeitos identificados requerem análise imediata.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}