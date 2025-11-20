'use client'

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { UIStateProvider } from '@/contexts/UIStateContext'
import { Navigation } from '@/components/Navigation'
import { MonitorNavigation } from '@/components/monitor/MonitorNavigation'
import { BuscaGlobal } from '@/components/BuscaGlobal'
import { Toaster } from '@/components/ui/toaster'
import { useAccessibility } from '@/hooks/useAccessibility'

function MonitorShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<any>(null)

  const accessibilityOptions = useMemo(
    () => ({
      enableSkipLinks: true,
      enableTesting: true,
      // Avoid referencing Node's `process` in client code to prevent polyfill/HMR issues
      // Determine development mode heuristically based on browser hostname
      testingMode:
        typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
          ? ('development' as const)
          : ('always' as const),
    }),
    [],
  )

  const { screenReader } = useAccessibility(accessibilityOptions)

  useEffect(() => {
    const applyTheme = () => {
      try {
        const configSalvas = typeof window !== 'undefined' ? localStorage.getItem('configuracoes') : null
        if (configSalvas) {
          const parsedConfig = JSON.parse(configSalvas)
          document.documentElement.classList.toggle('dark', Boolean(parsedConfig.temaEscuro))
        } else {
          document.documentElement.classList.remove('dark')
        }
      } catch (error) {
        console.warn('⚠️ [MonitorShell] Falha ao aplicar tema salvo:', error)
      }
    }

    applyTheme()
    window.addEventListener('storage', applyTheme)

    return () => {
      window.removeEventListener('storage', applyTheme)
    }
  }, [])

  const navigateTo = useCallback(
    (path: string) => {
      if (!path) return
      router.push(path)
    },
    [router],
  )

  const handleSelectDeputado = useCallback(
    (deputado: any) => {
      setDeputadoSelecionado(deputado)
      const deputadoId = deputado?.id || deputado?.codigo || deputado?.codigoDeputado || deputado?.deputadoId
      const destino = `/gastos/perfil/${deputadoId || 'geral'}`
      navigateTo(destino)
      screenReader.announceRouteChange(`Perfil do deputado ${deputado?.nomeEleitoral || deputadoId || ''}`)
    },
    [navigateTo, screenReader],
  )

  const handleSelectFornecedor = useCallback(
    (fornecedor: any) => {
      const destino = fornecedor?.cnpj ? `/gastos/fornecedor/${encodeURIComponent(fornecedor.cnpj)}` : '/gastos/fornecedores'
      navigateTo(destino)
      screenReader.announceRouteChange('Navegando para fornecedores')
    },
    [navigateTo, screenReader],
  )

  const handleSelectAlerta = useCallback(
    (alerta: any) => {
      navigateTo('/gastos/relatorios?tab=alertas')
      if (alerta?.deputadoId) {
        screenReader.announceRouteChange(`Alerta relacionado ao deputado ${alerta.deputadoId}`)
      } else {
        screenReader.announceRouteChange('Navegando para alertas')
      }
    },
    [navigateTo, screenReader],
  )

  return (
    <div className="font-sans min-h-screen bg-background">
      {pathname.startsWith('/monitor') ? (
        <MonitorNavigation deputadoSelecionado={deputadoSelecionado} />
      ) : (
        <Navigation deputadoSelecionado={deputadoSelecionado} />
      )}
      <main id="main-content" className="container mx-auto py-6">
        {children}
      </main>
      <BuscaGlobal
        onSelectDeputado={handleSelectDeputado}
        onSelectFornecedor={handleSelectFornecedor}
        onSelectAlerta={handleSelectAlerta}
      />
      <Toaster />
      <footer id="footer" className="sr-only">
        <p>Sistema de Gastos de Deputados</p>
      </footer>
    </div>
  )
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <UIStateProvider>
      <MonitorShell>{children}</MonitorShell>
    </UIStateProvider>
  )
}
