import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, Users, Building2, Trophy, GitCompare, 
  Bell, FileText, Settings, Bug, Layers, Search,
  BarChart3, TrendingUp, Package, Home, Sparkles,
  Brain, Zap, Target
} from 'lucide-react'

interface PageLink {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  badge?: string
  badgeColor?: string
  category: 'principal' | 'perfil' | 'categoria' | 'sistema'
  gradient?: string
}

const pages: PageLink[] = [
  // Páginas Principais
  {
    title: 'Dashboard',
    description: 'Visão geral dos gastos parlamentares',
    href: '/gastos/dashboards',
    icon: <LayoutDashboard className="w-5 h-5" />,
    category: 'principal',
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    title: 'Análise IA',
    description: 'Análises inteligentes com IA',
    href: '/gastos/analise-ia',
    icon: <Brain className="w-5 h-5" />,
    badge: 'IA',
    badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
    category: 'principal',
    gradient: 'from-purple-500 to-pink-500'
  },
  {
    title: 'Deputados',
    description: 'Lista completa de deputados federais',
    href: '/gastos/deputados',
    icon: <Users className="w-5 h-5" />,
    category: 'principal',
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    title: 'Fornecedores',
    description: 'Empresas que prestam serviços',
    href: '/gastos/fornecedores',
    icon: <Building2 className="w-5 h-5" />,
    category: 'principal',
    gradient: 'from-orange-500 to-amber-500'
  },
  {
    title: 'Premiações',
    description: 'Sistema de troféus e medalhas',
    href: '/gastos/premiacoes',
    icon: <Trophy className="w-5 h-5" />,
    badge: '66',
    badgeColor: 'bg-gradient-to-r from-yellow-500 to-orange-500',
    category: 'principal',
    gradient: 'from-yellow-500 to-orange-500'
  },
  {
    title: 'Comparar',
    description: 'Compare gastos entre deputados',
    href: '/gastos/comparar',
    icon: <GitCompare className="w-5 h-5" />,
    category: 'principal',
    gradient: 'from-indigo-500 to-purple-500'
  },
  {
    title: 'Alertas',
    description: 'Notificações de gastos suspeitos',
    href: '/gastos/alertas',
    icon: <Bell className="w-5 h-5" />,
    badge: '42',
    badgeColor: 'bg-gradient-to-r from-red-500 to-pink-500',
    category: 'principal',
    gradient: 'from-red-500 to-pink-500'
  },
  {
    title: 'Relatórios',
    description: 'Relatórios e exportação de dados',
    href: '/gastos/relatorios',
    icon: <FileText className="w-5 h-5" />,
    category: 'principal',
    gradient: 'from-slate-500 to-gray-500'
  },
  
  // Páginas Especiais
  {
    title: 'Análise Avançada',
    description: 'Análises estatísticas e preditivas',
    href: '/gastos/analise-avancada',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'sistema',
    gradient: 'from-teal-500 to-cyan-500'
  },
  {
    title: 'Configurações',
    description: 'Configurações do sistema',
    href: '/gastos/configuracoes',
    icon: <Settings className="w-5 h-5" />,
    category: 'sistema',
    gradient: 'from-gray-500 to-slate-500'
  },
  {
    title: 'Debug',
    description: 'Ferramentas de debug e diagnóstico',
    href: '/gastos/debug',
    icon: <Bug className="w-5 h-5" />,
    badge: 'Dev',
    badgeColor: 'bg-gradient-to-r from-red-500 to-orange-500',
    category: 'sistema',
    gradient: 'from-red-500 to-orange-500'
  },
  {
    title: 'Sistema V4 Demo',
    description: 'Demonstração do novo sistema',
    href: '/gastos/sistema-v4-demo',
    icon: <Layers className="w-5 h-5" />,
    badge: 'V4',
    badgeColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
    category: 'sistema',
    gradient: 'from-blue-500 to-indigo-500'
  },
  {
    title: 'Processador de Deputados',
    description: 'Processamento em lote de dados',
    href: '/gastos/processador-deputados',
    icon: <Package className="w-5 h-5" />,
    badge: 'ETL',
    badgeColor: 'bg-gradient-to-r from-violet-500 to-purple-500',
    category: 'sistema',
    gradient: 'from-violet-500 to-purple-500'
  },
  {
    title: 'Showcase de Componentes',
    description: 'Visualize todos os componentes',
    href: '/gastos/dashboardcomponents',
    icon: <Sparkles className="w-5 h-5" />,
    badge: 'Novo',
    badgeColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
    category: 'sistema',
    gradient: 'from-pink-500 to-rose-500'
  },
]

export default function HomePage() {
  const principalPages = pages.filter(p => p.category === 'principal')
  const sistemaPages = pages.filter(p => p.category === 'sistema')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Hero Section - Apple-like */}
      <div className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span>Monitor de Gastos Parlamentares</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
                A República
              </span>
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                Brasileira
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto font-light">
              Transparência e análise inteligente dos gastos parlamentares brasileiros
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link 
                href="/gastos/dashboards"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
              >
                <Target className="w-5 h-5" />
                Explorar Dashboard
              </Link>
              
              <Link 
                href="/gastos/dashboardcomponents"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-gray-900 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200"
              >
                <Sparkles className="w-5 h-5" />
                Ver Componentes
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        
        {/* Páginas Principais */}
        <section className="space-y-8 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" />
            <h2 className="text-3xl font-bold text-gray-900">Páginas Principais</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {principalPages.map((page, index) => (
              <Link 
                key={page.href} 
                href={page.href}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full border-0 shadow-apple hover:shadow-apple-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${page.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${page.gradient} shadow-lg`}>
                        <div className="text-white">
                          {page.icon}
                        </div>
                      </div>
                      
                      {page.badge && (
                        <Badge className={`${page.badgeColor || 'bg-blue-500'} text-white border-0 shadow-md px-3 py-1`}>
                          {page.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {page.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-2">
                        {page.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Sistema e Desenvolvimento */}
        <section className="space-y-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full" />
            <h2 className="text-3xl font-bold text-gray-900">Sistema e Desenvolvimento</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sistemaPages.map((page, index) => (
              <Link 
                key={page.href} 
                href={page.href}
                className="group"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <Card className="h-full border-0 shadow-apple hover:shadow-apple-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br ${page.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                  
                  <CardHeader className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-2xl bg-gradient-to-br ${page.gradient} shadow-lg`}>
                        <div className="text-white">
                          {page.icon}
                        </div>
                      </div>
                      
                      {page.badge && (
                        <Badge className={`${page.badgeColor || 'bg-gray-500'} text-white border-0 shadow-md px-3 py-1`}>
                          {page.badge}
                        </Badge>
                      )}
                    </div>
                    
                    <div>
                      <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {page.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 mt-2">
                        {page.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Stats Section - Apple-like */}
        <section className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <Card className="border-0 shadow-apple-lg bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            <CardContent className="relative p-12">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="space-y-2">
                  <div className="text-5xl font-bold">513</div>
                  <div className="text-blue-100 font-medium">Deputados Federais</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-bold">8.507</div>
                  <div className="text-purple-100 font-medium">Registros Processados</div>
                </div>
                <div className="space-y-2">
                  <div className="text-5xl font-bold">66</div>
                  <div className="text-pink-100 font-medium">Premiações Ativas</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-xl mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-600">
            <p className="font-medium">Monitor de Gastos Parlamentares • A República Brasileira</p>
            <p className="text-sm mt-2">Transparência e análise inteligente dos gastos públicos</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

