import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'
import { TrendingUp, Users, Package, AlertTriangle, Target, Calendar } from 'lucide-react'
import type { FornecedorStats } from '@/services/fornecedores-service'

interface PerfilFornecedorVisaoGeralPageProps {
  fornecedorData: FornecedorStats | null
  transacoesDetalhadas: any[]
  mediasCategoria: Record<string, number>
  fornecedorInflacionado: boolean
  percentualInflacao: number
  anoSelecionado: number
  mesSelecionado: string
}

export function PerfilFornecedorVisaoGeralPage({
  fornecedorData,
  transacoesDetalhadas,
  mediasCategoria,
  fornecedorInflacionado,
  percentualInflacao,
  anoSelecionado,
  mesSelecionado
}: PerfilFornecedorVisaoGeralPageProps) {
  const totalTransacionado = fornecedorData?.totalTransacionado ?? fornecedorData?.totalRecebido ?? 0
  const totalTransacoes = fornecedorData
    ? fornecedorData.totalTransacoes ?? fornecedorData.transacoes ?? fornecedorData.numeroTransacoes ?? 0
    : 0
  const totalCategorias = Array.isArray(fornecedorData?.categorias) ? fornecedorData.categorias.length : 0
  const totalDeputados = (() => {
    if (!fornecedorData) return 0
    const deputados = fornecedorData.deputadosAtendidos
    if (Array.isArray(deputados)) return deputados.length
    if (typeof deputados === 'number') return deputados
    return fornecedorData.numeroDeputadosAtendidos ?? 0
  })()

  const dadosGraficos = useMemo(() => {
    if (!fornecedorData || !transacoesDetalhadas.length) {
      return {
        distribuicaoCategorias: [],
        deputadosTop: [],
        evolucaoMensal: [],
        distribuicaoValores: []
      }
    }

    const categoriaCount = new Map<string, { count: number, valor: number }>()
    transacoesDetalhadas.forEach(t => {
      const categoria = t.categoria || t.tipoDespesa || 'Outras'
      const valor = t.valorLiquido || t.vlrLiquido || 0
      
      if (!categoriaCount.has(categoria)) {
        categoriaCount.set(categoria, { count: 0, valor: 0 })
      }
      const cat = categoriaCount.get(categoria)!
      cat.count += 1
      cat.valor += valor
    })

    const distribuicaoCategorias = Array.from(categoriaCount.entries())
      .map(([nome, dados]) => ({
        name: nome.length > 20 ? nome.substring(0, 20) + '...' : nome,
        value: dados.valor,
        count: dados.count,
        fill: `hsl(${Math.abs(nome.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % 360}, 70%, 50%)`
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)

    const deputadoCount = new Map<string, { count: number, valor: number }>()
    transacoesDetalhadas.forEach(t => {
      const deputado = t.nomeDeputado || t.txNomeParlamentar || 'Desconhecido'
      const valor = t.valorLiquido || t.vlrLiquido || 0
      
      if (!deputadoCount.has(deputado)) {
        deputadoCount.set(deputado, { count: 0, valor: 0 })
      }
      const dep = deputadoCount.get(deputado)!
      dep.count += 1
      dep.valor += valor
    })

    const deputadosTop = Array.from(deputadoCount.entries())
      .map(([nome, dados]) => ({
        name: nome.length > 25 ? nome.substring(0, 25) + '...' : nome,
        valor: dados.valor,
        transacoes: dados.count
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 10)

    const evolucaoMensal = new Map<string, { valor: number, transacoes: number }>()
    transacoesDetalhadas.forEach(t => {
      const data = new Date(t.dataEmissao || t.dataDocumento || t.datEmissao)
      if (isNaN(data.getTime())) return
      
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
      const valor = t.valorLiquido || t.vlrLiquido || 0
      
      if (!evolucaoMensal.has(chave)) {
        evolucaoMensal.set(chave, { valor: 0, transacoes: 0 })
      }
      const mes = evolucaoMensal.get(chave)!
      mes.valor += valor
      mes.transacoes += 1
    })

    const evolucaoMensalArray = Array.from(evolucaoMensal.entries())
      .map(([mes, dados]) => ({
        mes,
        valor: dados.valor,
        transacoes: dados.transacoes
      }))
      .sort((a, b) => a.mes.localeCompare(b.mes))

    const faixasValor = [
      { nome: 'Até 1k', min: 0, max: 1000, count: 0 },
      { nome: '1k-5k', min: 1000, max: 5000, count: 0 },
      { nome: '5k-10k', min: 5000, max: 10000, count: 0 },
      { nome: '10k-50k', min: 10000, max: 50000, count: 0 },
      { nome: '50k+', min: 50000, max: Infinity, count: 0 }
    ]

    transacoesDetalhadas.forEach(t => {
      const valor = t.valorLiquido || t.vlrLiquido || 0
      const faixa = faixasValor.find(f => valor >= f.min && valor < f.max)
      if (faixa) faixa.count += 1
    })

    const distribuicaoValores = faixasValor
      .filter(f => f.count > 0)
      .map((f, index) => ({
        name: f.nomeEleitoral,
        value: f.count,
        fill: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'][index]
      }))

    return {
      distribuicaoCategorias,
      deputadosTop,
      evolucaoMensal: evolucaoMensalArray,
      distribuicaoValores
    }
  }, [fornecedorData, transacoesDetalhadas])

  const metricas = useMemo(() => {
    if (!fornecedorData) return null

    const ticketMedio = totalTransacoes > 0
      ? totalTransacionado / totalTransacoes
      : 0

    const deputadosComValor = dadosGraficos.deputadosTop
    const valorTop3 = deputadosComValor.slice(0, 3).reduce((acc, dep) => acc + dep.valor, 0)
    const concentracaoTop3 = totalTransacionado > 0
      ? (valorTop3 / totalTransacionado) * 100
      : 0

    const categoriaPrincipal = dadosGraficos.distribuicaoCategorias[0]?.name || 'N/A'
    const valorCategoriaPrincipal = dadosGraficos.distribuicaoCategorias[0]?.value || 0

    const mediaMensalFornecedor = dadosGraficos.evolucaoMensal.length > 0
      ? dadosGraficos.evolucaoMensal.reduce((sum, entry) => sum + entry.valor, 0) / dadosGraficos.evolucaoMensal.length
      : 0

    const mediasValores = Object.values(mediasCategoria)
    const mediaScore = mediasValores.length > 0
      ? mediasValores.reduce((a, b) => a + b, 0) / mediasValores.length
      : 0

    return {
      totalCategorias,
      totalDeputados,
      ticketMedio,
      concentracaoTop3,
      categoriaPrincipal,
      valorCategoriaPrincipal,
      mediaScore,
      mediaMensalFornecedor,
      totalTransacionado,
      totalTransacoes,
      scoreSuspeicao: fornecedorData.scoreSuspeicao,
    }
  }, [fornecedorData, dadosGraficos, mediasCategoria, totalCategorias, totalDeputados, totalTransacionado, totalTransacoes])

  if (!fornecedorData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Carregando dados do fornecedor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">{metricas?.totalCategorias}</div>
                <p className="text-xs text-muted-foreground">Categorias Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">{metricas?.totalDeputados}</div>
                <p className="text-xs text-muted-foreground">Deputados Atendidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="font-bold text-green-700 text-lg">
                R$ {(() => {
                  if (!metricas) return '0';
                  const totalDeputados = metricas.totalDeputados || 1;
                  const mesesEstimados = 12;
                  const valorTotal = metricas.valorTotal || 0;
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

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-lg font-bold">
                  {metricas?.concentracaoTop3.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Concentração Top 3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Novos Blocos de Métricas para Fornecedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {metricas?.totalTransacionado?.toLocaleString('pt-BR') || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Total Gasto</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metricas?.totalTransacoes?.toLocaleString('pt-BR') || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Total de Transações</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              R$ {metricas?.ticketMedio?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
            </div>
            <div className="text-sm text-muted-foreground">Ticket Médio</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {metricas?.totalCategorias?.toLocaleString('pt-BR') || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Categorias Atendidas</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {metricas?.totalDeputados?.toLocaleString('pt-BR') || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Deputados Atendidos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-red-600">
              {metricas?.categoriaPrincipal || 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Categoria Principal</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-lg font-bold text-pink-600">
              R$ {metricas?.valorCategoriaPrincipal?.toLocaleString('pt-BR') || '0'}
            </div>
            <div className="text-sm text-muted-foreground">Valor Categoria Principal</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              metricas?.scoreSuspeicao >= 70 ? 'text-red-600' :
              metricas?.scoreSuspeicao >= 40 ? 'text-orange-600' :
              'text-green-600'
            }`}>
              {metricas?.scoreSuspeicao?.toFixed(1) || '0.0'}
            </div>
            <div className="text-sm text-muted-foreground">Score de Suspeição</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-teal-600">
              R$ {metricas?.mediaMensalFornecedor?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
            </div>
            <div className="text-sm text-muted-foreground">Média Mensal de Gastos</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${
              fornecedorInflacionado ? 'text-red-600' : 'text-green-600'
            }`}>
              {fornecedorInflacionado ? `${percentualInflacao.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Percentual de Inflação</div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {fornecedorInflacionado && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Alerta de Inflação de Preços</div>
                <div className="text-sm text-orange-700">
                  Este fornecedor pratica valores {percentualInflacao.toFixed(1)}% acima da média da categoria.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Categorias */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categorias</CardTitle>
            <CardDescription>
              Valor transacionado por categoria de despesa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficos.distribuicaoCategorias}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      percent > 0.05 ? `${name}: ${(percent * 100).toFixed(1)}%` : null
                    }
                  >
                    {dadosGraficos.distribuicaoCategorias.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Deputados */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Deputados</CardTitle>
            <CardDescription>
              Deputados com maior volume de transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficos.deputadosTop} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <RechartsTooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']}
                  />
                  <Bar dataKey="valor" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução Temporal */}
      {dadosGraficos.evolucaoMensal.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolução Temporal</CardTitle>
            <CardDescription>
              Evolução das transações ao longo do tempo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dadosGraficos.evolucaoMensal}>
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

      {/* Análise de Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Valores</CardTitle>
            <CardDescription>
              Transações agrupadas por faixa de valor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficos.distribuicaoValores}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {dadosGraficos.distribuicaoValores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Análise de Concentração */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Concentração</CardTitle>
            <CardDescription>
              Distribuição dos gastos entre deputados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Top 3 deputados</span>
                  <span>{metricas?.concentracaoTop3.toFixed(1)}% do valor total</span>
                </div>
                <Progress value={metricas?.concentracaoTop3 || 0} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold">{metricas?.categoriaPrincipal}</div>
                  <div className="text-xs text-muted-foreground">Categoria Principal</div>
                </div>
                <div className="p-3 bg-gray-50 rounded">
                  <div className="text-lg font-bold">
                    R$ {metricas?.valorCategoriaPrincipal.toLocaleString('pt-BR') || '0'}
                  </div>
                  <div className="text-xs text-muted-foreground">Valor da Principal</div>
                </div>
              </div>

              {Object.keys(mediasCategoria).length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Comparação com Médias:</h4>
                  <div className="space-y-2">
                    {Object.entries(mediasCategoria).slice(0, 3).map(([categoria, media]) => (
                      <div key={categoria} className="flex justify-between text-sm">
                        <span>{categoria}</span>
                        <Badge variant={media > 60 ? 'destructive' : media > 40 ? 'default' : 'secondary'}>
                          {media.toFixed(1)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo do Período */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo do Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <strong>Período analisado:</strong>
              <div className="text-muted-foreground">
                Ano {anoSelecionado}
                {mesSelecionado !== 'todos' && ` • Mês ${mesSelecionado}`}
              </div>
            </div>
            <div>
              <strong>Total de transações:</strong>
              <div className="text-muted-foreground">
                {transacoesDetalhadas.length} transações registradas
              </div>
            </div>
            <div>
              <strong>Status do fornecedor:</strong>
              <div className={`${
                fornecedorData.scoreSuspeicao >= 70 ? 'text-red-600' :
                fornecedorData.scoreSuspeicao >= 40 ? 'text-orange-600' :
                'text-green-600'
              }`}>
                {fornecedorData.scoreSuspeicao >= 70 ? 'Alto risco' :
                 fornecedorData.scoreSuspeicao >= 40 ? 'Risco moderado' :
                 'Baixo risco'} • Score: {fornecedorData.scoreSuspeicao.toFixed(1)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}