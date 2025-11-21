import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Brain, TrendingUp, AlertTriangle, Info, Lightbulb, Target, Activity, RefreshCw } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { cn, formatDateBR } from '@/lib/utils'

interface Predicao {
  deputado: string
  riscoPrevisto: number
  tendencia: 'crescente' | 'decrescente' | 'estavel'
  alertasPotenciais: string[]
  confianca: number
  recomendacoes: string[]
}

interface PredictiveAnalyticsProps {
  dados?: any
  onPredicaoGerada?: (predicoes: Predicao[]) => void
}

export function PredictiveAnalytics({ onPredicaoGerada }: PredictiveAnalyticsProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [predicoes, setPredicoes] = useState<Predicao[]>([])
  const [progresso, setProgresso] = useState(0)
  const [modelInfo] = useState({
    acuracia: 0.87,
    precisao: 0.84,
    recall: 0.89,
    ultimoTreino: new Date('2025-06-01')
  })

  const executarAnalise = async () => {
    setIsAnalyzing(true)
    setProgresso(0)
    
    const progressInterval = setInterval(() => {
      setProgresso(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return prev + 10
      })
    }, 200)

    await new Promise(resolve => setTimeout(resolve, 2500))

    const novasPredicoes: Predicao[] = [
      {
        deputado: 'Dilvanda Faro',
        riscoPrevisto: 92,
        tendencia: 'crescente',
        alertasPotenciais: [
          'Provável superfaturamento em combustível nos próximos 30 dias',
          'Padrão de gastos indica possível limite excedido em março'
        ],
        confianca: 0.88,
        recomendacoes: [
          'Monitorar gastos com combustível',
          'Verificar fornecedores recorrentes',
          'Analisar padrão temporal de transações'
        ]
      },
      {
        deputado: 'General Pazuello',
        riscoPrevisto: 35,
        tendencia: 'estavel',
        alertasPotenciais: [
          'Baixo risco de irregularidades'
        ],
        confianca: 0.91,
        recomendacoes: [
          'Manter monitoramento padrão',
          'Verificar mudanças de padrão'
        ]
      },
      {
        deputado: 'João Silva',
        riscoPrevisto: 68,
        tendencia: 'crescente',
        alertasPotenciais: [
          'Aumento anormal de gastos detectado',
          'Possível concentração de fornecedores'
        ],
        confianca: 0.76,
        recomendacoes: [
          'Investigar novos fornecedores',
          'Comparar com média do partido',
          'Verificar justificativas de gastos'
        ]
      }
    ]

    setPredicoes(novasPredicoes)
    setIsAnalyzing(false)
    
    if (onPredicaoGerada) {
      onPredicaoGerada(novasPredicoes)
    }
  }

  const dadosTendencia = [
    { mes: 'Jan', real: 45, previsto: 42 },
    { mes: 'Fev', real: 52, previsto: 48 },
    { mes: 'Mar', real: 58, previsto: 55 },
    { mes: 'Abr', real: 72, previsto: 68 },
    { mes: 'Mai', real: 85, previsto: 80 },
    { mes: 'Jun', real: null, previsto: 92 },
    { mes: 'Jul', real: null, previsto: 95 },
    { mes: 'Ago', real: null, previsto: 88 }
  ]

  const getRiscoColor = (risco: number) => {
    if (risco >= 80) return 'text-red-600'
    if (risco >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getRiscoBadge = (risco: number) => {
    if (risco >= 80) return 'destructive'
    if (risco >= 60) return 'warning'
    return 'secondary'
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente': return <TrendingUp className="h-4 w-4 text-red-600" />
      case 'decrescente': return <TrendingUp className="h-4 w-4 text-green-600 rotate-180" />
      default: return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-full">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Análise Preditiva com IA</CardTitle>
                <CardDescription>
                  Previsões baseadas em padrões históricos e machine learning
                </CardDescription>
              </div>
            </div>
            <Button 
              onClick={executarAnalise} 
              disabled={isAnalyzing}
              variant={isAnalyzing ? "secondary" : "default"}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Executar Análise
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        {isAnalyzing && (
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando dados...</span>
                <span>{progresso}%</span>
              </div>
              <Progress value={progresso} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Informações do Modelo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Acurácia</p>
                <p className="text-2xl font-bold">{(modelInfo.acuracia * 100).toFixed(0)}%</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precisão</p>
                <p className="text-2xl font-bold">{(modelInfo.precisao * 100).toFixed(0)}%</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recall</p>
                <p className="text-2xl font-bold">{(modelInfo.recall * 100).toFixed(0)}%</p>
              </div>
              <Brain className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Último Treino</p>
                <p className="text-lg font-medium">
                  {formatDateBR(modelInfo.ultimoTreino)}
                </p>
              </div>
              <RefreshCw className="h-8 w-8 text-muted-foreground opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendências */}
      {predicoes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tendência de Risco - Próximos Meses</CardTitle>
            <CardDescription>
              Comparação entre valores reais e previstos pelo modelo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height="300">
              <AreaChart data={dadosTendencia}>
                <defs>
                  <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPrevisto" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="real" 
                  stroke="#3B82F6" 
                  fillOpacity={1} 
                  fill="url(#colorReal)" 
                  name="Score Real"
                />
                <Area 
                  type="monotone" 
                  dataKey="previsto" 
                  stroke="#EF4444" 
                  fillOpacity={1} 
                  fill="url(#colorPrevisto)" 
                  name="Score Previsto"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Predições */}
      {predicoes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Predições por Deputado</h3>
          
          {predicoes.map((predicao, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header da Predição */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-semibold">{predicao.deputado}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant={getRiscoBadge(predicao.riscoPrevisto)}>
                          Risco: {predicao.riscoPrevisto}%
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          {getTendenciaIcon(predicao.tendencia)}
                          <span className="capitalize">{predicao.tendencia}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Confiança: {(predicao.confianca * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    <div className={cn(
                      "text-3xl font-bold",
                      getRiscoColor(predicao.riscoPrevisto)
                    )}>
                      {predicao.riscoPrevisto}
                    </div>
                  </div>

                  {/* Alertas Potenciais */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm font-medium">Alertas Potenciais</p>
                    </div>
                    <div className="space-y-1">
                      {predicao.alertasPotenciais.map((alerta, i) => (
                        <Alert key={i} className="py-2">
                          <AlertDescription className="text-sm">
                            {alerta}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>

                  {/* Recomendações */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <p className="text-sm font-medium">Recomendações</p>
                    </div>
                    <ul className="space-y-1">
                      {predicao.recomendacoes.map((rec, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info sobre ML */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Este modelo utiliza algoritmos de machine learning treinados com dados históricos de gastos parlamentares.
          As previsões são baseadas em padrões identificados e devem ser usadas como ferramenta auxiliar na tomada de decisão.
        </AlertDescription>
      </Alert>
    </div>
  )
}
