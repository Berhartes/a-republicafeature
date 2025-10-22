import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, AlertTriangle, Users, Building2, Calendar } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import type { DespesaDetalhada } from '../hooks/useDeputadoData.js'
import { DeputadoDataProcessing } from '../utils/deputadoDataProcessing.js'

interface DeputadoVisaoGeralPageProps {
  despesasDetalhadas: DespesaDetalhada[]
  alertasConformidade: any[]
  anoSelecionado: number
  mesSelecionado: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#6B7280']

export function DeputadoVisaoGeralPage({
  despesasDetalhadas,
  alertasConformidade,
  anoSelecionado,
  mesSelecionado
}: DeputadoVisaoGeralPageProps) {
  const estatisticas = DeputadoDataProcessing.calcularEstatisticasGerais(despesasDetalhadas)
  const gastosPorCategoria = DeputadoDataProcessing.processarGastosPorCategoria(despesasDetalhadas)
  
  const dadosGraficoPizza = gastosPorCategoria.slice(0, 6).map(categoria => ({
    name: categoria.categoria.length > 20 
      ? categoria.categoria.substring(0, 20) + '...' 
      : categoria.categoria,
    value: categoria.valor,
    fullName: categoria.categoria
  }))

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {estatisticas.totalGasto.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground">
              {mesSelecionado === 'todos' ? `Ano ${anoSelecionado}` : `${mesSelecionado}/${anoSelecionado}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.totalTransacoes}</div>
            <p className="text-xs text-muted-foreground">
              Média: R$ {estatisticas.valorMedioTransacao.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorias</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gastosPorCategoria.length}</div>
            <p className="text-xs text-muted-foreground">
              Principal: {gastosPorCategoria[0]?.categoria.substring(0, 15) || 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.fornecedoresPrincipais.length}</div>
            <p className="text-xs text-muted-foreground">
              {alertasConformidade.length > 0 ? `${alertasConformidade.length} alertas` : 'Conforme'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Conformidade */}
      {alertasConformidade.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Alertas de Conformidade
            </CardTitle>
            <CardDescription className="text-orange-700">
              Identificamos {alertasConformidade.length} situação(ões) que requer(em) atenção
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alertasConformidade.map((alerta, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <div className="font-medium text-orange-800">{alerta.tipo}</div>
                    <div className="text-sm text-orange-700">{alerta.descricao}</div>
                  </div>
                  <Badge variant="outline" className="border-orange-300 text-orange-800">
                    {alerta.severidade}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Gastos por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>
              Gastos distribuídos pelas principais categorias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGraficoPizza}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {dadosGraficoPizza.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value, _, props) => [
                      `R$ ${Number(value).toLocaleString('pt-BR')}`,
                      props.payload.fullName
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Categorias Detalhada */}
        <Card>
          <CardHeader>
            <CardTitle>Top Categorias</CardTitle>
            <CardDescription>
              Categorias com maiores gastos no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gastosPorCategoria.slice(0, 8).map((categoria, index) => (
                <div key={categoria.categoria} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <div className="font-medium text-sm">
                        {categoria.categoria.length > 30 
                          ? categoria.categoria.substring(0, 30) + '...' 
                          : categoria.categoria
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {categoria.transacoes} transação(ões)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">
                      R$ {categoria.valor.toLocaleString('pt-BR')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {categoria.percentual.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Principais Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Principais Fornecedores</CardTitle>
          <CardDescription>
            Fornecedores com maiores valores transacionados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {estatisticas.fornecedoresPrincipais.map((fornecedor, index) => (
              <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">{fornecedor.nomeEleitoral}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      CNPJ: {fornecedor.cnpj || 'Não informado'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {fornecedor.transacoes} transação(ões)
                    </p>
                    {fornecedor.categorias.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fornecedor.categorias.slice(0, 2).map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cat.length > 15 ? cat.substring(0, 15) + '...' : cat}
                          </Badge>
                        ))}
                        {fornecedor.categorias.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{fornecedor.categorias.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      R$ {fornecedor.valor.toLocaleString('pt-BR')}
                    </p>
                    <Badge variant="outline" className="text-xs mt-1">
                      Média: R$ {(fornecedor.valor / fornecedor.transacoes).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}