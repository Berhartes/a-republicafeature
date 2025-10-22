
import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Rocket, Database, Trophy, Settings, TestTube, CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react'

import CategorySelector from '@/components/v4/CategorySelector'
import RankingDisplay from '@/components/v4/RankingDisplay'
import { useRankingPage } from '@/hooks/useSystemV4'

export default function SystemV4Demo() {
  const {
    isReady,
    isInitializing,
    initError,
    categories,
    stats,
    initialize,
    refresh,
    
    filters,
    
    ranking,
    rankingLoading,
    rankingError,
    reloadRanking
  } = useRankingPage()
  
  const [selectedYear, setSelectedYear] = useState<number>(2024)
  
  const availableYears = [2024, 2023, 2022, 2021, 2020]
  
  const handleCategorySelect = (categoryId: number | undefined) => {
    filters.setCategoryId(categoryId)
  }
  
  const handleYearSelect = (year: number) => {
    setSelectedYear(year)
    filters.setYear(year)
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Cabeçalho */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Rocket className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Sistema V4 - Demonstração</h1>
            <p className="text-muted-foreground">
              Nova arquitetura de categorias e rankings reformulada do zero
            </p>
          </div>
        </div>
        
        {/* Status do sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                {isReady ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : isInitializing ? (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">
                    Status: {isReady ? 'Pronto' : isInitializing ? 'Inicializando...' : 'Erro'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {categories.length} categorias ativas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="font-medium">Provedores</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.rankings.providersCount} registrados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <div>
                  <p className="font-medium">Cache</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.rankings.cacheSize} entradas
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Alertas de erro */}
      {initError && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro de Inicialização</AlertTitle>
          <AlertDescription>
            {initError}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={initialize}
            >
              Tentar Novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Conteúdo principal */}
      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="demo" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Demo
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Categorias
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <TestTube className="w-4 h-4" />
            Testes
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Demo - Funcionalidade principal */}
        <TabsContent value="demo" className="space-y-6">
          {!isReady ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Sistema Inicializando</AlertTitle>
              <AlertDescription>
                Aguarde a inicialização do sistema para usar a demonstração.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Controles de filtro */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Seletor de ano */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Selecionar Ano</CardTitle>
                    <CardDescription>
                      Escolha o ano para análise
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {availableYears.map(year => (
                        <Button
                          key={year}
                          variant={selectedYear === year ? 'default' : 'outline'}
                          onClick={() => handleYearSelect(year)}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground">
                      Ano selecionado: <strong>{selectedYear}</strong>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Seletor de categoria */}
                <div className="lg:col-span-2">
                  <CategorySelector
                    selectedCategoryId={filters.categoryId}
                    onCategorySelect={handleCategorySelect}
                    showAllOption={true}
                    size="md"
                    title="Selecionar Categoria"
                    description="Escolha uma categoria para filtrar o ranking"
                  />
                </div>
              </div>
              
              {/* Display do ranking */}
              <RankingDisplay
                ranking={ranking}
                loading={rankingLoading}
                error={rankingError}
                showSortControls={true}
                showSummaryStats={true}
                showDataQuality={true}
                cardSize="md"
                maxEntries={50}
              />
            </>
          )}
        </TabsContent>
        
        {/* Tab Categorias - Exploração das categorias */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Categorias Disponíveis</CardTitle>
              <CardDescription>
                {categories.length} categorias ativas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map(category => (
                  <Card key={category.id} className="border-2 hover:border-blue-300 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{category.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {category.displayName}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {category.code}
                          </p>
                          <div className="flex items-center gap-1 mt-2">
                            <Badge 
                              variant="secondary" 
                              className="text-xs"
                              style={{ backgroundColor: category.color, color: 'white' }}
                            >
                              ID: {category.id}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {category.aliases.length} aliases
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Testes - Validação do sistema */}
        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testes do Sistema</CardTitle>
              <CardDescription>
                Validação e diagnóstico do Sistema V4
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <TestTube className="h-4 w-4" />
                <AlertTitle>Testes Automatizados</AlertTitle>
                <AlertDescription>
                  Os testes automatizados serão implementados aqui para validar:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Conectividade com provedores de dados</li>
                    <li>Matching de categorias</li>
                    <li>Performance de rankings</li>
                    <li>Integridade do cache</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button variant="outline" className="h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Testar Categorias</div>
                    <div className="text-sm text-muted-foreground">
                      Validar matching e busca
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Testar Rankings</div>
                    <div className="text-sm text-muted-foreground">
                      Validar provedores e performance
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Testar Cache</div>
                    <div className="text-sm text-muted-foreground">
                      Validar cache e invalidação
                    </div>
                  </div>
                </Button>
                
                <Button variant="outline" className="h-auto p-4">
                  <div className="text-left">
                    <div className="font-medium">Benchmark</div>
                    <div className="text-sm text-muted-foreground">
                      Medir performance geral
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tab Configurações - Controles do sistema */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Controles e estatísticas avançadas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Estatísticas detalhadas */}
              <div>
                <h3 className="font-medium mb-3">Estatísticas Detalhadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">
                      {stats.categories.totalCategories}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Categorias
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      {stats.categories.activeCategories}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Ativas
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">
                      {stats.categories.totalAliases}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Aliases
                    </p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      {stats.rankings.providersCount}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Provedores
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Controles */}
              <div>
                <h3 className="font-medium mb-3">Controles</h3>
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={refresh} variant="outline">
                    Atualizar Dados
                  </Button>
                  <Button onClick={reloadRanking} variant="outline">
                    Recarregar Ranking
                  </Button>
                  <Button onClick={initialize} variant="outline">
                    Reinicializar Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
