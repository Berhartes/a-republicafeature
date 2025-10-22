import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, Users, Building2, AlertTriangle, Package, DollarSign, Calendar, Target, Clock } from 'lucide-react'
import type { FornecedorStats } from '@/services/fornecedores-service'

interface CategoriaVisaoGeralPageProps {
  categoria: string
  estatisticasCategoria: any
  fornecedoresDaCategoria: FornecedorStats[]
  evolucaoMensalCategoria: any[]
  anoSelecionado: number | 'todos'
  mesSelecionado: string
  anosDisponiveis?: number[]
  onAnoChange?: (ano: number | 'todos') => void
  onMesChange?: (mes: string) => void
}

export function CategoriaVisaoGeralPage({
  categoria,
  estatisticasCategoria,
  fornecedoresDaCategoria,
  evolucaoMensalCategoria,
  anoSelecionado,
  mesSelecionado,
  anosDisponiveis = [2025, 2024, 2023],
  onAnoChange,
  onMesChange
}: CategoriaVisaoGeralPageProps) {
  
  const dadosGraficos = useMemo(() => {
    const top10Fornecedores = (fornecedoresDaCategoria || [])
      .slice(0, 10)
      .map(f => {
        const fonte = f as FornecedorStats & { nomeEleitoral?: string }
        const nomeCompleto = fonte.nome || fonte.nomeEleitoral || 'Fornecedor'
        const nome = nomeCompleto.length > 20 ? `${nomeCompleto.substring(0, 20)}...` : nomeCompleto
        return {
          nome,
          valor: f.totalTransacionado || 0,
          transacoes: f.totalTransacoes || f.transacoes || 0
        }
      });

    const faixasValor = [
      { faixa: 'Até 10k', min: 0, max: 10000, cor: '#10b981' },
      { faixa: '10k-50k', min: 10000, max: 50000, cor: '#3b82f6' },
      { faixa: '50k-100k', min: 50000, max: 100000, cor: '#f59e0b' },
      { faixa: '100k+', min: 100000, max: Infinity, cor: '#ef4444' }
    ]

    const distribuicaoValor = faixasValor.map(faixa => ({
      name: faixa.faixa,
      value: (fornecedoresDaCategoria || []).filter(f =>
        (f.totalTransacionado || 0) >= faixa.min && (f.totalTransacionado || 0) < faixa.max
      ).length,
      fill: faixa.cor
    }))

    const evolucaoTemporal = (evolucaoMensalCategoria || []).map(item => ({
      mes: item.mes,
      valor: item.valor,
      transacoes: item.transacoes
    }))

    return {
      top10Fornecedores,
      distribuicaoValor,
      evolucaoTemporal
    }
  }, [fornecedoresDaCategoria, evolucaoMensalCategoria])

  const metricas = useMemo(() => {
    const fornecedores = fornecedoresDaCategoria || []
    const totalFornecedores = fornecedores.length
    const valorTotal = fornecedores.reduce((acc, f) => acc + (f.totalTransacionado || 0), 0)
    const totalTransacoes = fornecedores.reduce((acc, f) => acc + (f.totalTransacoes || f.transacoes || 0), 0)
    
    const valorMedio = totalFornecedores > 0 ? valorTotal / totalFornecedores : 0
    const mediaTransacoes = totalFornecedores > 0 ? totalTransacoes / totalFornecedores : 0
    const ticketMedio = totalTransacoes > 0 ? valorTotal / totalTransacoes : 0
    
    const deputadosUnicos = new Set<string>()
    fornecedoresDaCategoria.forEach(f => {
      if (f.deputadosAtendidos && Array.isArray(f.deputadosAtendidos)) {
        f.deputadosAtendidos.forEach(dep => {
          if (typeof dep === 'string') {
            deputadosUnicos.add(dep)
          } else if (typeof dep === 'number') {
            deputadosUnicos.add(String(dep))
          } else if (dep && typeof dep === 'object' && 'id' in dep) {
            deputadosUnicos.add(dep.id)
          }
        })
      }
    })
    const totalDeputados = deputadosUnicos.size
    
    const mesesEstimados = 12
    const mediaMensalPorDeputado = totalDeputados > 0 && mesesEstimados > 0 ? 
      valorTotal / (totalDeputados * mesesEstimados) : 0
    
    const top20Percent = Math.ceil(totalFornecedores * 0.2)
    const valorTop20 = fornecedoresDaCategoria
      .slice(0, top20Percent)
      .reduce((acc, f) => acc + f.totalTransacionado, 0)
    const concentracao = valorTotal > 0 ? (valorTop20 / valorTotal) * 100 : 0
    
    const fornecedoresSuspeitos = fornecedores.filter(f => (f.scoreSuspeicao || 0) >= 70).length
    
    return {
      totalFornecedores,
      valorTotal,
      totalTransacoes,
      valorMedio,
      mediaTransacoes,
      ticketMedio,
      mediaMensalPorDeputado,
      totalDeputados,
      concentracao,
      fornecedoresSuspeitos
    }
  }, [fornecedoresDaCategoria])

  const tendencias = useMemo(() => {
    const evolucao = evolucaoMensalCategoria || []
    if (evolucao.length < 2) return null
    
    const primeiro = evolucao[0]
    const ultimo = evolucao[evolucao.length - 1]
    
    const crescimentoValor = primeiro.valor > 0 
      ? ((ultimo.valor - primeiro.valor) / primeiro.valor) * 100 
      : 0
    
    const crescimentoTransacoes = primeiro.transacoes > 0
      ? ((ultimo.transacoes - primeiro.transacoes) / primeiro.transacoes) * 100
      : 0
    
    return {
      crescimentoValor,
      crescimentoTransacoes,
      direcao: crescimentoValor > 0 ? 'crescimento' : crescimentoValor < 0 ? 'queda' : 'estavel'
    }
  }, [evolucaoMensalCategoria])

  const mesesDisponiveis = [
    { valor: 'todos', nome: 'Todos os meses' },
    { valor: '1', nome: 'Janeiro' },
    { valor: '2', nome: 'Fevereiro' },
    { valor: '3', nome: 'Março' },
    { valor: '4', nome: 'Abril' },
    { valor: '5', nome: 'Maio' },
    { valor: '6', nome: 'Junho' },
    { valor: '7', nome: 'Julho' },
    { valor: '8', nome: 'Agosto' },
    { valor: '9', nome: 'Setembro' },
    { valor: '10', nome: 'Outubro' },
    { valor: '11', nome: 'Novembro' },
    { valor: '12', nome: 'Dezembro' }
  ]

  return (
    <div className="space-y-6">
      {/* Filtros Temporais */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm">Ano:</label>
              <Select 
                value={anoSelecionado ? anoSelecionado.toString() : 'todos'} 
                onValueChange={(value) => onAnoChange && onAnoChange(value === 'todos' ? 'todos' : parseInt(value))}
                disabled={!onAnoChange}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {(anosDisponiveis || []).filter(ano => ano).map(ano => (
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
                onValueChange={(value) => onMesChange && onMesChange(value)}
                disabled={!onMesChange}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(mesesDisponiveis || []).map(mes => (
                    <SelectItem key={mes.valor} value={mes.valor}>
                      {mes.nome || mes.nomeEleitoral || mes.valor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {estatisticasCategoria?.valorTotal?.toLocaleString('pt-BR') || metricas.valorTotal?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">
                  {estatisticasCategoria?.totalFornecedores?.toLocaleString('pt-BR') || (fornecedoresDaCategoria || []).length.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Fornecedores</p>
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
                  {estatisticasCategoria?.totalDeputados?.toLocaleString('pt-BR') || metricas.totalDeputados.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Deputados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">
                  {estatisticasCategoria?.totalTransacoes?.toLocaleString('pt-BR') || metricas.totalTransacoes?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Transações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {metricas.valorMedio.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs text-muted-foreground">Valor Médio por Fornecedor</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">
                  R$ {metricas.mediaMensalPorDeputado?.toLocaleString('pt-BR') || '0'}
                </div>
                <p className="text-xs text-muted-foreground">Média Mensal por Deputado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-bold">
                  {metricas.concentracao.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Concentração Top 20%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={metricas.fornecedoresSuspeitos > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`h-4 w-4 ${
                metricas.fornecedoresSuspeitos > 0 ? 'text-red-600' : 'text-gray-400'
              }`} />
              <div>
                <div className={`text-lg font-bold ${
                  metricas.fornecedoresSuspeitos > 0 ? 'text-red-600' : ''
                }`}>
                  {metricas.fornecedoresSuspeitos}
                </div>
                <p className="text-xs text-muted-foreground">Fornecedores Suspeitos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Tendências */}
      {tendencias && (
        <Card className={`${
          tendencias.direcao === 'crescimento' ? 'border-green-200 bg-green-50' :
          tendencias.direcao === 'queda' ? 'border-red-200 bg-red-50' :
          'border-blue-200 bg-blue-50'
        }`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-5 w-5 ${
                tendencias.direcao === 'crescimento' ? 'text-green-600' :
                tendencias.direcao === 'queda' ? 'text-red-600' :
                'text-blue-600'
              }`} />
              <div>
                <div className={`font-medium ${
                  tendencias.direcao === 'crescimento' ? 'text-green-800' :
                  tendencias.direcao === 'queda' ? 'text-red-800' :
                  'text-blue-800'
                }`}>
                  Tendência: {tendencias.direcao === 'crescimento' ? 'Crescimento' : 
                           tendencias.direcao === 'queda' ? 'Queda' : 'Estável'}
                </div>
                <div className={`text-sm ${
                  tendencias.direcao === 'crescimento' ? 'text-green-700' :
                  tendencias.direcao === 'queda' ? 'text-red-700' :
                  'text-blue-700'
                }`}>
                  Valor: {tendencias.crescimentoValor > 0 ? '+' : ''}{tendencias.crescimentoValor.toFixed(1)}% • 
                  Transações: {tendencias.crescimentoTransacoes > 0 ? '+' : ''}{tendencias.crescimentoTransacoes.toFixed(1)}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 10 Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Fornecedores</CardTitle>
            <CardDescription>
              Fornecedores com maior volume na categoria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficos.top10Fornecedores} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="nome" type="category" width={100} />
                  <RechartsTooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Bar dataKey="valor" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Faixa de Valor */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Valor</CardTitle>
            <CardDescription>
              Fornecedores agrupados por faixa de valor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficos.distribuicaoValor}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) => 
                      value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : null
                    }
                  >
                    {(dadosGraficos.distribuicaoValor || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal (se disponível) */}
      {dadosGraficos.evolucaoTemporal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>
              Evolução dos gastos ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGraficos.evolucaoTemporal}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      name === 'valor' 
                        ? `R$ ${Number(value).toLocaleString('pt-BR')}` 
                        : value,
                      name === 'valor' ? 'Valor' : 'Transações'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="valor" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Valor"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transacoes" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Transações"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Indicadores de Concentração */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Concentração</CardTitle>
          <CardDescription>
            Distribuição dos gastos entre os fornecedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Top 20% dos fornecedores</span>
                <span>{metricas.concentracao.toFixed(1)}% do valor total</span>
              </div>
              <Progress value={metricas.concentracao} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{metricas.totalFornecedores}</div>
                <div className="text-xs text-muted-foreground">Total de Fornecedores</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">
                  R$ {metricas.valorTotal.toLocaleString('pt-BR')}
                </div>
                <div className="text-xs text-muted-foreground">Valor Total</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{metricas.totalTransacoes}</div>
                <div className="text-xs text-muted-foreground">Total de Transações</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{metricas.mediaTransacoes.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground">Média Transações/Fornecedor</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo do Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Período analisado:</strong>
              <div className="text-muted-foreground">
                {anoSelecionado === 'todos' ? 'Todos os anos' : `Ano ${anoSelecionado}`}
                {mesSelecionado !== 'todos' && ` • Mês ${mesSelecionado}`}
              </div>
            </div>
            <div>
              <strong>Categoria:</strong>
              <div className="text-muted-foreground">{categoria}</div>
            </div>
            <div>
              <strong>Fornecedores ativos:</strong>
              <div className="text-muted-foreground">
                {metricas.totalFornecedores} fornecedores registraram transações
              </div>
            </div>
            <div>
              <strong>Status da concentração:</strong>
              <div className={`${
                metricas.concentracao > 70 ? 'text-red-600' :
                metricas.concentracao > 50 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {metricas.concentracao > 70 ? 'Alta concentração' :
                 metricas.concentracao > 50 ? 'Concentração moderada' :
                 'Distribuição equilibrada'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}