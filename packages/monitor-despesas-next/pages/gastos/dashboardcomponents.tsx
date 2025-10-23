import Head from 'next/head'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  AlertCircle, CheckCircle, Info, XCircle, 
  Search, Filter, Download, Upload, 
  Settings, User, LogOut, Menu,
  Home, Users, Building2, Trophy, Bell,
  TrendingUp, TrendingDown, DollarSign,
  Calendar, Clock, MapPin, Phone, Mail,
  Star, Heart, Share2, Bookmark,
  ChevronLeft, ChevronRight, MoreVertical
} from 'lucide-react'
import { Loading } from '@/components/Loading'

export default function DashboardComponentsPage() {
  const [progress, setProgress] = useState(45)
  const [switchValue, setSwitchValue] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [checkboxValue, setCheckboxValue] = useState(false)

  return (
    <>
      <Head>
        <title>Showcase de Componentes - Monitor de Gastos</title>
      </Head>
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Showcase de Componentes</h1>
            <p className="text-muted-foreground">
              Visualize todos os componentes visuais disponíveis no projeto
            </p>
            <div className="flex gap-2 mt-4">
              <Badge>130+ Componentes</Badge>
              <Badge variant="secondary">shadcn/ui</Badge>
              <Badge variant="outline">Tailwind CSS</Badge>
            </div>
          </div>

          <Tabs defaultValue="ui" className="space-y-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ui">UI Base</TabsTrigger>
              <TabsTrigger value="cards">Cards & Stats</TabsTrigger>
              <TabsTrigger value="forms">Formulários</TabsTrigger>
              <TabsTrigger value="data">Dados & Tabelas</TabsTrigger>
              <TabsTrigger value="icons">Ícones</TabsTrigger>
            </TabsList>

            {/* UI Base Components */}
            <TabsContent value="ui" className="space-y-8">
              {/* Buttons */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Buttons</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Variações de Botões</CardTitle>
                    <CardDescription>Diferentes estilos e tamanhos de botões</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button>Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                      <Button size="icon"><Settings className="h-4 w-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button disabled>Disabled</Button>
                      <Button>
                        <Download className="mr-2 h-4 w-4" />
                        Com Ícone
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Badges */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Badges</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Badges e Tags</CardTitle>
                    <CardDescription>Indicadores visuais e etiquetas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                      <Badge variant="outline">Outline</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge className="bg-green-500">Ativo</Badge>
                      <Badge className="bg-yellow-500">Pendente</Badge>
                      <Badge className="bg-red-500">Inativo</Badge>
                      <Badge className="bg-blue-500">Novo</Badge>
                    </div>
                  </CardContent>
                </Card>
              </section>

              {/* Alerts */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Alerts</h2>
                <div className="space-y-4">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Informação</AlertTitle>
                    <AlertDescription>
                      Este é um alerta informativo padrão.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>
                      Ocorreu um erro ao processar sua solicitação.
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-green-500 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>Sucesso</AlertTitle>
                    <AlertDescription>
                      Operação realizada com sucesso!
                    </AlertDescription>
                  </Alert>
                  <Alert className="border-yellow-500 text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      Verifique os dados antes de continuar.
                    </AlertDescription>
                  </Alert>
                </div>
              </section>

              {/* Dialogs */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Dialogs & Modals</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Diálogos</CardTitle>
                    <CardDescription>Janelas modais e diálogos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>Abrir Dialog</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Título do Dialog</DialogTitle>
                          <DialogDescription>
                            Esta é uma descrição do dialog. Você pode adicionar qualquer conteúdo aqui.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p>Conteúdo do dialog...</p>
                          <Button>Confirmar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </section>

              {/* Dropdown Menu */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Dropdown Menus</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Menus Dropdown</CardTitle>
                    <CardDescription>Menus suspensos e contextuais</CardDescription>
                  </CardHeader>
                  <CardContent className="flex gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <Menu className="mr-2 h-4 w-4" />
                          Menu
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          Configurações
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <LogOut className="mr-2 h-4 w-4" />
                          Sair
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Duplicar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </section>

              {/* Progress */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Progress Bars</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Barras de Progresso</CardTitle>
                    <CardDescription>Indicadores de progresso e carregamento</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Progresso</span>
                        <span className="text-sm font-medium">{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Completo</span>
                        <span className="text-sm font-medium">100%</span>
                      </div>
                      <Progress value={100} />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Início</span>
                        <span className="text-sm font-medium">15%</span>
                      </div>
                      <Progress value={15} />
                    </div>
                    <Button onClick={() => setProgress(Math.min(progress + 10, 100))}>
                      Aumentar Progresso
                    </Button>
                  </CardContent>
                </Card>
              </section>

              {/* Loading */}
              <section>
                <h2 className="text-2xl font-bold mb-4">Loading States</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Estados de Carregamento</CardTitle>
                    <CardDescription>Indicadores de loading customizados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Loading />
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            {/* Cards & Stats */}
            <TabsContent value="cards" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Simples</CardTitle>
                      <CardDescription>Descrição do card</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Conteúdo do card...</p>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <CardTitle>Card com Borda</CardTitle>
                      <CardDescription>Destaque visual</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Card com borda colorida</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                      <CardTitle>Card Colorido</CardTitle>
                      <CardDescription className="text-primary-foreground/80">
                        Com fundo colorido
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p>Card com cor de fundo</p>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Stats Cards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Deputados</CardTitle>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold">513</p>
                            <span className="text-sm font-medium text-green-600">+5%</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-full bg-blue-100">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">Gastos Totais</CardTitle>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold">R$ 125.5M</p>
                            <span className="text-sm font-medium text-red-600">-12%</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-full bg-green-100">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">Fornecedores</CardTitle>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold">8.234</p>
                            <span className="text-sm font-medium text-green-600">+3%</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-full bg-purple-100">
                          <Building2 className="h-5 w-5 text-purple-600" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-medium text-muted-foreground">Alertas Ativos</CardTitle>
                          <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-2xl font-bold">42</p>
                            <span className="text-sm font-medium text-red-600">-8%</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-full bg-red-100">
                          <Bell className="h-5 w-5 text-red-600" />
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </section>



              <section>
                <h2 className="text-2xl font-bold mb-4">Cards com Ícones</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>Crescimento</CardTitle>
                          <CardDescription>+15.3%</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                          <TrendingDown className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>Redução</CardTitle>
                          <CardDescription>-8.2%</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-green-100 text-green-600">
                          <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle>Concluído</CardTitle>
                          <CardDescription>100%</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </div>
              </section>
            </TabsContent>

            {/* Forms */}
            <TabsContent value="forms" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Inputs</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Campos de Entrada</CardTitle>
                    <CardDescription>Diferentes tipos de inputs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="text">Texto</Label>
                      <Input id="text" placeholder="Digite algo..." />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="email@exemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input id="password" type="password" placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="search">Busca</Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input id="search" placeholder="Buscar..." className="pl-8" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="disabled">Desabilitado</Label>
                      <Input id="disabled" disabled placeholder="Campo desabilitado" />
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Select</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Seleção</CardTitle>
                    <CardDescription>Campos de seleção dropdown</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Selecione uma opção</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Escolha..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Opção 1</SelectItem>
                          <SelectItem value="2">Opção 2</SelectItem>
                          <SelectItem value="3">Opção 3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Switch & Checkbox</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Controles de Toggle</CardTitle>
                    <CardDescription>Switches e checkboxes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="switch" 
                        checked={switchValue}
                        onCheckedChange={setSwitchValue}
                      />
                      <Label htmlFor="switch">
                        Switch {switchValue ? 'Ativado' : 'Desativado'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="checkbox"
                        checked={checkboxValue}
                        onCheckedChange={(checked) => setCheckboxValue(checked as boolean)}
                      />
                      <Label htmlFor="checkbox">
                        Checkbox {checkboxValue ? 'Marcado' : 'Desmarcado'}
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Slider</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Controle Deslizante</CardTitle>
                    <CardDescription>Slider para valores numéricos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Valor: {sliderValue[0]}</Label>
                      </div>
                      <Slider
                        value={sliderValue}
                        onValueChange={setSliderValue}
                        max={100}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            {/* Data & Tables */}
            <TabsContent value="data" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Tables</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Tabela de Dados</CardTitle>
                    <CardDescription>Exemplo de tabela com dados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableCaption>Lista de deputados exemplo</TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Partido</TableHead>
                          <TableHead>UF</TableHead>
                          <TableHead className="text-right">Gastos</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">João Silva</TableCell>
                          <TableCell>PT</TableCell>
                          <TableCell>SP</TableCell>
                          <TableCell className="text-right">R$ 125.430,00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Maria Santos</TableCell>
                          <TableCell>PSDB</TableCell>
                          <TableCell>RJ</TableCell>
                          <TableCell className="text-right">R$ 98.250,00</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">Pedro Costa</TableCell>
                          <TableCell>MDB</TableCell>
                          <TableCell>MG</TableCell>
                          <TableCell className="text-right">R$ 156.890,00</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Data Lists</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Lista de Dados</CardTitle>
                    <CardDescription>Listas formatadas com dados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">Total de Deputados</p>
                            <p className="text-sm text-muted-foreground">Câmara dos Deputados</p>
                          </div>
                        </div>
                        <Badge>513</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-green-100">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">Gastos Totais</p>
                            <p className="text-sm text-muted-foreground">Último mês</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500">R$ 12.5M</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-blue-100">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">Fornecedores Ativos</p>
                            <p className="text-sm text-muted-foreground">Cadastrados</p>
                          </div>
                        </div>
                        <Badge variant="secondary">8.234</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>

            {/* Icons */}
            <TabsContent value="icons" className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Ícones Lucide</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Biblioteca de Ícones</CardTitle>
                    <CardDescription>Ícones mais utilizados no projeto</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {[
                        { icon: Home, label: 'Home' },
                        { icon: Users, label: 'Users' },
                        { icon: Building2, label: 'Building' },
                        { icon: Trophy, label: 'Trophy' },
                        { icon: Bell, label: 'Bell' },
                        { icon: Settings, label: 'Settings' },
                        { icon: Search, label: 'Search' },
                        { icon: Filter, label: 'Filter' },
                        { icon: Download, label: 'Download' },
                        { icon: Upload, label: 'Upload' },
                        { icon: TrendingUp, label: 'Trending Up' },
                        { icon: TrendingDown, label: 'Trending Down' },
                        { icon: DollarSign, label: 'Dollar' },
                        { icon: Calendar, label: 'Calendar' },
                        { icon: Clock, label: 'Clock' },
                        { icon: MapPin, label: 'Map Pin' },
                        { icon: Phone, label: 'Phone' },
                        { icon: Mail, label: 'Mail' },
                        { icon: Star, label: 'Star' },
                        { icon: Heart, label: 'Heart' },
                        { icon: Share2, label: 'Share' },
                        { icon: Bookmark, label: 'Bookmark' },
                        { icon: ChevronLeft, label: 'Chevron Left' },
                        { icon: ChevronRight, label: 'Chevron Right' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-accent transition-colors">
                          <Icon className="h-6 w-6" />
                          <span className="text-xs text-center">{label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Ícones de Status</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Indicadores de Estado</CardTitle>
                    <CardDescription>Ícones para feedback visual</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                        <CheckCircle className="h-8 w-8 text-green-500" />
                        <span className="text-sm font-medium">Sucesso</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                        <XCircle className="h-8 w-8 text-red-500" />
                        <span className="text-sm font-medium">Erro</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                        <AlertCircle className="h-8 w-8 text-yellow-500" />
                        <span className="text-sm font-medium">Atenção</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 p-4 border rounded-lg">
                        <Info className="h-8 w-8 text-blue-500" />
                        <span className="text-sm font-medium">Info</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}

