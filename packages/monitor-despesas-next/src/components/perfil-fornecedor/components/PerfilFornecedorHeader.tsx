import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Building2, MapPin, Users, Package, TrendingUp, AlertTriangle, Clock, Download, Share2, RefreshCw, Eye, EyeOff } from 'lucide-react'
import type { FornecedorStats } from '@/services/fornecedores-service'

const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return 'N/A'
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return cnpj
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

const getRiskLevelInfo = (score: number) => {
  if (score >= 80) return { level: 'Crítico', color: 'text-red-600 bg-red-50 border-red-200', icon: '🚨' }
  if (score >= 60) return { level: 'Alto', color: 'text-orange-600 bg-orange-50 border-orange-200', icon: '⚠️' }
  if (score >= 40) return { level: 'Médio', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: '⚡' }
  return { level: 'Baixo', color: 'text-green-600 bg-green-50 border-green-200', icon: '✅' }
}

interface PerfilFornecedorHeaderProps {
  fornecedorData: FornecedorStats | null
  cnpj: string
  loading: boolean
  loadingHistorico: boolean
  anosDisponiveis: number[]
  mesesDisponiveis: { valor: string, nome: string }[]
  anoSelecionado: number
  mesSelecionado: string
  fornecedorInflacionado: boolean
  percentualInflacao: number
  onAnoChange: (ano: number) => void
  onMesChange: (mes: string) => void
  onRefresh: () => void
  onExport: () => void
  onShare: () => void
  onToggleHistorico?: () => void
  showHistorico?: boolean
}

export function PerfilFornecedorHeader({
  fornecedorData,
  cnpj,
  loading,
  loadingHistorico,
  anosDisponiveis,
  mesesDisponiveis,
  anoSelecionado,
  mesSelecionado,
  fornecedorInflacionado,
  percentualInflacao,
  onAnoChange,
  onMesChange,
  onRefresh,
  onExport,
  onShare,
  onToggleHistorico,
  showHistorico = false
}: PerfilFornecedorHeaderProps) {
  const totalTransacoes =
    fornecedorData?.totalTransacoes ??
    fornecedorData?.transacoes ??
    fornecedorData?.numeroTransacoes ??
    0

  const categoriasCount = Array.isArray(fornecedorData?.categorias) ? fornecedorData.categorias.length : 0

  const deputadosCount = (() => {
    if (!fornecedorData) return 0
    const deputados = fornecedorData.deputadosAtendidos
    if (Array.isArray(deputados)) return deputados.length
    if (typeof deputados === 'number') return deputados
    return fornecedorData.numeroDeputadosAtendidos ?? 0
  })()

  const riskInfo = getRiskLevelInfo(fornecedorData?.scoreSuspeicao || 0)

  return (
    <div className="space-y-6">
      {/* Título e Informações Básicas */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {fornecedorData?.nomeEleitoral || 'Carregando...'}
              </h1>
              <p className="text-muted-foreground">
                CNPJ: {formatCNPJ(cnpj)}
              </p>
            </div>
          </div>
          
          {/* Badges de Status */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              {categoriasCount} categorias
            </Badge>
            
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {deputadosCount} deputados
            </Badge>
            
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${riskInfo.color} font-medium`}
            >
              <span>{riskInfo.icon}</span>
              Score: {(fornecedorData?.scoreSuspeicao || 0).toFixed(1)} ({riskInfo.level})
            </Badge>
            
            {fornecedorInflacionado && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Inflacionado +{percentualInflacao.toFixed(1)}%
              </Badge>
            )}
          </div>
        </div>
        
        {/* Ações */}
        <div className="flex items-center gap-2">
          {onToggleHistorico && (
            <Button
              variant="outline"
              onClick={onToggleHistorico}
              className="flex items-center gap-2"
              disabled={loadingHistorico}
            >
              {showHistorico ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showHistorico ? 'Ocultar Histórico' : 'Ver Histórico'}
              {loadingHistorico && <RefreshCw className="h-4 w-4 animate-spin" />}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
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

      {/* Filtros Temporais */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período de Análise:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm">Ano:</label>
              <Select 
                value={anoSelecionado.toString()} 
                onValueChange={(value) => onAnoChange(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm">Mês:</label>
              <Select 
                value={mesSelecionado} 
                onValueChange={onMesChange}
                disabled={loading}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {mesesDisponiveis.map(mes => (
                    <SelectItem key={mes.valor} value={mes.valor}>
                      {mes.nomeEleitoral}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {loading && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando dados...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor Total */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="flex-1">
                <div className="text-2xl font-bold">
                  R$ {(fornecedorData?.totalTransacionado || 0).toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Valor Total Transacionado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total de Transações */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div className="flex-1">
                <div className="text-2xl font-bold">
                  {(totalTransacoes || 0).toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Total de Transações</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Média Mensal por Deputado */}
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="font-bold text-green-700 text-lg">
                R$ {(() => {
                  if (!fornecedorData) return '0';
                  const totalDeputados = deputadosCount || 1;
                  const mesesEstimados = 12;
                  const valorTotal = fornecedorData.totalTransacionado || 0;
                  const mediaMensal = totalDeputados > 0 && mesesEstimados > 0 ? 
                    valorTotal / (totalDeputados * mesesEstimados) : 0;
                  return mediaMensal.toLocaleString('pt-BR', { 
                    minimumFractionDigits: 0, 
                    maximumFractionDigits: 0 
                  });
                })()}
              </div>
              <div className="text-xs text-green-600 font-medium">Média Mensal por Deputado</div>
            </div>
          </CardContent>
        </Card>

        {/* Score de Suspeição */}
        <Card className={`${riskInfo.color.includes('red') ? 'border-red-200 bg-red-50' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                riskInfo.color.includes('red') ? 'text-red-600' : 
                riskInfo.color.includes('orange') ? 'text-orange-600' :
                riskInfo.color.includes('yellow') ? 'text-yellow-600' : 'text-green-600'
              }`} />
              <div className="flex-1">
                <div className={`text-2xl font-bold ${
                  riskInfo.color.includes('red') ? 'text-red-600' : ''
                }`}>
                  {(fornecedorData?.scoreSuspeicao || 0).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Score de Suspeição</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Progresso do Score */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Análise de Risco</span>
              <span className={`text-sm font-medium ${
                riskInfo.color.includes('red') ? 'text-red-600' : 
                riskInfo.color.includes('orange') ? 'text-orange-600' :
                riskInfo.color.includes('yellow') ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {riskInfo.level} ({(fornecedorData?.scoreSuspeicao || 0).toFixed(1)}/100)
              </span>
            </div>
            <Progress 
              value={fornecedorData?.scoreSuspeicao || 0} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Baixo Risco (0-39)</span>
              <span>Médio Risco (40-59)</span>
              <span>Alto Risco (60-79)</span>
              <span>Crítico (80-100)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alertas e Informações Adicionais */}
      {fornecedorInflacionado && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Fornecedor com Inflação de Preços</div>
                <div className="text-sm text-orange-700">
                  Os valores praticados estão {percentualInflacao.toFixed(1)}% acima da média da categoria.
                  Isso pode indicar sobrepreço ou características especiais dos serviços.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-800">Carregando dados do fornecedor...</div>
                <div className="text-sm text-blue-700">
                  Aguarde enquanto coletamos as informações mais atualizadas.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}