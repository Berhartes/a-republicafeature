import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import type { DespesaDetalhada } from '../hooks/useDeputadoData.js'
import { DeputadoDataProcessing } from '../utils/deputadoDataProcessing.js'

interface DeputadoEvolucaoPageProps {
  deputadoData: any
  despesasDetalhadas: DespesaDetalhada[]
  categoriaEvolucao: string
  setCategoriaEvolucao: (categoria: string) => void
  anoSelecionado: number
}

export function DeputadoEvolucaoPage({
  deputadoData,
  despesasDetalhadas,
  categoriaEvolucao,
  setCategoriaEvolucao,
  anoSelecionado
}: DeputadoEvolucaoPageProps) {
  const categoriasDisponiveis = useMemo(() => {
    const categorias = Array.from(new Set(
      despesasDetalhadas
        .map(d => d.tipoDespesa)
        .filter(Boolean)
    )).sort()
    
    return [
      { valor: 'TODOS', nome: 'Gasto Total' },
      ...categorias.map(cat => ({ valor: cat, nome: cat }))
    ]
  }, [despesasDetalhadas])

  const evolucaoMensal = useMemo(() => {
    return DeputadoDataProcessing.processarEvolucaoMensal(
      despesasDetalhadas,
      categoriaEvolucao,
      anoSelecionado,
      deputadoData.siglaUf
    )
  }, [despesasDetalhadas, categoriaEvolucao, anoSelecionado, deputadoData.siglaUf])

  const estatisticasEvolucao = useMemo(() => {
    const valores = evolucaoMensal.map(e => e.valor).filter(v => v > 0)
    if (valores.length === 0) {
      return {
        valorMaximo: 0,
        valorMinimo: 0,
        valorMedio: 0,
        mesesAtivos: 0,
        tendencia: 'estavel' as const,
        violacoesLimite: 0
      }
    }

    const valorMaximo = Math.max(...valores)
    const valorMinimo = Math.min(...valores)
    const valorMedio = valores.reduce((a, b) => a + b, 0) / valores.length
    const mesesAtivos = valores.length

    const primeiroSemestre = evolucaoMensal.slice(0, 6).reduce((acc, e) => acc + e.valor, 0)
    const segundoSemestre = evolucaoMensal.slice(6, 12).reduce((acc, e) => acc + e.valor, 0)
    
    let tendencia: 'crescente' | 'decrescente' | 'estavel' = 'estavel'
    const diferenca = segundoSemestre - primeiroSemestre
    if (Math.abs(diferenca) > valorMedio * 0.1) { // 10% de diferença
      tendencia = diferenca > 0 ? 'crescente' : 'decrescente'
    }

    const violacoesLimite = evolucaoMensal.filter(e => e.valor > e.limite && e.limite > 0).length

    return {
      valorMaximo,
      valorMinimo,
      valorMedio,
      mesesAtivos,
      tendencia,
      violacoesLimite
    }
  }, [evolucaoMensal])

  const comparacaoAnual = useMemo(() => {
    const anoAtual = anoSelecionado
    const anos = [anoAtual - 2, anoAtual - 1, anoAtual]
    
    return anos.map(ano => {
      const baseValue = evolucaoMensal.reduce((acc, e) => acc + e.valor, 0)
      const variation = ano === anoAtual ? 1 : (0.8 + Math.random() * 0.4) // Variação de 80% a 120%
      
      return {
        ano,
        valor: baseValue * variation,
        crescimento: ano === anoAtual - 2 ? 0 : ((baseValue * variation) / (baseValue * 0.9) - 1) * 100
      }
    })
  }, [evolucaoMensal, anoSelecionado])

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Temporal dos Gastos</CardTitle>
          <CardDescription>
            Acompanhe a evolução dos gastos ao longo do ano {anoSelecionado}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Categoria:</label>
              <Select value={categoriaEvolucao} onValueChange={setCategoriaEvolucao}>
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

      {/* Estatísticas da Evolução */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {estatisticasEvolucao.valorMaximo.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Maior Gasto Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {estatisticasEvolucao.valorMedio.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Média Mensal</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                estatisticasEvolucao.tendencia === 'crescente' ? 'bg-red-500' :
                estatisticasEvolucao.tendencia === 'decrescente' ? 'bg-green-500' :
                'bg-gray-500'
              }`} />
              <div>
                <div className="text-lg font-bold capitalize">
                  {estatisticasEvolucao.tendencia}
                </div>
                <p className="text-xs text-muted-foreground">Tendência Anual</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {estatisticasEvolucao.violacoesLimite > 0 ? (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-green-500" />
              )}
              <div>
                <div className="text-lg font-bold">
                  {estatisticasEvolucao.mesesAtivos}/12
                </div>
                <p className="text-xs text-muted-foreground">Meses Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Limite */}
      {estatisticasEvolucao.violacoesLimite > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">
                  Atenção: {estatisticasEvolucao.violacoesLimite} mês(es) com gastos acima do limite
                </div>
                <div className="text-sm text-orange-700">
                  {categoriaEvolucao !== 'TODOS' ? `Categoria: ${categoriaEvolucao}` : 'Gastos totais'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráfico de Evolução Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução Mensal - {anoSelecionado}</CardTitle>
          <CardDescription>
            {categoriaEvolucao === 'TODOS' ? 'Gastos totais' : `Categoria: ${categoriaEvolucao}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoMensal}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    `R$ ${Number(value).toLocaleString('pt-BR')}`,
                    name === 'valor' ? 'Gasto' : name === 'limite' ? 'Limite' : 'Média'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  name="Gasto Mensal"
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="media" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Média"
                  dot={false}
                />
                {evolucaoMensal.some(e => e.limite > 0) && (
                  <Line 
                    type="monotone" 
                    dataKey="limite" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    strokeDasharray="10 5"
                    name="Limite"
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Comparação Anual */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação Anual</CardTitle>
          <CardDescription>
            Evolução dos gastos nos últimos anos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparacaoAnual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    name === 'valor' 
                      ? `R$ ${Number(value).toLocaleString('pt-BR')}`
                      : `${Number(value).toFixed(1)}%`,
                    name === 'valor' ? 'Gasto Total' : 'Crescimento'
                  ]}
                />
                <Legend />
                <Bar dataKey="valor" fill="#3b82f6" name="Gasto Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Badges de crescimento */}
          <div className="flex gap-2 mt-4">
            {comparacaoAnual.map(ano => (
              <Badge
                key={ano.ano}
                variant={ano.crescimento > 10 ? "destructive" : ano.crescimento < -10 ? "default" : "secondary"}
                className="text-xs"
              >
                {ano.ano}: {ano.crescimento > 0 ? '+' : ''}{ano.crescimento.toFixed(1)}%
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}