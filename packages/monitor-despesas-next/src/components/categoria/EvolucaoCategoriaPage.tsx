
import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Calendar, BarChart3, PieChartIcon } from 'lucide-react'

interface EvolucaoCategoriaPageProps {
  categoria: string
  anosDisponiveis: number[]
}

export const EvolucaoCategoriaPage = ({
  categoria,
  anosDisponiveis
}: EvolucaoCategoriaPageProps) => {
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'linha' | 'barra' | 'pizza'>('linha')
  const [anoSelecionado, setAnoSelecionado] = useState<number>(anosDisponiveis[0] || new Date().getFullYear())
  
  
  const categoriaData = null
  const loading = false
  const erro = null
  const getTransacoesPorAno = () => []
  const dadosEvolucao = useMemo(() => {
    if (loading || erro || !categoriaData) {
      return { dadosLinha: [], dadosBarra: [], dadosPizza: [], estatisticas: null }
    }

    const transacoesDoAno = getTransacoesPorAno()
    console.log(`📊 [EvolucaoCategoria] Processando ${transacoesDoAno.length} transações do ano ${anoSelecionado}`)
    
    if (transacoesDoAno.length === 0) {
      return { dadosLinha: [], dadosBarra: [], dadosPizza: [], estatisticas: null }
    }

    const mesesMap = new Map<number, { valor: number, transacoes: number }>()
    
    transacoesDoAno.forEach(transacao => {
      let mes: number | null = null
      
      const campos = [
        transacao.dataDocumento,
        transacao.dataEmissao, 
        transacao.data,
        transacao.timestamp,
        transacao.dtEmissao,
        transacao.dtCompetencia,
        transacao.datEmissao,
        transacao.datDocumento
      ]
      
      for (const campo of campos) {
        if (campo) {
          try {
            let data: Date | null = null
            
            if (campo.toDate) {
              data = campo.toDate()
            } else if (campo.seconds) {
              data = new Date(campo.seconds * 1000)
            } else if (typeof campo === 'string') {
              data = new Date(campo)
            } else if (campo instanceof Date) {
              data = campo
            }
            
            if (data && !isNaN(data.getTime())) {
              mes = data.getMonth() + 1 // 1-12
              break
            }
          } catch (error) {
            continue
          }
        }
      }
      
      if (mes && mes >= 1 && mes <= 12) {
        const valor = parseFloat(transacao.valorLiquido || transacao.vlrLiquido || transacao.valorDocumento || transacao.vlrDocumento || 0)
        
        if (valor > 0) {
          const atual = mesesMap.get(mes) || { valor: 0, transacoes: 0 }
          mesesMap.set(mes, {
            valor: atual.valor + valor,
            transacoes: atual.transacoes + 1
          })
        }
      }
    })
    
    const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    
    const dadosLinha = nomesMeses.map((nome, index) => {
      const mes = index + 1
      const dadosMes = mesesMap.get(mes) || { valor: 0, transacoes: 0 }
      
      return {
        mes: nome,
        valor: dadosMes.valor,
        transacoes: dadosMes.transacoes,
        mesNumero: mes
      }
    })
    
    const dadosBarra = dadosLinha.filter(item => item.valor > 0)
    
    const dadosPizza = dadosBarra
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 6)
      .map((item, index) => ({
        ...item,
        cor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#6B7280'][index]
      }))
    
    const totalAno = dadosLinha.reduce((acc, item) => acc + item.valor, 0)
    const totalTransacoes = dadosLinha.reduce((acc, item) => acc + item.transacoes, 0)
    const mesesAtivos = dadosBarra.length
    const mediaMensal = mesesAtivos > 0 ? totalAno / mesesAtivos : 0
    const maiorMes = dadosBarra.length > 0 ? dadosBarra.reduce((max, item) => item.valor > max.valor ? item : max) : null
    
    const estatisticas = {
      totalAno,
      totalTransacoes,
      mesesAtivos,
      mediaMensal,
      maiorMes
    }
    
    console.log(`📊 [EvolucaoCategoria] Estatísticas calculadas:`, estatisticas)
    
    return { dadosLinha, dadosBarra, dadosPizza, estatisticas }
  }, [categoriaData, anoSelecionado, loading, erro, getTransacoesPorAno])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de evolução...</p>
        </CardContent>
      </Card>
    )
  }

  if (erro) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-600">Erro ao carregar dados de evolução: {erro}</p>
        </CardContent>
      </Card>
    )
  }

  const { dadosLinha, dadosBarra, dadosPizza, estatisticas } = dadosEvolucao

  const renderChart = () => {
    if (tipoVisualizacao === 'linha') {
      return (
        <LineChart data={dadosLinha}>
          <XAxis dataKey="mes" />
          <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Gastos']}
            labelFormatter={(label) => `Mês: ${label}`}
          />
          <Line 
            type="monotone" 
            dataKey="valor"
            stroke="#3B82F6"
            strokeWidth={3} 
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      );
    }
    if (tipoVisualizacao === 'barra') {
      return (
        <BarChart data={dadosBarra}>
          <XAxis dataKey="mes" />
          <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Gastos']}
            labelFormatter={(label) => `Mês: ${label}`}
          />
          <Bar dataKey="valor" fill="#3B82F6" />
        </BarChart>
      );
    }
    if (tipoVisualizacao === 'pizza' && dadosPizza.length > 0) {
      return (
        <PieChart>
          <Pie
            data={dadosPizza}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={100}
            paddingAngle={5}
            dataKey="valor"
          >
            {dadosPizza.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.cor} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Gastos']}
          />
        </PieChart>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ALERTA: Processamento Desabilitado */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="font-medium text-amber-800">Aba Evolução Desabilitada</h3>
              <p className="text-sm text-amber-700 mt-1">
                O processamento de dados temporais foi desabilitado para melhorar a performance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Evolução Temporal - {categoria}</h3>
          <p className="text-sm text-gray-600">Análise dos gastos ao longo do tempo</p>
        </div>
        
        <div className="flex gap-2 items-center">
          <Select value={anoSelecionado.toString()} onValueChange={(value) => setAnoSelecionado(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anosDisponiveis.map(ano => (
                <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={tipoVisualizacao} onValueChange={(value: any) => setTipoVisualizacao(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linha">Linha</SelectItem>
              <SelectItem value="barra">Barras</SelectItem>
              <SelectItem value="pizza">Pizza</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estatísticas resumo */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total do Ano</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                R$ {estatisticas.totalAno.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estatisticas.totalTransacoes.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Meses Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {estatisticas.mesesAtivos}/12
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Média Mensal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                R$ {estatisticas.mediaMensal.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Maior Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-red-600">
                {estatisticas.maiorMes ? estatisticas.maiorMes.mes : 'N/A'}
              </div>
              {estatisticas.maiorMes && (
                <div className="text-sm text-gray-600">
                  R$ {estatisticas.maiorMes.valor.toLocaleString('pt-BR')}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tipoVisualizacao === 'linha' && <TrendingUp className="w-5 h-5" />}
            {tipoVisualizacao === 'barra' && <BarChart3 className="w-5 h-5" />}
            {tipoVisualizacao === 'pizza' && <PieChartIcon className="w-5 h-5" />}
            Evolução {anoSelecionado}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {dadosLinha.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum dado encontrado para {anoSelecionado}</p>
              </div>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legenda para pizza */}
      {tipoVisualizacao === 'pizza' && dadosPizza.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Legenda - Top 6 Meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {dadosPizza.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: item.cor }}
                  ></div>
                  <span className="text-sm">{item.mes}</span>
                  <Badge variant="outline" className="text-xs">
                    R$ {(item.valor / 1000).toFixed(0)}k
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
