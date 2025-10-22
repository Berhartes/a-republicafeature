import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'

interface EvolucaoFornecedorPageProps {
  fornecedorData: any
  anoSelecionado: number
  evolucaoPorDeputado: any
  deputadosVisiveisEvolucao: Set<string>
  setDeputadosVisiveisEvolucao: (value: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  dadosHistoricos: any[]
  evolucaoMensal: any[]
}

export const EvolucaoFornecedorPage = ({
  fornecedorData,
  anoSelecionado,
  evolucaoPorDeputado,
  deputadosVisiveisEvolucao,
  setDeputadosVisiveisEvolucao,
  dadosHistoricos,
  evolucaoMensal
}) => {
  const dadosComProjecao = useMemo(() => {
    if (!evolucaoPorDeputado?.data || !Array.isArray(evolucaoPorDeputado.data)) {
      return { dados: [], estamosEm2025: false }
    }

    const dados = evolucaoPorDeputado.data
    const anoAtualSistema = new Date().getFullYear()
    
    const mesesParaIndice = {
      'Jan': 0, 'Fev': 1, 'Mar': 2, 'Abr': 3, 'Mai': 4, 'Jun': 5,
      'Jul': 6, 'Ago': 7, 'Set': 8, 'Out': 9, 'Nov': 10, 'Dez': 11
    }

    const temMesesSemGastos = dados.some(item => (item.total || 0) === 0)
    const temMesesIncompletos = dados.some(item => {
      const valor = item.total || 0
      if (valor === 0) return false
      
      const mesesComDados = dados.filter(d => (d.total || 0) > 0)
      if (mesesComDados.length > 0) {
        const mediaEsperada = mesesComDados.reduce((soma, d) => soma + (d.total || 0), 0) / mesesComDados.length
        return valor < mediaEsperada * 0.4 // 60% menor que a média
      }
      return false
    })

    const estamosEm2025 = anoAtualSistema === 2025 && anoSelecionado === 2025 && (temMesesSemGastos || temMesesIncompletos)

    const calcularProjecaoMes = (mesNome: string, dadosOriginais: any[]): { projecao: number, mediaHistorica: number, variacao: number } => {
      const mesesComDados = dadosOriginais.filter(item => (item.total || 0) > 0)
      if (mesesComDados.length === 0) return { projecao: 0, mediaHistorica: 0, variacao: 0 }
      
      const mediaTotalMensal = mesesComDados.reduce((soma, item) => soma + (item.total || 0), 0) / mesesComDados.length
      
      const fatoresSazonais = {
        'Jan': 0.9, 'Fev': 0.95, 'Mar': 1.1, 'Abr': 1.15, 'Mai': 1.2, 'Jun': 1.1,
        'Jul': 1.05, 'Ago': 1.15, 'Set': 1.2, 'Out': 1.25, 'Nov': 1.15, 'Dez': 0.8
      }
      
      const fatorSazonal = fatoresSazonais[mesNome] || 1.0
      
      const projecaoTotal = mediaTotalMensal * fatorSazonal
      const variacao = mediaTotalMensal > 0 ? ((projecaoTotal - mediaTotalMensal) / mediaTotalMensal) * 100 : 0
      
      return { 
        projecao: projecaoTotal, 
        mediaHistorica: mediaTotalMensal, 
        variacao 
      }
    }

    const detectarMesIncompleto = (mesNome: string, valor: number): boolean => {
      if (!estamosEm2025) return false
      
      const hoje = new Date()
      const mesAtual = hoje.getMonth() + 1
      const diaAtual = hoje.getDate()
      const indiceMes = mesesParaIndice[mesNome] + 1
      
      if (indiceMes === mesAtual && diaAtual < 25) return true
      
      if (valor > 0) {
        const mesesComDados = dados.filter(item => (item.total || 0) > 0)
        if (mesesComDados.length > 0) {
          const mediaEsperada = mesesComDados.reduce((soma, item) => soma + (item.total || 0), 0) / mesesComDados.length
          if (valor < mediaEsperada * 0.4) return true
        }
      }
      
      return false
    }

    const primeiroMesComProjecao = dados.findIndex(item => {
      const valor = item.total || 0
      const mesIncompleto = detectarMesIncompleto(item.mes, valor)
      return valor === 0 || mesIncompleto
    })
    
    const inicioLinhaCinza = estamosEm2025 && primeiroMesComProjecao > -1 ? 
      Math.max(0, primeiroMesComProjecao - 1) : -1

    const dadosProcessados = dados.map((item, index) => {
      const valor = item.total || 0
      const mesIncompleto = detectarMesIncompleto(item.mes, valor)
      
      let totalProjecao = null
      let dadosProjecao = null
      
      if (estamosEm2025 && index >= inicioLinhaCinza) {
        if (valor > 0 && !mesIncompleto) {
          totalProjecao = valor
          dadosProjecao = { projecao: valor, mediaHistorica: 0, variacao: 0, isRealNaLinhaCinza: true }
        } else {
          dadosProjecao = calcularProjecaoMes(item.mes, dados)
          totalProjecao = dadosProjecao.projecao
        }
      }

      return {
        ...item,
        totalProjecao,
        mediaHistorica: dadosProjecao?.mediaHistorica,
        variacao: dadosProjecao?.variacao,
        isProjecao: dadosProjecao !== null,
        isRealNaLinhaCinza: dadosProjecao?.isRealNaLinhaCinza || false,
        mesIncompleto,
        valorRealParcial: mesIncompleto ? valor : null
      }
    })

    return { dados: dadosProcessados, estamosEm2025 }
  }, [evolucaoPorDeputado, anoSelecionado])
  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Evolução</CardTitle>
        <CardDescription>Gráficos detalhados de evolução temporal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Evolução Mensal por Deputado */}
          <Card className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-medium">Evolução Mensal por Deputado - {anoSelecionado}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Categoria Principal: <span className="font-medium text-red-600">
                    {fornecedorData?.categorias?.[0] || 'N/A'}
                  </span>
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {deputadosVisiveisEvolucao.size} deputados visíveis
              </div>
            </div>
            
