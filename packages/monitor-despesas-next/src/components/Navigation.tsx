import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { NotificationCenter } from '@/components/NotificationCenter'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, AlertTriangle, FileText, Users, User, GitCompare, Settings, Building2, Brain, Trophy, Cpu, ChevronDown, Database, Award } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'

interface NavigationProps {
  deputadoSelecionado?: any
}

export function Navigation({ deputadoSelecionado }: NavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/gastos/dashboards' },
    { id: 'analise-avancada', label: 'Análise IA', icon: Brain, path: '/gastos/analise-avancada' },
    { id: 'deputados', label: 'Deputados', icon: Users, path: '/gastos/deputados' },
    { id: 'fornecedores', label: 'Fornecedores', icon: Building2, path: '/gastos/fornecedores' },
    { id: 'premiacoes', label: 'Premiações', icon: Trophy, path: '/gastos/premiacoes' },
    { id: 'premiacoes2', label: 'Premiações 2', icon: Trophy, path: '/gastos/premiacoes2' },
    { id: 'comparar', label: 'Comparar', icon: GitCompare, path: '/gastos/comparar' },
    { id: 'alertas', label: 'Alertas', icon: AlertTriangle, path: '/gastos/alertas' },
    { id: 'relatorios', label: 'Relatórios', icon: FileText, path: '/gastos/relatorios' },
  ] as const

  const processadorItems = [
    { id: 'processador-transacoes', label: 'Transações', icon: Cpu, path: '/gastos/processador-transacoes' },
    { id: 'processador-fornecedores', label: 'Fornecedores', icon: Building2, path: '/gastos/processador-fornecedores' },
    { id: 'processador-premiacoes', label: 'Premiações', icon: Award, path: '/gastos/processador-premiacoes' },
  ] as const

  const routerState = useRouterState()
  const pathname = routerState.location.pathname

  const perfilPathBase = '/gastos/perfil'
  const isPerfilActive = pathname.startsWith(perfilPathBase)

  const isProcessadorActive = pathname.startsWith('/gastos/processador')
  const activeProcessador = processadorItems.find(item => pathname === item.path)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="mr-4 flex items-center">
            <h1 className="text-lg font-semibold">Monitor de Gastos Parlamentares</h1>
          </Link>
          <nav className="flex items-center space-x-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Button key={item.id} size="sm" asChild variant="ghost">
                  <Link
                    to={item.path}
                    className="flex items-center gap-2"
                    activeProps={{ className: cn('bg-primary text-primary-foreground font-semibold') }}
                    inactiveProps={{ className: cn('text-muted-foreground hover:text-foreground hover:bg-accent') }}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              )
            })}

            {/* Dropdown para Processadores */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant={isProcessadorActive ? "default" : "ghost"} className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  {activeProcessador ? `Processador • ${activeProcessador.label}` : 'Processador'}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {processadorItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <DropdownMenuItem key={item.id} asChild>
                      <Link to={item.path} className="flex items-center gap-2 w-full">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {(deputadoSelecionado || isPerfilActive) && (
              <Button size="sm" asChild variant={isPerfilActive ? "default" : "ghost"}>
                <Link
                  to={deputadoSelecionado ? `/gastos/perfil/${deputadoSelecionado.id}` : (pathname.startsWith(perfilPathBase) ? pathname : '/gastos/perfil/geral')}
                  className="flex items-center gap-2"
                  activeProps={{ className: cn('bg-primary text-primary-foreground font-semibold') }}
                  inactiveProps={{ className: cn('text-muted-foreground hover:text-foreground hover:bg-accent') }}
                >
                  <User className="h-4 w-4" />
                  {deputadoSelecionado?.nomeEleitoral || 'Perfil'}
                </Link>
              </Button>
            )}
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Button size="icon" asChild variant="ghost">
            <Link
              to="/gastos/configuracoes"
              className="flex items-center justify-center w-full h-full" // Para garantir que o ícone preencha o botão
              activeProps={{ className: cn('bg-primary text-primary-foreground') }}
              inactiveProps={{ className: cn('text-muted-foreground hover:text-foreground hover:bg-accent') }}
              title="Configurações"
              aria-label="Ir para configurações"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
