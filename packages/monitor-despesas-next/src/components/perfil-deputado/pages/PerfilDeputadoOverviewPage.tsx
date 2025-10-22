import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Building2, MapPin, Award, Crown as CrownIcon, TrendingUp, DollarSign, Users } from 'lucide-react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { VALORES_COTA_PARLAMENTAR_POR_UF } from '@/lib/constants'

interface PerfilDeputadoOverviewPageProps {
  deputadoData: any
  despesasDetalhadas: any[]
  perfilComportamental: any
  loading: boolean
  periodDescription: string
  getDeputadoCoroas?: (deputadoId: string) => any[]
  getDeputadoTrofeus?: (deputadoId: string) => any[]
  getDeputadoMedalhas?: (deputadoId: string) => any[]
}

export function PerfilDeputadoOverviewPage({
  deputadoData,
  despesasDetalhadas,
  perfilComportamental,
  loading,
  periodDescription,
  getDeputadoCoroas,
  getDeputadoTrofeus,
  getDeputadoMedalhas
}: PerfilDeputadoOverviewPageProps) {
  
  if (loading || !deputadoData) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const totalGasto = despesasDetalhadas.reduce((sum, d) => sum + (d.valorDocumento || 0), 0)
  const totalTransacoes = despesasDetalhadas.length
  const mediaGasto = totalTransacoes > 0 ? totalGasto / totalTransacoes : 0
  
  const cotaUF = VALORES_COTA_PARLAMENTAR_POR_UF[deputadoData.siglaUf] || 45000
  const percentualCotaUsada = (totalGasto / cotaUF) * 100

  const gastosPorCategoria = despesasDetalhadas.reduce((acc: any, despesa) => {
    const categoria = despesa.tipoDespesa || despesa.categoria || 'OUTROS'
    acc[categoria] = (acc[categoria] || 0) + (despesa.valorDocumento || 0)
    return acc
  }, {})

  const categoriaData = Object.entries(gastosPorCategoria)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 8)
    .map(([categoria, valor]) => ({
      categoria: categoria.length > 15 ? categoria.substring(0, 15) + '...' : categoria,
      valor: Number(valor),
      percentual: ((Number(valor) / totalGasto) * 100).toFixed(1)
    }))

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

  const coroas = getDeputadoCoroas ? getDeputadoCoroas(deputadoData.id?.toString() || '') : []
  const trofeus = getDeputadoTrofeus ? getDeputadoTrofeus(deputadoData.id?.toString() || '') : []
  const medalhas = getDeputadoMedalhas ? getDeputadoMedalhas(deputadoData.id?.toString() || '') : []

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome Completo</label>
                <p className="font-semibold">{deputadoData.nomeEleitoral}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">ID</label>
                <p className="font-semibold">{deputadoData.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Partido</label>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{deputadoData.siglaPartido}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">UF</label>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-semibold">{deputadoData.siglaUf}</p>
                </div>
              </div>
              {deputadoData.situacao && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Situação</label>
                  <Badge variant={deputadoData.situacao === 'Exercício' ? 'default' : 'secondary'}>
                    {deputadoData.situacao}
                  </Badge>
                </div>
              )}
              {deputadoData.email && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">E-mail</label>
                  <p className="text-sm">{deputadoData.email}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Coroas */}
              {coroas.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Coroas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {coroas.slice(0, 5).map((coroa, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger>
                            <CrownIcon className="h-6 w-6 text-yellow-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{coroa.titulo}</p>
                            <p className="text-xs">{coroa.descricao}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {coroas.length > 5 && (
                      <Badge variant="secondary">+{coroas.length - 5}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Troféus */}
              {trofeus.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Troféus</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {trofeus.slice(0, 5).map((trofeu, index) => (
                      <TooltipProvider key={index}>
                        <Tooltip>
                          <TooltipTrigger>
                            <Award className="h-5 w-5 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{trofeu.titulo}</p>
                            <p className="text-xs">{trofeu.descricao}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                    {trofeus.length > 5 && (
                      <Badge variant="secondary">+{trofeus.length - 5}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Medalhas */}
              {medalhas.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Medalhas</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {medalhas.slice(0, 5).map((medalha, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {medalha.titulo}
                      </Badge>
                    ))}
                    {medalhas.length > 5 && (
                      <Badge variant="secondary">+{medalhas.length - 5}</Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Se não há conquistas */}
              {coroas.length === 0 && trofeus.length === 0 && medalhas.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma conquista registrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {totalGasto.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-muted-foreground">Total Gasto</div>
            <div className="text-xs text-muted-foreground mt-1">
              {periodDescription}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {totalTransacoes.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Transações</div>
            <div className="text-xs text-muted-foreground mt-1">
              R$ {mediaGasto.toFixed(2)} média
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {percentualCotaUsada.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">da Cota</div>
            <div className="text-xs text-muted-foreground mt-1">
              R$ {cotaUF.toLocaleString()} limite
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Object.keys(gastosPorCategoria).length}
            </div>
            <div className="text-sm text-muted-foreground">Categorias</div>
            <div className="text-xs text-muted-foreground mt-1">
              diferentes tipos
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoria - Gráfico de Pizza */}
        {categoriaData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gastos por Categoria</CardTitle>
              <CardDescription>
                Distribuição dos gastos por tipo de despesa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoriaData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="valor"
                      label={({ categoria, percentual }) => `${categoria}: ${percentual}%`}
                    >
                      {categoriaData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
        )}

        {/* Gastos por Categoria - Gráfico de Barras */}
        {categoriaData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Categorias</CardTitle>
              <CardDescription>
                Maiores categorias de gastos em valores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoriaData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="categoria" type="category" width={100} />
                    <RechartsTooltip 
                      formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']}
                    />
                    <Bar dataKey="valor" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Perfil Comportamental */}
      {perfilComportamental && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Perfil Comportamental
            </CardTitle>
            <CardDescription>
              Análise automatizada do comportamento de gastos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-medium text-blue-800">Padrão de Gastos</div>
                <div className="text-sm text-blue-600 mt-1">
                  {perfilComportamental.padraoGastos || 'Regular'}
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">Categoria Principal</div>
                <div className="text-sm text-green-600 mt-1">
                  {perfilComportamental.categoriaPrincipal || 'Diversificado'}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-purple-800">Score de Transparência</div>
                <div className="text-sm text-purple-600 mt-1">
                  {perfilComportamental.scoreTransparencia || '85'}/100
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status da Cota */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Status da Cota Parlamentar
          </CardTitle>
          <CardDescription>
            Utilização da cota parlamentar disponível para {deputadoData.siglaUf}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Utilização da Cota</span>
              <span className="text-sm font-bold">
                {percentualCotaUsada.toFixed(2)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  percentualCotaUsada > 90 ? 'bg-red-600' :
                  percentualCotaUsada > 70 ? 'bg-yellow-600' :
                  'bg-green-600'
                }`} 
                style={{ width: `${Math.min(100, percentualCotaUsada)}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-green-600">
                  R$ {totalGasto.toLocaleString('pt-BR')}
                </div>
                <div className="text-muted-foreground">Gasto Atual</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-blue-600">
                  R$ {Math.max(0, cotaUF - totalGasto).toLocaleString('pt-BR')}
                </div>
                <div className="text-muted-foreground">Disponível</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-purple-600">
                  R$ {cotaUF.toLocaleString('pt-BR')}
                </div>
                <div className="text-muted-foreground">Limite Total</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