            {dadosComProjecao.dados.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={dadosComProjecao.dados}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <RechartsTooltip 
                      formatter={(value: number, name: string, props: any) => {
                        const dataPoint = props.payload
                        
                        if (name === 'totalProjecao') {
                          if (value === null || value === undefined) return null
                          
                          if (dataPoint.mesIncompleto) {
                            const valorParcial = dataPoint.valorRealParcial || 0
                            const percentualCompleto = valorParcial > 0 ? ((valorParcial / value) * 100).toFixed(0) : '0'
                            return [
                              `R$ ${value.toLocaleString('pt-BR')}`,
                              `📊 Projeção do mês (${percentualCompleto}% já computado)`
                            ]
                          } else if (dataPoint.isRealNaLinhaCinza) {
                            return [`R$ ${value.toLocaleString('pt-BR')}`, '📊 Dados reais (linha de referência)']
                          } else if (dataPoint.isProjecao) {
                            const variacao = dataPoint.variacao || 0
                            const sinal = variacao >= 0 ? '+' : ''
                            const cor = variacao >= 0 ? '🔺' : '🔻'
                            return [
                              `R$ ${value.toLocaleString('pt-BR')}`,
                              `Projeção ${cor} ${sinal}${variacao.toFixed(1)}% vs histórico`
                            ]
                          } else {
                            return [`R$ ${value.toLocaleString('pt-BR')}`, '📈 Dados especulativos (projeção)']
                          }
                        } else if (name === 'total') {
                          if (dataPoint.mesIncompleto) {
                            return [`R$ ${value.toLocaleString('pt-BR')}`, '⏳ Total parcial recebido (mês em andamento)']
                          } else {
                            return [`R$ ${value.toLocaleString('pt-BR')}`, 'Total recebido pela empresa']
                          }
                        } else {
                          return [`R$ ${value.toLocaleString('pt-BR')}`, name]
                        }
                      }}
                      labelFormatter={(label) => `Mês: ${label}`}
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#f9fafb'
                      }}
                    />
                    <Legend />
                    
                    {/* Linha cinza - Projeção baseada em médias históricas */}
                    {dadosComProjecao.estamosEm2025 && (
                      <Line 
                        type="monotone" 
                        dataKey="totalProjecao"
                        stroke="#9CA3AF"
                        strokeWidth={3} 
                        dot={false}
                        connectNulls={false}
                        strokeDasharray="6 6"
                        name="Projeção Total"
                      />
                    )}
                    
                    {/* Linha do total de gastos */}
                    <Line 
                      type="monotone" 
                      dataKey="total" 
                      stroke="#10B981" 
                      strokeWidth={4} 
                      name="Total de Gastos" 
                    />
                    
                    {/* Linha da média por deputado */}
                    <Line 
                      type="monotone" 
                      dataKey="media" 
                      stroke="#F59E0B" 
                      strokeWidth={3} 
                      strokeDasharray="8 4"
                      name="Média por Deputado" 
                    />
                    
                    {/* Linha da média da categoria do fornecedor */}
                    <Line 
                      type="monotone" 
                      dataKey="mediaCategoriaFornecedor" 
                      stroke="#DC2626" 
                      strokeWidth={3} 
                      strokeDasharray="12 6"
                      name={`Média Categoria: ${fornecedorData?.categorias?.[0] || 'N/A'}`}
                    />
                    
                    {/* Linhas dos deputados */}
                    {evolucaoPorDeputado.deputados.map((deputado, index) => {
                      const isVisible = deputadosVisiveisEvolucao.has(deputado.nome)
                      if (!isVisible) return null
                      
                      const colors = [
                        '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
                        '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
                        '#F43F5E', '#EF4444', '#F97316', '#F59E0B', '#84CC16'
                      ]
                      
                      return (
                        <Line
                          key={deputado.nome}
                          type="monotone"
                          dataKey={deputado.nome}
                          stroke={colors[index % colors.length]}
                          strokeWidth={3}
                          name={`${deputado.nome} (${deputado.siglaPartido})`}
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
                
                {/* Controles de Visibilidade dos Deputados com Toggles */}
                <div className="mt-6">
                  <h5 className="font-medium mb-4">Controlar Deputados Visíveis:</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-2">
                    {evolucaoPorDeputado.deputados.map((deputado, index) => {
                      const isVisible = deputadosVisiveisEvolucao.has(deputado.nome)
                      const colors = [
                        '#EF4444', '#F97316', '#F59E0B', '#84CC16', '#22C55E',
                        '#06B6D4', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
                        '#F43F5E', '#EF4444', '#F97316', '#F59E0B', '#84CC16'
                      ]
                      
                      if (index === 0) {
                        console.log('🔄 Estado atual:', {
                          deputadosVisiveis: Array.from(deputadosVisiveisEvolucao),
                          totalDeputados: evolucaoPorDeputado.deputados.length,
                          primeiroDeputado: deputado.nome,
                          primeiroVisivel: isVisible
                        })
                      }
                      
                      return (
                        <div
                          key={deputado.nome}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div 
                              className="w-4 h-4 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: colors[index % colors.length] }}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-gray-900 truncate">
                                {deputado.nome}
                              </div>
                              <div className="text-xs text-gray-500">
                                {deputado.siglaPartido} • R$ {deputado.total.toLocaleString('pt-BR')}
                              </div>
                            </div>
                          </div>
                          
                          {/* Toggle Switch */}
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              
                              console.log('🔄 Toggle clicado para:', deputado.nome, 'Visível antes:', isVisible)
                              console.log('🔄 Estado antes:', Array.from(deputadosVisiveisEvolucao))
                              
                              setDeputadosVisiveisEvolucao(prevVisible => {
                                const newVisible = new Set(prevVisible)
                                if (prevVisible.has(deputado.nome)) {
                                  newVisible.delete(deputado.nome)
                                  console.log('🔄 Removendo deputado:', deputado.nome)
                                } else {
                                  newVisible.add(deputado.nome)
                                  console.log('🔄 Adicionando deputado:', deputado.nome)
                                }
                                console.log('🔄 Novo estado:', Array.from(newVisible))
                                return newVisible
                              })
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                              isVisible ? 'bg-blue-600' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                isVisible ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Ações rápidas */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        console.log('🔄 Clique: Mostrar TOP 3')
                        const top3 = evolucaoPorDeputado.deputados
                          .slice(0, 3)
                          .map(d => d.nome)
                        console.log('🔄 TOP 3:', top3)
                        setDeputadosVisiveisEvolucao(new Set(top3))
                      }}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    >
                      Mostrar TOP 3
                    </button>
                    <button
                      onClick={() => {
                        console.log('🔄 Clique: Mostrar Todos')
                        const todos = evolucaoPorDeputado.deputados.map(d => d.nome)
                        console.log('🔄 Todos os deputados:', todos)
                        setDeputadosVisiveisEvolucao(new Set(todos))
                      }}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    >
                      Mostrar Todos
                    </button>
                    <button
                      onClick={() => {
                        console.log('🔄 Clique: Ocultar Todos')
                        setDeputadosVisiveisEvolucao(new Set())
                      }}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                    >
                      Ocultar Todos
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado de evolução mensal disponível para {anoSelecionado}
              </div>
            )}
          </Card>

          {/* Evolução Anual usando dados históricos */}
          <Card className="p-4">
            <h4 className="font-medium mb-4">Evolução Anual (Últimos 5 Anos)</h4>
            {dadosHistoricos.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={
                  Object.entries(
                    dadosHistoricos.reduce((acc: Record<string, number>, transacao) => {
                      const data = transacao.dataEmissao || transacao.dataDocumento || transacao.datEmissao || transacao.datDocumento
                      if (data) {
                        const ano = new Date(data).getFullYear().toString()
                        const valor = transacao.valorLiquido || transacao.vlrLiquido || transacao.valorDocumento || transacao.vlrDocumento || 0
                        acc[ano] = (acc[ano] || 0) + parseFloat(valor.toString())
                      }
                      return acc
                    }, {})
                  ).map(([ano, valor]) => ({ ano, valor })).sort((a, b) => parseInt(a.ano) - parseInt(b.ano))
                }>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <RechartsTooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="valor" stroke="#10B981" strokeWidth={3} name="Valor Anual" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Carregando dados históricos...
              </div>
            )}
          </Card>

          {/* Estatísticas de Evolução */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h5 className="font-medium text-sm text-muted-foreground">Maior Mês</h5>
              <div className="text-lg font-bold">
                {evolucaoMensal.length > 0 
                  ? evolucaoMensal.reduce((max, atual) => atual.valor > max.valor ? atual : max).mes
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {evolucaoMensal.length > 0 
                  ? `R$ ${evolucaoMensal.reduce((max, atual) => atual.valor > max.valor ? atual : max).valor.toLocaleString('pt-BR')}`
                  : ''
                }
              </div>
            </Card>
            
            <Card className="p-4">
              <h5 className="font-medium text-sm text-muted-foreground">Menor Mês</h5>
              <div className="text-lg font-bold">
                {evolucaoMensal.length > 0 
                  ? evolucaoMensal.reduce((min, atual) => atual.valor < min.valor ? atual : min).mes
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {evolucaoMensal.length > 0 
                  ? `R$ ${evolucaoMensal.reduce((min, atual) => atual.valor < min.valor ? atual : min).valor.toLocaleString('pt-BR')}`
                  : ''
                }
              </div>
            </Card>
            
            <Card className="p-4">
              <h5 className="font-medium text-sm text-muted-foreground">Média Mensal</h5>
              <div className="text-lg font-bold">
                {evolucaoMensal.length > 0 
                  ? `R$ ${(evolucaoMensal.reduce((sum, mes) => sum + mes.valor, 0) / evolucaoMensal.length).toLocaleString('pt-BR')}`
                  : 'N/A'
                }
              </div>
              <div className="text-sm text-muted-foreground">
                {evolucaoMensal.length} meses
              </div>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}