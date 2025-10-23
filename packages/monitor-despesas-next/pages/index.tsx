import Head from 'next/head'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, Users, Building2, Trophy, GitCompare, 
  Bell, FileText, Settings, Bug, Layers, Search,
  BarChart3, TrendingUp, Package, Home
} from 'lucide-react'

interface PageLink {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge?: string
  category: 'principal' | 'perfil' | 'categoria' | 'sistema'
}

const pages: PageLink[] = [
  // Páginas Principais
  {
    title: 'Dashboard',
    description: 'Visão geral dos gastos parlamentares',
    href: '/gastos/dashboards',
    icon: <LayoutDashboard className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Deputados',
    description: 'Lista completa de deputados federais',
    href: '/gastos/deputados',
    icon: <Users className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Fornecedores',
    description: 'Empresas que prestam serviços aos deputados',
    href: '/gastos/fornecedores',
    icon: <Building2 className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Fornecedores Modular',
    description: 'Versão modular da página de fornecedores',
    href: '/gastos/fornecedores-modular',
    icon: <Building2 className="w-5 h-5" />,
    badge: 'Modular',
    category: 'principal'
  },
  {
    title: 'Premiações',
    description: 'Sistema de troféus, coroas e medalhas',
    href: '/gastos/premiacoes',
    icon: <Trophy className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Premiações V2',
    description: 'Segunda versão do sistema de premiações',
    href: '/gastos/premiacoes2',
    icon: <Trophy className="w-5 h-5" />,
    badge: 'V2',
    category: 'principal'
  },
  {
    title: 'Comparar',
    description: 'Compare gastos entre deputados',
    href: '/gastos/comparar',
    icon: <GitCompare className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Alertas',
    description: 'Alertas e notificações de gastos suspeitos',
    href: '/gastos/alertas',
    icon: <Bell className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Relatórios',
    description: 'Relatórios detalhados e exportação de dados',
    href: '/gastos/relatorios',
    icon: <FileText className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Análise Avançada',
    description: 'Análises estatísticas e preditivas',
    href: '/gastos/analise-avancada',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'principal'
  },
  {
    title: 'Configurações',
    description: 'Configurações do sistema',
    href: '/gastos/configuracoes',
    icon: <Settings className="w-5 h-5" />,
    category: 'principal'
  },
  
  // Páginas de Sistema
  {
    title: 'Debug',
    description: 'Ferramentas de debug e diagnóstico',
    href: '/gastos/debug',
    icon: <Bug className="w-5 h-5" />,
    badge: 'Dev',
    category: 'sistema'
  },
  {
    title: 'Sistema V4 Demo',
    description: 'Demonstração do novo sistema de categorização',
    href: '/gastos/system-v4-demo',
    icon: <Layers className="w-5 h-5" />,
    badge: 'V4',
    category: 'sistema'
  },
  {
    title: 'Processador de Deputados',
    description: 'Processamento em lote de dados de deputados',
    href: '/gastos/processador-deputados',
    icon: <Package className="w-5 h-5" />,
    badge: 'ETL',
    category: 'sistema'
  },
  {
    title: 'Showcase de Componentes',
    description: 'Visualize todos os componentes do projeto',
    href: '/gastos/dashboardcomponents',
    icon: <BarChart3 className="w-5 h-5" />,
    badge: 'Novo',
    category: 'sistema'
  }
]

export default function HomePage() {
  const categorias = {
    principal: pages.filter(p => p.category === 'principal'),
    sistema: pages.filter(p => p.category === 'sistema')
  }

  return (
    <>
      <Head>
        <title>Monitor de Gastos Parlamentares - Início</title>
        <meta name="description" content="Sistema de monitoramento de gastos parlamentares da Câmara dos Deputados" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Home className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Monitor de Gastos Parlamentares
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sistema completo de análise e monitoramento de despesas da Câmara dos Deputados
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <Badge variant="secondary">23 Páginas</Badge>
              <Badge variant="secondary">130+ Componentes</Badge>
              <Badge variant="secondary">8.507 Deputados</Badge>
            </div>
          </div>

          {/* Páginas Principais */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Páginas Principais</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categorias.principal.map((page) => (
                <Link key={page.href} href={page.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {page.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{page.title}</CardTitle>
                          </div>
                        </div>
                        {page.badge && (
                          <Badge variant="outline" className="ml-2">
                            {page.badge}
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="mt-2">
                        {page.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Páginas Dinâmicas */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Páginas Dinâmicas</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Perfis de Deputados
                  </CardTitle>
                  <CardDescription>
                    Acesse o perfil detalhado de qualquer deputado
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">V1</Badge>
                      <code className="text-xs">/gastos/perfil/[deputadoId]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">V2</Badge>
                      <code className="text-xs">/gastos/perfil-v2/[deputadoId]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Modular</Badge>
                      <code className="text-xs">/gastos/perfil-modular/[deputadoId]</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Perfis de Fornecedores
                  </CardTitle>
                  <CardDescription>
                    Veja detalhes de fornecedores por CNPJ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">V1</Badge>
                      <code className="text-xs">/gastos/fornecedor/[cnpj]</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Modular</Badge>
                      <code className="text-xs">/gastos/fornecedor-modular/[cnpj]</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Categorias de Despesas
                  </CardTitle>
                  <CardDescription>
                    Análise por categoria de despesa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Deputados</Badge>
                      <code className="text-xs">/gastos/categorias/[categoria]</code>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Categorias de Fornecedores
                  </CardTitle>
                  <CardDescription>
                    Fornecedores agrupados por categoria
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Fornecedores</Badge>
                      <code className="text-xs">/gastos/fornecedores/categorias/[categoria]</code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Páginas de Sistema */}
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Sistema e Desenvolvimento</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categorias.sistema.map((page) => (
                <Link key={page.href} href={page.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer border-2 hover:border-primary/50">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {page.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{page.title}</CardTitle>
                            {page.badge && (
                              <Badge variant="outline" className="text-xs">
                                {page.badge}
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="text-xs mt-1">
                            {page.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground border-t pt-8">
            <p>Monitor de Gastos Parlamentares • A República Brasileira</p>
            <p className="mt-2">Sistema de monitoramento transparente de despesas públicas</p>
          </footer>
        </div>
      </div>
    </>
  )
}

