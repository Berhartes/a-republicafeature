import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Building2, TrendingUp, AlertTriangle, Users, Hash } from 'lucide-react'
import type { FornecedorStats } from '@/services/fornecedores-service'

interface FornecedoresEstatisticasPageProps {
  fornecedores: FornecedorStats[]
  estatisticasGerais: any
}

const obterCategoriaRisco = (score: number): string => {
  if (score >= 80) return 'Crítico'
  if (score >= 60) return 'Alto'
  if (score >= 40) return 'Médio'
  return 'Baixo'
}

export function FornecedoresEstatisticasPage({
  fornecedores,
  estatisticasGerais
}: FornecedoresEstatisticasPageProps) {
  
  const dadosGraficos = useMemo(() => {
    const distribuicaoScore = {
      critico: fornecedores.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Crítico').length,
      alto: fornecedores.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Alto').length,
      medio: fornecedores.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Médio').length,
      baixo: fornecedores.filter(f => obterCategoriaRisco(f.scoreSuspeicao) === 'Baixo').length
    }

    const scoreChartData = [
      { name: 'Crítico', value: distribuicaoScore.critico, color: '#dc2626' },
      { name: 'Alto', value: distribuicaoScore.alto, color: '#ea580c' },
      { name: 'Médio', value: distribuicaoScore.medio, color: '#d97706' },
      { name: 'Baixo', value: distribuicaoScore.baixo, color: '#16a34a' }
    ].filter(item => item.value > 0)

    const top10Valor = [...fornecedores]
      .sort((a, b) => b.totalTransacionado - a.totalTransacionado)
      .slice(0, 10)
      .map(f => ({
        nome: f.nome.length > 20 ? f.nome.substring(0, 20) + '...' : f.nome,
        valor: f.totalTransacionado,
        score: f.scoreSuspeicao
      }))

    const faixasValor = [
      { faixa: 'Até 10k', min: 0, max: 10000 },
      { faixa: '10k-50k', min: 10000, max: 50000 },
      { faixa: '50k-100k', min: 50000, max: 100000 },
      { faixa: '100k-500k', min: 100000, max: 500000 },
      { faixa: 'Acima 500k', min: 500000, max: Infinity }
    ]

    const distribuicaoValor = faixasValor.map(faixa => ({
      name: faixa.faixa,
      count: fornecedores.filter(f => f.totalTransacionado > faixa.min && f.totalTransacionado <= faixa.max).length
    }))

    const categorias = new Map<string, number>()
    fornecedores.forEach(f => {
      f.categorias.forEach(cat => {
        if (cat && cat.trim() !== '' && cat !== 'Não especificado') {
          categorias.set(cat, (categorias.get(cat) || 0) + 1)
        }
      })
    })

    const topCategorias = Array.from(categorias.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([categoria, count]) => ({
        categoria: categoria.length > 25 ? categoria.substring(0, 25) + '...' : categoria,
        count,
        percentual: (count / fornecedores.length) * 100
      }))

    return {
      scoreChartData,
      top10Valor,
      distribuicaoValor,
      topCategorias,
      distribuicaoScore
    }
  }, [fornecedores])

  const estatisticasCalculadas = useMemo(() => {
    const total = fornecedores.length
    const totalTransacionado = fornecedores.reduce((acc, f) => acc + f.totalTransacionado, 0)
    const totalTransacoes = fornecedores.reduce((acc, f) => acc + f.totalTransacoes, 0)
    const mediaValor = total > 0 ? totalTransacionado / total : 0
    const mediaTransacoes = total > 0 ? totalTransacoes / total : 0
    
    const deputadosUnicos = new Set()
    fornecedores.forEach(f => {
      f.deputadosAtendidos.forEach(dep => deputadosUnicos.add(dep))
    })

    const top10Percent = Math.ceil(total * 0.1)
    const fornecedoresOrdenados = [...fornecedores].sort((a, b) => b.totalTransacionado - a.totalTransacionado)
    const valorTop10Percent = fornecedoresOrdenados.slice(0, top10Percent).reduce((acc, f) => acc + f.totalTransacionado, 0)
    const concentracaoTop10 = totalTransacionado > 0 ? (valorTop10Percent / totalTransacionado) * 100 : 0

    return {
      total,
      totalTransacionado,
      totalTransacoes,
      mediaValor,
      mediaTransacoes,
      deputadosUnicos: deputadosUnicos.size,
      concentracaoTop10
    }
  }, [fornecedores])

  return (
    <div className="space-y-6">
      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {estatisticasCalculadas.total.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Total Fornecedores</p>
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
                  R$ {estatisticasCalculadas.mediaValor.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Valor Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  {estatisticasCalculadas.mediaTransacoes.toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground">Transações Médias</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {estatisticasCalculadas.deputadosUnicos}
                </div>
                <p className="text-xs text-muted-foreground">Deputados Atendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta de Concentração */}
      {estatisticasCalculadas.concentracaoTop10 > 70 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">
                  Alta concentração de valores
                </div>
                <div className="text-sm text-orange-700">
                  Os 10% maiores fornecedores representam {estatisticasCalculadas.concentracaoTop10.toFixed(1)}% do valor total transacionado.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Score */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Score de Risco</CardTitle>
            <CardDescription>
              Quantidade de fornecedores por categoria de risco
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficos.scoreChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {dadosGraficos.scoreChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top 10 por Valor */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Fornecedores por Valor</CardTitle>
            <CardDescription>
              Fornecedores com maior volume transacionado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficos.top10Valor} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={80} />
                  <Tooltip formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']} />
                  <Bar dataKey="valor" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Faixa de Valor */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Faixa de Valor</CardTitle>
          <CardDescription>
            Quantidade de fornecedores por faixa de valor transacionado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGraficos.distribuicaoValor}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias Mais Frequentes</CardTitle>
          <CardDescription>
            Categorias de despesas mais utilizadas pelos fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dadosGraficos.topCategorias.map((categoria, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {categoria.categoria}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoria.count} fornecedores ({categoria.percentual.toFixed(1)}%)
                    </div>
                  </div>
                  <Badge variant="outline">
                    {categoria.count}
                  </Badge>
                </div>
                <Progress value={categoria.percentual} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}