import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, TrendingUp, Users, AlertTriangle, Download, RefreshCw, Filter, Eye, EyeOff } from 'lucide-react'

interface FornecedoresHeaderProps {
  estatisticasGerais: any
  loading: boolean
  mostrarTodos: boolean
  isConnected: boolean
  totalFornecedores: number
  onRefresh: () => void
  onExport: () => void
  onToggleMostrarTodos: () => void
  onLimparFiltros: () => void
}

export function FornecedoresHeader({
  estatisticasGerais,
  loading,
  mostrarTodos,
  isConnected,
  totalFornecedores,
  onRefresh,
  onExport,
  onToggleMostrarTodos,
  onLimparFiltros
}: FornecedoresHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Título e Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Fornecedores
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise completa de fornecedores e prestadores de serviços
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Online" : "Offline"}
          </Badge>
          
          <Button
            variant="outline"
            onClick={onToggleMostrarTodos}
            className="flex items-center gap-2"
            disabled={loading}
          >
            {mostrarTodos ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {mostrarTodos ? 'Mostrando Todos' : 'Apenas Suspeitos'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onLimparFiltros}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Limpar Filtros
          </Button>
          
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
              <Building2 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {totalFornecedores.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Fornecedores Filtrados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {estatisticasGerais?.valorTotalTransacionado?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Total Transacionado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {estatisticasGerais?.totalTransacoes?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Total Transações</p>
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
                  R$ {estatisticasGerais?.valorMedioTransacao?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Média por Transação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          (estatisticasGerais?.fornecedoresSuspeitos || 0) > 0 ? 'border-red-200 bg-red-50' : ''
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                (estatisticasGerais?.fornecedoresSuspeitos || 0) > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div>
                <div className={`text-2xl font-bold ${
                  (estatisticasGerais?.fornecedoresSuspeitos || 0) > 0 ? 'text-red-600' : ''
                }`}>
                  {estatisticasGerais?.fornecedoresSuspeitos?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Fornecedores Suspeitos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Status */}
      {(estatisticasGerais?.fornecedoresSuspeitos || 0) > 10 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">
                  Alto número de fornecedores suspeitos detectados
                </div>
                <div className="text-sm text-orange-700">
                  {estatisticasGerais.fornecedoresSuspeitos} fornecedores com scores de suspeição elevados requerem análise detalhada.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicador de Loading */}
      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-800">
                  Atualizando dados dos fornecedores...
                </div>
                <div className="text-sm text-blue-700">
                  Carregando informações mais recentes do sistema.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}