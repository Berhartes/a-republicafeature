
import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from '@tanstack/react-router'
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Building2, AlertTriangle, BarChart3, 
  Users, DollarSign, Filter, RefreshCw, Eye, 
  ShieldAlert, Target, Activity, Info,
} from 'lucide-react'
import { useCategoriaFornecedores } from '@/hooks/useGlobalFornecedoresProcessor'
import { slugToCategory } from '@/lib/category-slugs'
import { getCategoriaIcon } from '@/components/premiacoes/utils/categoria-icons'

interface EnhancedCategoriaPageProps {
  categoria?: string
}

export function EnhancedCategoriaPage({ categoria: propCategoria }: EnhancedCategoriaPageProps = {}) {
  const params = useParams({ from: '/gastos/categorias/$categoria' })
  const navigate = useNavigate()
  
  const categoriaSlug = propCategoria || params.categoria
  const categoriaNome = slugToCategory(categoriaSlug) || categoriaSlug
  
  const {
    fornecedores,
    dadosEnhanced,
    temCacheValido,
    loading,
    isEmpty,
    getFornecedoresComFiltros,
    analytics,
    refresh,
    ultimaAtualizacao,
    fonteInfo
  } = useCategoriaFornecedores(categoriaNome)

  const [filtroValor, setFiltroValor] = useState<'todos' | 'pequenos' | 'medios' | 'grandes'>('todos')
  const [ordenacao, setOrdenacao] = useState<'valor' | 'transacoes' | 'alfabetica'>('valor')
  const [limite, setLimite] = useState<number>(50)
  const [busca, setBusca] = useState('')

  const fornecedoresFiltrados = useMemo(() => {
    if (!getFornecedoresComFiltros) return fornecedores || []
    
    const filtrosPredefinidos = (() => {
      switch (filtroValor) {
        case 'pequenos': return { maxValor: 10000 }
        case 'medios': return { minValor: 10000, maxValor: 100000 }
        case 'grandes': return { minValor: 100000 }
        default: return {}
      }
    })()
    
    let resultado = getFornecedoresComFiltros({
      ...filtrosPredefinidos,
      ordenacao,
      limite: limite || undefined
    })
    
    if (busca.trim()) {
      const termoBusca = busca.toLowerCase().trim()
      resultado = resultado.filter(f =>
        f.nomeEleitoral?.toLowerCase().includes(termoBusca) ||
        f.cnpj?.includes(termoBusca)
      )
    }
    
    return resultado
  }, [getFornecedoresComFiltros, filtroValor, ordenacao, limite, busca, fornecedores])

  const RiskAnalysis = ({ analytics }: { analytics: any }) => {
    if (!analytics) return null
    
    const getRiskColor = (nivel: string) => {
      switch (nivel) {
        case 'alto': return 'text-red-600 bg-red-50 border-red-200'
        case 'medio': return 'text-orange-600 bg-orange-50 border-orange-200'
        case 'baixo': return 'text-green-600 bg-green-50 border-green-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }
    
    const getConcentrationColor = (nivel: string) => {
      switch (nivel) {
        case 'alta': return 'text-purple-600 bg-purple-50 border-purple-200'
        case 'media': return 'text-blue-600 bg-blue-50 border-blue-200'
        case 'baixa': return 'text-green-600 bg-green-50 border-green-200'
        default: return 'text-gray-600 bg-gray-50 border-gray-200'
      }
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`border-2 ${getRiskColor(analytics.risco.nivel)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-sm">Análise de Risco</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {analytics.risco.percentual.toFixed(1)}%
            </div>
            <p className="text-xs mt-1">{analytics.risco.descricao}</p>
          </CardContent>
        </Card>
        
        <Card className={`border-2 ${getConcentrationColor(analytics.concentracao.nivel)}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle className="text-sm">Concentração</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {analytics.concentracao.percentual.toFixed(1)}%
            </div>
            <p className="text-xs mt-1">{analytics.concentracao.descricao}</p>
          </CardContent>
        </Card>
        
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-sm text-blue-600">Atividade</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {analytics.atividade.transacoesPorFornecedor.toFixed(1)}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Transações por fornecedor
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const StatisticsOverview = ({ dadosEnhanced }: { dadosEnhanced: any }) => {
    if (!dadosEnhanced) return null
    
    const { estatisticas } = dadosEnhanced
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fornecedores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {estatisticas.totalFornecedores.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {estatisticas.totalValor.toLocaleString('pt-BR')}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deputados Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {estatisticas.deputadosUnicos}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspeitos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {estatisticas.fornecedoresSuspeitos}
            </div>
            <p className="text-xs text-muted-foreground">
              {estatisticas.percentualSuspeitos.toFixed(1)}% do total
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Carregando dados da categoria</h2>
          <p className="text-muted-foreground">
            Aguardando processamento dos dados da página de fornecedores...
          </p>
          {!temCacheValido && (
            <div className="mt-4">
              <Button 
                onClick={() => navigate({ to: '/gastos/fornecedores' })}
                variant="outline"
              >
                Ir para Fornecedores
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum fornecedor encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Não foram encontrados fornecedores para a categoria "{categoriaNome}".
          </p>
          <Button 
            onClick={() => navigate({ to: '/gastos/fornecedores' })}
            variant="outline"
          >
            Ver Todos os Fornecedores
          </Button>
        </div>
      </div>
    )
  }

  const CategoriaIcon = getCategoriaIcon(categoriaNome)

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header with category info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <CategoriaIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{categoriaNome}</h1>
            <p className="text-muted-foreground">
              {dadosEnhanced?.estatisticas.totalFornecedores || 0} fornecedores • 
              R$ {dadosEnhanced?.estatisticas.totalValor.toLocaleString('pt-BR') || '0'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {fonteInfo && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Info className="h-3 w-3" />
              {fonteInfo}
            </Badge>
          )}
          
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button 
            onClick={() => navigate({ to: '/gastos/fornecedores' })}
            variant="default"
            size="sm"
          >
            Ver Todos
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {dadosEnhanced && <StatisticsOverview dadosEnhanced={dadosEnhanced} />}

      {/* Risk Analysis */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análise da Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RiskAnalysis analytics={analytics} />
          </CardContent>
        </Card>
      )}

      {/* Main content tabs */}
      <Tabs defaultValue="fornecedores" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fornecedores">Fornecedores</TabsTrigger>
          <TabsTrigger value="top-performers">Top Performers</TabsTrigger>
          <TabsTrigger value="distribuicao">Distribuição</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Fornecedores Tab */}
        <TabsContent value="fornecedores" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros Avançados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">Buscar:</label>
                  <Input
                    placeholder="Nome ou CNPJ..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Porte:</label>
                  <Select value={filtroValor} onValueChange={(v: any) => setFiltroValor(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os portes</SelectItem>
                      <SelectItem value="pequenos">Pequenos (&lt; R$ 10k)</SelectItem>
                      <SelectItem value="medios">Médios (R$ 10k - R$ 100k)</SelectItem>
                      <SelectItem value="grandes">Grandes (&gt; R$ 100k)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ordenação:</label>
                  <Select value={ordenacao} onValueChange={(v: any) => setOrdenacao(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valor">Por valor</SelectItem>
                      <SelectItem value="transacoes">Por transações</SelectItem>
                      <SelectItem value="alfabetica">Alfabética</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Limite:</label>
                  <Input
                    type="number"
                    value={limite}
                    onChange={(e) => setLimite(parseInt(e.target.value) || 50)}
                    min={10}
                    max={500}
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-between">
                <Badge variant="outline">
                  {fornecedoresFiltrados.length} fornecedores filtrados
                </Badge>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBusca('')
                    setFiltroValor('todos')
                    setOrdenacao('valor')
                    setLimite(50)
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers List */}
          <div className="grid gap-4">
            {fornecedoresFiltrados.map((fornecedor, index) => (
              <Card key={fornecedor.cnpj || index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{fornecedor.nomeEleitoral}</h3>
                      <Badge variant="outline" className="text-xs">
                        {fornecedor.cnpj}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor Total:</span>
                        <div className="font-semibold text-green-600">
                          R$ {(fornecedor.totalRecebido || fornecedor.totalTransacionado || 0).toLocaleString('pt-BR')}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Transações:</span>
                        <div className="font-semibold">
                          {fornecedor.numeroTransacoes || fornecedor.transacoes || 0}
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-muted-foreground">Deputados:</span>
                        <div className="font-semibold">
                          {fornecedor.deputadosAtendidos?.length || 0}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Link
                      to="/gastos/fornecedor/$cnpj"
                      params={{ cnpj: fornecedor.cnpj.replace(/[^\d]/g, '') }}
                      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Perfil
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="top-performers" className="space-y-4">
          {dadosEnhanced?.estatisticas.top3Fornecedores.map((fornecedor, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? 'bg-yellow-100 text-yellow-600' :
                  index === 1 ? 'bg-gray-100 text-gray-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  {index + 1}°
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl">{fornecedor.nomeEleitoral}</h3>
                  <p className="text-muted-foreground">{fornecedor.cnpj}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {(fornecedor.totalRecebido || fornecedor.totalTransacionado || 0).toLocaleString('pt-BR')}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {((fornecedor.totalRecebido || fornecedor.totalTransacionado || 0) / (dadosEnhanced.estatisticas.totalValor) * 100).toFixed(1)}% do total
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribuicao" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Pequenos Fornecedores</CardTitle>
                <CardDescription>&lt; R$ 10.000</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {dadosEnhanced?.estatisticas.distribuicaoValores.pequenos || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Médios Fornecedores</CardTitle>
                <CardDescription>R$ 10.000 - R$ 100.000</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {dadosEnhanced?.estatisticas.distribuicaoValores.medios || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Grandes Fornecedores</CardTitle>
                <CardDescription>&gt; R$ 100.000</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dadosEnhanced?.estatisticas.distribuicaoValores.grandes || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas Calculadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Valor médio por fornecedor:</span>
                  <span className="font-semibold">
                    R$ {dadosEnhanced?.estatisticas.valorMedio.toLocaleString('pt-BR') || '0'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Concentração Top 3:</span>
                  <span className="font-semibold">
                    {dadosEnhanced?.estatisticas.concentracaoTop3.toFixed(1) || '0'}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Transações por fornecedor:</span>
                  <span className="font-semibold">
                    {dadosEnhanced?.estatisticas.mediaTransacaoPorFornecedor.toFixed(1) || '0'}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Informações da Fonte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Última atualização:</span>
                  <span className="font-semibold">
                    {ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleString('pt-BR') : 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Fonte dos dados:</span>
                  <span className="font-semibold">{fonteInfo || 'N/A'}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Cache válido:</span>
                  <Badge variant={temCacheValido ? 'default' : 'secondary'}>
                    {temCacheValido ? 'Sim' : 'Não'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default EnhancedCategoriaPage