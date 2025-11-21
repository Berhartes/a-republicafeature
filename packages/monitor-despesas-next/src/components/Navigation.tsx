"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { LayoutDashboard, AlertTriangle, FileText, Users, User, GitCompare, Settings, Building2, Brain, Trophy } from 'lucide-react'

import { NotificationCenter } from '@/components/NotificationCenter'
import { cn } from '@/lib/utils'

interface NavigationProps {
  deputadoSelecionado?: any
}

export function Navigation({ deputadoSelecionado }: NavigationProps) {
  const navItems = useMemo(
    () => (
      [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/gastos/dashboards' },
        { id: 'analise-avancada', label: 'Análise IA', icon: Brain, path: '/gastos/analise-avancada' },
        { id: 'deputados', label: 'Deputados', icon: Users, path: '/gastos/deputados' },
        { id: 'fornecedores', label: 'Fornecedores', icon: Building2, path: '/gastos/fornecedores' },
        { id: 'premiacoes', label: 'Premiações', icon: Trophy, path: '/gastos/premiacoes' },
        { id: 'comparar', label: 'Comparar', icon: GitCompare, path: '/gastos/comparar' },
        { id: 'alertas', label: 'Alertas', icon: AlertTriangle, path: '/gastos/relatorios?tab=alertas' },
        { id: 'relatorios', label: 'Relatórios', icon: FileText, path: '/gastos/relatorios?tab=relatorios' },
      ] as const
    ),
    [],
  )

  const pathname = usePathname() || '/'

  const perfilPathBase = '/gastos/perfil'
  const isPerfilActive = pathname.startsWith(perfilPathBase)

  const normalizePath = (path: string) => path.split('?')[0]

  const isNavItemActive = (item: (typeof navItems)[number]) => {
    const normalizedPath = normalizePath(item.path)
    return pathname === normalizedPath
  }

  const perfilLink = deputadoSelecionado
    ? `/gastos/perfil/${deputadoSelecionado.id}`
    : pathname.startsWith(perfilPathBase)
      ? pathname
      : '/gastos/perfil/geral'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="mr-4 flex items-center">
            <h1 className="text-lg font-semibold">Monitor de Gastos Parlamentares</h1>
          </Link>
          <nav className="flex items-center space-x-1 text-sm font-medium">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item)
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  prefetch={false}
                  className={cn(
                    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-3',
                    isActive
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}

            {(deputadoSelecionado || isPerfilActive) && (
              <Link
                href={perfilLink}
                prefetch={false}
                className={cn(
                  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-3',
                  isPerfilActive
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <User className="h-4 w-4" />
                {deputadoSelecionado?.nomeEleitoral || 'Perfil'}
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />
          <Link
            href="/gastos/configuracoes"
            prefetch={false}
            className={cn(
              'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 w-9',
              pathname === '/gastos/dashboards'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
            aria-label="Configurações"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
