
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { detectarInconsistencias } from '@/lib/categoria-utils'

interface AlertaCorrelacaoProps {
  dadosCategoria?: {
    total: number
    deputados: number
    transacoes: number
    fornecedores: number
    periodo: string
  }
  dadosRanking?: {
    total: number
    deputados: number
    periodo: string
  }
  categoria: string
  onRefresh?: () => void
}

export const AlertaCorrelacao: React.FC<AlertaCorrelacaoProps> = ({
  dadosCategoria,
  dadosRanking,
  categoria,
  onRefresh
}) => {
  if (!dadosCategoria || !dadosRanking) {
    return null
  }

  const { inconsistente, divergencias } = detectarInconsistencias(dadosCategoria, dadosRanking)

  if (!inconsistente) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-800">Dados Correlacionados</AlertTitle>
        <AlertDescription className="text-green-700">
          Os dados da categoria &quot;{categoria}&quot; estão consistentes entre as diferentes fontes.
        </AlertDescription>
      </Alert>
    )
  }

  const temDivergenciaAlta = divergencias.some(d => d.includes('%') && 
    parseFloat(d.match(/(\d+\.?\d*)%/)?.[1] || '0') > 10)

  return (
    <Card className={`border-2 ${temDivergenciaAlta ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className={`flex items-center gap-2 text-sm ${temDivergenciaAlta ? 'text-red-800' : 'text-yellow-800'}`}>
          {temDivergenciaAlta ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {temDivergenciaAlta ? 'Inconsistência Crítica' : 'Divergência Detectada'}
        </CardTitle>
        <CardDescription className={temDivergenciaAlta ? 'text-red-700' : 'text-yellow-700'}>
          Encontradas diferenças entre os dados da página de categoria e rankings de premiação
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <strong>Categoria:</strong> {categoria}
        </div>
        
        {/* Mostrar divergências */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Divergências encontradas:</div>
          {divergencias.map((divergencia, index) => (
            <div key={index} className="flex items-start gap-2">
              <Badge variant="outline" className="text-xs mt-0.5">
                {index + 1}
              </Badge>
              <span className="text-sm">{divergencia}</span>
            </div>
          ))}
        </div>

        {/* Comparação lado a lado */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">📄 Página Categoria</div>
            <div className="text-sm">
              <div>Total: R$ {dadosCategoria.total.toLocaleString('pt-BR')}</div>
              <div>Deputados: {dadosCategoria.deputados}</div>
              <div>Período: {dadosCategoria.periodo}</div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">🏆 Rankings</div>
            <div className="text-sm">
              <div>Total: R$ {dadosRanking.total.toLocaleString('pt-BR')}</div>
              <div>Deputados: {dadosRanking.deputados}</div>
              <div>Período: {dadosRanking.periodo}</div>
            </div>
          </div>
        </div>

        {/* Ações */}
        {onRefresh && (
          <div className="flex gap-2 pt-3 border-t">
            <Button 
              onClick={onRefresh}
              size="sm" 
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Atualizar Dados
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => {
                console.log('🔍 [DEBUG] Dados detalhados da correlação:', {
                  categoria,
                  dadosCategoria,
                  dadosRanking,
                  divergencias
                })
              }}
            >
              <Info className="h-3 w-3 mr-1" />
              Debug
            </Button>
          </div>
        )}

        {/* Informações técnicas */}
        <details className="text-xs text-gray-600 pt-2 border-t">
          <summary className="cursor-pointer hover:text-gray-800">
            Informações técnicas
          </summary>
          <div className="mt-2 space-y-1">
            <div>• Tolerância de divergência: 5%</div>
            <div>• Fonte categoria: Transações em tempo real</div>
            <div>• Fonte rankings: Dados pré-calculados</div>
            <div>• Última verificação: {new Date().toLocaleTimeString()}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  )
}