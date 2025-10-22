import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { NetworkGraph } from '@/components/NetworkGraph'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

interface RelacoesCategoriaPageProps {
  redeRelacoes: {
    nodes: any[]
    edges: any[]
  }
  filtroPartido: string
  setFiltroPartido: (value: string) => void
  filtroUF: string
  setFiltroUF: (value: string) => void
  filtroValorMinimo: number
  setFiltroValorMinimo: (value: number) => void
  filtroValorMaximo: number
  setFiltroValorMaximo: (value: number) => void
  mostrarApenasTop: boolean
  setMostrarApenasTop: (value: boolean) => void
  mostrarApenasVIP: boolean
  setMostrarApenasVIP: (value: boolean) => void
  mostrarLabelsValores: boolean
  setMostrarLabelsValores: (value: boolean) => void
  chartDataDeputados: any[]
  chartDataPartidos: any[]
}

export const RelacoesCategoriaPage = ({
  redeRelacoes,
  filtroPartido,
  setFiltroPartido,
  filtroUF,
  setFiltroUF,
  filtroValorMinimo,
  setFiltroValorMinimo,
  filtroValorMaximo,
  setFiltroValorMaximo,
  mostrarApenasTop,
  setMostrarApenasTop,
  mostrarApenasVIP,
  setMostrarApenasVIP,
  mostrarLabelsValores,
  setMostrarLabelsValores,
  chartDataDeputados,
  chartDataPartidos
}) => {
  return (
    <>
      {/* Estatísticas da rede */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Nós na Rede</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{redeRelacoes.nodes.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Conexões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{redeRelacoes.edges.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Densidade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {redeRelacoes.nodes.length > 0 ? 
                ((redeRelacoes.edges.length / (redeRelacoes.nodes.length * (redeRelacoes.nodes.length - 1))) * 100).toFixed(1) : '0'}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Maior Conexão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              R$ {redeRelacoes.edges.length > 0 ? 
                Math.max(...redeRelacoes.edges.map(e => e.valor)).toLocaleString('pt-BR') : '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel de filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros da Rede</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Partido</label>
              <Select value={filtroPartido} onValueChange={setFiltroPartido}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os partidos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {Array.from(new Set(redeRelacoes.nodes.filter(n => n.siglaPartido).map(n => n.siglaPartido))).map(partido => (
                    <SelectItem key={partido} value={partido}>{partido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">UF</label>
              <Select value={filtroUF} onValueChange={setFiltroUF}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as UFs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {Array.from(new Set(redeRelacoes.nodes.filter(n => n.siglaUf).map(n => n.siglaUf))).map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Mínimo</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                placeholder="0"
                value={filtroValorMinimo}
                onChange={(e) => setFiltroValorMinimo(Number(e.target.value))}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Máximo</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                placeholder="Sem limite"
                value={filtroValorMaximo}
                onChange={(e) => setFiltroValorMaximo(Number(e.target.value))}
              />
            </div>
          </div>
          
          <div className="flex gap-4 mt-4 flex-wrap">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mostrarApenasTop}
                onChange={(e) => setMostrarApenasTop(e.target.checked)}
              />
              <span className="text-sm">Apenas TOP 10</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mostrarApenasVIP}
                onChange={(e) => setMostrarApenasVIP(e.target.checked)}
              />
              <span className="text-sm">Apenas VIP (R$ 50k+)</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={mostrarLabelsValores}
                onChange={(e) => setMostrarLabelsValores(e.target.checked)}
              />
              <span className="text-sm">Mostrar Valores</span>
            </label>
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => {
                setFiltroPartido('todos')
                setFiltroUF('todos')
                setFiltroValorMinimo(0)
                setFiltroValorMaximo(0)
                setMostrarApenasTop(false)
                setMostrarApenasVIP(false)
                setMostrarLabelsValores(true)
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* NetworkGraph */}
      <Card>
        <CardHeader>
          <CardTitle>Rede de Relacionamentos</CardTitle>
          <CardDescription>Visualização interativa das conexões</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {redeRelacoes.nodes.length > 0 ? (
              <NetworkGraph 
                nodes={redeRelacoes.nodes}
                edges={redeRelacoes.edges}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Nenhum dado de rede disponível</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de conexões */}
      <Card>
        <CardHeader>
          <CardTitle>Conexões por Intensidade</CardTitle>
          <CardDescription>TOP 20 relacionamentos por valor</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {redeRelacoes.edges
              .sort((a, b) => b.valor - a.valor)
              .slice(0, 20)
              .map((edge, index) => {
                const sourceNode = redeRelacoes.nodes.find(n => n.id === edge.source)
                const targetNode = redeRelacoes.nodes.find(n => n.id === edge.target)
                return (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{index + 1}.</span>
                      <span className="text-sm">{sourceNode?.label} ↔ {targetNode?.label}</span>
                    </div>
                    <span className="text-sm font-bold text-green-600">
                      R$ {edge.valor.toLocaleString('pt-BR')}
                    </span>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Análise de concentração */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Deputados</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartDataDeputados.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {chartDataDeputados.slice(0, 5).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Partido</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartDataPartidos.slice(0, 5)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ nome, percent }) => `${nome} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="valor"
                >
                  {chartDataPartidos.slice(0, 5).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </>
  )
}