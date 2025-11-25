"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { LayoutDashboard, AlertTriangle, FileText, Users, User, GitCompare, Settings, Building2, Brain, Trophy } from 'lucide-react'

import { NotificationCenter } from '@/components/ui/NotificationCenter'
import { cn } from '@/lib/utils'

interface MonitorNavigationProps {
  deputadoSelecionado?: any
}

/**
 * Cabeçalho de navegação para a nova área "monitor".
 * Separado do cabeçalho antigo ("/gastos") para permitir refatoração gradual de rotas.
 */
export function MonitorNavigation({ deputadoSelecionado }: MonitorNavigationProps) {
  const navItems = useMemo(
    () => (
      [
        { id: 'analise-avancada', label: 'Análise IA', icon: Brain, path: '/monitor/features/busca-avancada' },
        { id: 'deputados', label: 'Deputados', icon: Users, path: '/monitor/features/deputados' },
        { id: 'fornecedores', label: 'Fornecedores', icon: Building2, path: '/monitor/features/fornecedores' },
        { id: 'ranking', label: 'Ranking', icon: Trophy, path: '/monitor/features/ranking' },
        { id: 'premiacoes', label: 'Premiações', icon: Trophy, path: '/monitor/features/premiacoes' },
        { id: 'comparar', label: 'Comparar', icon: GitCompare, path: '/monitor/features/comparar' },
        { id: 'showcase', label: 'Showcase', icon: GitCompare, path: '/monitor/features/showcase' },
      ] as const
    ),
    [],
  )

  const pathname = usePathname() || '/'

  const normalizePath = (path: string) => path.split('?')[0]

  const isNavItemActive = (item: (typeof navItems)[number]) => {
    const normalizedPath = normalizePath(item.path)
    return pathname === normalizedPath
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center">
          <Link
            href="/"
            className={cn(
              'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-9 px-3',
              'text-muted-foreground hover:text-foreground hover:bg-accent',
            )}
          >
            <span aria-hidden="true">🔎</span>
            <span>Monitor Parlamentar</span>
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
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <NotificationCenter />

        </div>
      </div>
    </header>
  )
}



