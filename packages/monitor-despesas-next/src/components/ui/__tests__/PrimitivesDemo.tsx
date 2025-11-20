/**
 * UI Primitives Demo Component
 * 
 * This component demonstrates all UI primitives with backup-compatible styling
 * for visual verification during the premiações migration.
 */

import { Crown, Trophy, Medal, Filter, Settings } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../tabs'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../card'
import { Button } from '../button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../select'
import { Badge } from '../badge'
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '../tooltip'
import { Alert, AlertTitle, AlertDescription } from '../alert'

export function PrimitivesDemo() {
  return (
    <TooltipProvider>
      <div className="p-8 space-y-8 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold mb-2">UI Primitives Compatibility Demo</h1>
          <p className="text-muted-foreground">
            Visual verification of all primitives required for premiações migration
          </p>
        </div>

        {/* Tabs Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Tabs Component</CardTitle>
            <CardDescription>
              Used for main navigation (Rankings/Premiações) and sub-tabs (Coroas/Troféus/Medalhas)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rankings">
              <TabsList>
                <TabsTrigger value="rankings">
                  <Filter className="h-4 w-4 mr-2" />
                  Rankings
                </TabsTrigger>
                <TabsTrigger value="premiacoes">
                  <Trophy className="h-4 w-4 mr-2" />
                  Premiações (45)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="rankings" className="mt-4">
                <p className="text-sm text-muted-foreground">Rankings content would go here</p>
              </TabsContent>
              <TabsContent value="premiacoes" className="mt-4">
                <Tabs defaultValue="coroas">
                  <TabsList>
                    <TabsTrigger value="coroas">
                      <Crown className="h-4 w-4 mr-2" />
                      Coroas (5)
                    </TabsTrigger>
                    <TabsTrigger value="trofeus">
                      <Trophy className="h-4 w-4 mr-2" />
                      Troféus (15)
                    </TabsTrigger>
                    <TabsTrigger value="medalhas">
                      <Medal className="h-4 w-4 mr-2" />
                      Medalhas (25)
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="coroas" className="mt-4">
                    <p className="text-sm text-muted-foreground">Coroas content</p>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Card Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
            <CardDescription>
              Used for filters, rankings, premiações display, and dashboard stats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Premiações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">45</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Deputados</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">513</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Coroas</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">5</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Button Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Button Component</CardTitle>
            <CardDescription>
              Used for filters, actions, and navigation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="default">
                <Settings className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
              <Button variant="outline">
                Escolher uma categoria
              </Button>
              <Button variant="ghost">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <Button variant="secondary">
                Ver mais +50 deputados
              </Button>
              <Button size="sm">Small Button</Button>
              <Button size="lg">Large Button</Button>
            </div>
          </CardContent>
        </Card>

        {/* Select Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Select Component</CardTitle>
            <CardDescription>
              Used for year, category, and UF filters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Ano</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os anos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os anos</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todas as categorias</SelectItem>
                    <SelectItem value="passagens">Passagens Aéreas</SelectItem>
                    <SelectItem value="combustivel">Combustível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">UF</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODAS">Todos os estados</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badge Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Badge Component</CardTitle>
            <CardDescription>
              Used for premiações indicators, categories, and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="default" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Crown className="h-3 w-3 mr-1" />
                    Coroa
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Campeão Geral 2025</p>
                  <p className="text-xs">Passagens Aéreas</p>
                  <p className="text-xs">R$ 1.234.567,89</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    Troféu
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">Campeão Anual 2024</p>
                  <p className="text-xs">Combustível</p>
                  <p className="text-xs">R$ 987.654,32</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="default" className="bg-orange-100 text-orange-800 border-orange-200">
                    <Medal className="h-3 w-3 mr-1" />
                    Medalha
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-semibold">2º Lugar - Categoria</p>
                  <p className="text-xs">Alimentação</p>
                  <p className="text-xs">R$ 456.789,01</p>
                </TooltipContent>
              </Tooltip>

              <Badge variant="secondary">2025</Badge>
              <Badge variant="outline">SP</Badge>
              <Badge variant="warning">+3 premiações</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Alert Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Component</CardTitle>
            <CardDescription>
              Used for loading states, errors, and status messages
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTitle>Carregando dados</AlertTitle>
              <AlertDescription>
                Carregando dados de deputados do Sistema ETL...
              </AlertDescription>
            </Alert>

            <Alert className="border-purple-200 bg-purple-50">
              <AlertTitle>Processando premiações</AlertTitle>
              <AlertDescription>
                Processando premiações e rankings...
              </AlertDescription>
            </Alert>

            <Alert className="border-orange-200 bg-orange-50">
              <AlertTitle>Erro ao carregar dados</AlertTitle>
              <AlertDescription>
                Não foi possível conectar ao Sistema ETL. Usando dados em cache.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Tooltip Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Tooltip Component</CardTitle>
            <CardDescription>
              Used for badge details and additional information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover for tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip with detailed information</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Admin Settings</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
