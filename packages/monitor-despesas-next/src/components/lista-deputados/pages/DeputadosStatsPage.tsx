import React, { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Building2, MapPin, AlertTriangle, Crown, Target, DollarSign } from 'lucide-react'
import type { DeputadosStats } from '../hooks/useListaDeputadosData.js'

interface DeputadosStatsPageProps {
  stats: DeputadosStats
  loading: boolean
  onPartidoClick?: (data: { nome: string } | null) => void
  onEstadoClick?: (data: { nome: string } | null) => void
  onClearPartidoFilter?: () => void
  onClearEstadoFilter?: () => void
  partidoFiltrado?: string
  estadoFiltrado?: string
}

const DeputadosStatsPageComponent = function({
  stats,
  loading,
  onPartidoClick,
  onEstadoClick,
  onClearPartidoFilter,
  onClearEstadoFilter,
  partidoFiltrado,
  estadoFiltrado
}: DeputadosStatsPageProps) {

  const COLORS = useMemo(() => ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'], [])

  const getBarColor = useMemo(() => (nome: string, isPartido: boolean = true) => {
    const isSelecionado = isPartido ? partidoFiltrado === nome : estadoFiltrado === nome
    if (isSelecionado) {
      return isPartido ? '#4f46e5' : '#059669' // Cores mais escuras quando selecionado
    }
    return isPartido ? '#3b82f6' : '#10b981' // Cores normais
  }, [partidoFiltrado, estadoFiltrado])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats || stats.totalDeputados === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nenhuma estatística disponível
        </h3>
        <p className="text-muted-foreground">
          Não há dados suficientes para gerar estatísticas.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{stats.totalDeputados.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">Total de Deputados</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {(stats.totalGastos / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Total de Gastos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">
                  R$ {(stats.gastoPorDeputado / 1000).toFixed(0)}k
                </div>
                <p className="text-xs text-muted-foreground">Gasto por Deputado</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <div className="text-2xl font-bold">{stats.deputadosComAlertas}</div>
                <p className="text-xs text-muted-foreground">Com Alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicadores de Proporção */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Deputados com Alertas</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalDeputados > 0 ? ((stats.deputadosComAlertas / stats.totalDeputados) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 h-2 rounded-full" 
                style={{ 
                  width: stats.totalDeputados > 0 ? `${(stats.deputadosComAlertas / stats.totalDeputados) * 100}%` : '0%' 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Deputados com Coroas</span>
              <span className="text-sm text-muted-foreground">
                {stats.totalDeputados > 0 ? ((stats.deputadosComCoroas / stats.totalDeputados) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full" 
                style={{ 
                  width: stats.totalDeputados > 0 ? `${(stats.deputadosComCoroas / stats.totalDeputados) * 100}%` : '0%' 
                }}
              ></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dica de Interatividade */}
      {(onPartidoClick || onEstadoClick) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-800">
            💡 <strong>Dica:</strong> Clique nas barras dos gráficos abaixo para filtrar os deputados por partido ou estado!
          </p>
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Partidos - CLICÁVEL */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Top 10 Partidos por Gastos
                  {partidoFiltrado && partidoFiltrado !== 'TODOS' && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Filtrado: {partidoFiltrado}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Clique nas barras para filtrar deputados por partido
                </CardDescription>
              </div>
              {partidoFiltrado && partidoFiltrado !== 'TODOS' && (
                <button
                  onClick={onClearPartidoFilter}
                  className="text-blue-600 hover:text-blue-800 text-sm underline"
                >
                  ← Voltar
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats.partidosMaisGastadores.slice(0, 10)} 
                  layout="horizontal"
                  onClick={(data) => onPartidoClick?.(data?.activeLabel ? { nome: data.activeLabel } : null)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="partido" type="category" width={60} />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Total']}
                    labelFormatter={(label) => `${label} - Clique para filtrar`}
                  />
                  <Bar 
                    dataKey="total" 
                    style={{ cursor: onPartidoClick ? 'pointer' : 'default' }}
                    onClick={(data) => onPartidoClick?.({ nome: data.siglaPartido })}
                  >
                    {stats.partidosMaisGastadores.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.siglaPartido, true)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top UFs - CLICÁVEL */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top 10 Estados por Gastos
                  {estadoFiltrado && estadoFiltrado !== 'TODOS' && (
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Filtrado: {estadoFiltrado}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  Clique nas barras para filtrar deputados por estado
                </CardDescription>
              </div>
              {estadoFiltrado && estadoFiltrado !== 'TODOS' && (
                <button
                  onClick={onClearEstadoFilter}
                  className="text-green-600 hover:text-green-800 text-sm underline"
                >
                  ← Voltar
                </button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={stats.ufsMaisGastadoras.slice(0, 10)} 
                  layout="horizontal"
                  onClick={(data) => onEstadoClick?.(data?.activeLabel ? { nome: data.activeLabel } : null)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="uf" type="category" width={40} />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Total']}
                    labelFormatter={(label) => `${label} - Clique para filtrar`}
                  />
                  <Bar 
                    dataKey="total" 
                    style={{ cursor: onEstadoClick ? 'pointer' : 'default' }}
                    onClick={(data) => onEstadoClick?.({ nome: data.siglaUf })}
                  >
                    {stats.ufsMaisGastadoras.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.siglaUf, false)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Gastos */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Faixa de Gastos</CardTitle>
            <CardDescription>
              Quantidade de deputados por faixa de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribuicaoGastos.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ faixa, count, percent }) => 
                      count > 0 ? `${faixa}: ${count} (${(percent * 100).toFixed(1)}%)` : null
                    }
                  >
                    {stats.distribuicaoGastos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} deputados`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição de Scores */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Score de Suspeição</CardTitle>
            <CardDescription>
              Quantidade de deputados por faixa de score
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.distribuicaoScores.filter(d => d.count > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    label={({ faixa, count, percent }) => 
                      count > 0 ? `${faixa}: ${count} (${(percent * 100).toFixed(1)}%)` : null
                    }
                  >
                    {stats.distribuicaoScores.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} deputados`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas de Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ranking Partidos */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Partidos</CardTitle>
            <CardDescription>
              Partidos ordenados por volume total de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.partidosMaisGastadores.slice(0, 8).map((partido, index) => (
                <div key={partido.siglaPartido} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{partido.siglaPartido}</div>
                      <div className="text-sm text-muted-foreground">
                        {partido.count} deputados
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      R$ {(partido.total / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R$ {(partido.total / partido.count / 1000).toFixed(0)}k/dep
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Ranking UFs */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Estados</CardTitle>
            <CardDescription>
              Estados ordenados por volume total de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.ufsMaisGastadoras.slice(0, 8).map((uf, index) => (
                <div key={uf.siglaUf} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{uf.siglaUf}</div>
                      <div className="text-sm text-muted-foreground">
                        {uf.count} deputados
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      R$ {(uf.total / 1000000).toFixed(1)}M
                    </div>
                    <div className="text-sm text-muted-foreground">
                      R$ {(uf.total / uf.count / 1000).toFixed(0)}k/dep
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Insights dos Dados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-800">Partido Líder</span>
                </div>
                <div className="text-sm text-blue-700">
                  <strong>{stats.partidosMaisGastadores[0]?.siglaPartido || 'N/A'}</strong> lidera com 
                  R$ {((stats.partidosMaisGastadores[0]?.total || 0) / 1000000).toFixed(1)}M em gastos
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Estado Líder</span>
                </div>
                <div className="text-sm text-green-700">
                  <strong>{stats.ufsMaisGastadoras[0]?.siglaUf || 'N/A'}</strong> lidera com 
                  R$ {((stats.ufsMaisGastadoras[0]?.total || 0) / 1000000).toFixed(1)}M em gastos
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Taxa de Alertas</span>
                </div>
                <div className="text-sm text-orange-700">
                  <strong>{stats.totalDeputados > 0 ? ((stats.deputadosComAlertas / stats.totalDeputados) * 100).toFixed(1) : 0}%</strong> dos deputados 
                  possuem alertas ativos
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const DeputadosStatsPage = React.memo(DeputadosStatsPageComponent)