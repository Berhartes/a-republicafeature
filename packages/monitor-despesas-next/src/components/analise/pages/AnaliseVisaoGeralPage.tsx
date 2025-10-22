import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle, TrendingUp, PieChart, BarChart3 } from 'lucide-react'
import type { AnaliseGeral, PadraoSuspeito } from '../hooks/useAnaliseData.js'

interface AnaliseVisaoGeralPageProps {
  analiseGeral: AnaliseGeral
  padroesSuspeitos: PadraoSuspeito[]
}

export function AnaliseVisaoGeralPage({
  analiseGeral,
  padroesSuspeitos
}: AnaliseVisaoGeralPageProps) {
  

  const getNivelBadgeVariant = (nivel: string) => {
    switch (nivel) {
      case 'critico': return 'destructive'
      case 'alto': return 'destructive'
      case 'medio': return 'secondary'
      case 'baixo': return 'default'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo de Padrões Suspeitos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Padrões Suspeitos Identificados
          </CardTitle>
          <CardDescription>
            Análise de anomalias e comportamentos atípicos nos gastos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {padroesSuspeitos.length > 0 ? (
            <div className="space-y-4">
              {padroesSuspeitos.map((padrao, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{padrao.tipo}</h4>
                        <Badge variant={getNivelBadgeVariant(padrao.nivel)}>
                          {padrao.nivel.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {padrao.descricao}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        R$ {padrao.valor.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {padrao.ocorrencias} ocorrência(s)
                      </div>
                    </div>
                  </div>
                  
                  {padrao.deputadosEnvolvidos.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-muted-foreground mb-1">
                        Deputados envolvidos:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {padrao.deputadosEnvolvidos.map((deputado, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {deputado}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum padrão suspeito identificado</p>
              <p className="text-sm mt-2">
                O sistema não detectou anomalias significativas nos dados atuais.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categorias Mais Utilizadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Categorias Mais Utilizadas
          </CardTitle>
          <CardDescription>
            Distribuição dos gastos por categoria de despesa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analiseGeral.categoriasMaisUsadas.map((categoria, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {categoria.categoria}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      R$ {categoria.total.toLocaleString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {categoria.percentual}%
                  </div>
                </div>
                <Progress value={categoria.percentual} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas de Concentração */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Média de Gastos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Por Deputado:</span>
                <span className="font-bold">
                  R$ {analiseGeral.deputadosAtivos > 0 
                    ? (analiseGeral.totalGastos / analiseGeral.deputadosAtivos).toLocaleString('pt-BR') 
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Por Transação:</span>
                <span className="font-bold">
                  R$ {analiseGeral.totalTransacoes > 0 
                    ? (analiseGeral.totalGastos / analiseGeral.totalTransacoes).toLocaleString('pt-BR')
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Por Fornecedor:</span>
                <span className="font-bold">
                  R$ {analiseGeral.fornecedoresUnicos > 0 
                    ? (analiseGeral.totalGastos / analiseGeral.fornecedoresUnicos).toLocaleString('pt-BR')
                    : '0'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Indicadores de Risco
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Alertas Críticos:</span>
                <Badge variant={analiseGeral.alertasSuspeitos > 0 ? "destructive" : "default"}>
                  {analiseGeral.alertasSuspeitos}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Suspeição:</span>
                <span className={`font-bold ${
                  analiseGeral.alertasSuspeitos > 10 ? 'text-red-600' :
                  analiseGeral.alertasSuspeitos > 5 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {analiseGeral.fornecedoresUnicos > 0 
                    ? ((analiseGeral.alertasSuspeitos / analiseGeral.fornecedoresUnicos) * 100).toFixed(1)
                    : '0'
                  }%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Padrões Detectados:</span>
                <span className="font-bold">
                  {padroesSuspeitos.length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recomendações */}
      {padroesSuspeitos.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              Recomendações de Análise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-blue-700">
              {padroesSuspeitos.some(p => p.nivel === 'critico') && (
                <div>• Priorize a investigação dos padrões classificados como críticos</div>
              )}
              {padroesSuspeitos.some(p => p.tipo.includes('Concentração')) && (
                <div>• Analise a diversificação de fornecedores dos deputados com alta concentração</div>
              )}
              {padroesSuspeitos.some(p => p.tipo.includes('Gastos Elevados')) && (
                <div>• Verifique a justificativa para gastos superiores aos limites esperados</div>
              )}
              <div>• Monitore as tendências mensais para identificar variações sazonais</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}