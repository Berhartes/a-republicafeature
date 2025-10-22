import { useState, useEffect, useCallback, useMemo } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import { GlobalDataProvider } from '@/contexts/GlobalDataContext'
import { FornecedoresDataProvider } from '@/contexts/FornecedoresDataContext'
import { Navigation } from '@/components/Navigation'
import { BuscaGlobal } from '@/components/BuscaGlobal'
import { Toaster } from '@/components/ui/toaster'
import { useAccessibility } from '@/hooks/useAccessibility'

import '@/styles/globals.css'

type AppComponent = AppProps['Component']
type AppPageProps = AppProps['pageProps']

interface MonitorShellProps {
  Component: AppComponent
  pageProps: AppPageProps
}

function MonitorShell({ Component, pageProps }: MonitorShellProps) {
  const router = useRouter()
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<any>(null)

  const accessibilityOptions = useMemo(() => ({
    enableSkipLinks: true,
    enableTesting: true,
    testingMode: process.env.NODE_ENV === 'development' ? 'development' : 'always'
  }), [])

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

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('target') && event.reason?.stack?.includes('comlink')) {
        console.warn('🔧 [MonitorShell] Comlink error interceptado e ignorado')
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('storage', applyTheme)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  const navigateTo = useCallback((path: string) => {
    if (!path) return
    void router.push(path)
  }, [router])

  const handleSelectDeputado = useCallback((deputado: any) => {
    setDeputadoSelecionado(deputado)
    const deputadoId = deputado?.id || deputado?.codigo || deputado?.codigoDeputado || deputado?.deputadoId
    const destino = `/gastos/perfil/${deputadoId || 'geral'}`
    navigateTo(destino)
    screenReader.announceRouteChange(`Perfil do deputado ${deputado?.nomeEleitoral || deputadoId || ''}`)
  }, [navigateTo, screenReader])

  const handleSelectFornecedor = useCallback((fornecedor: any) => {
    const destino = fornecedor?.cnpj ? `/gastos/fornecedor/${encodeURIComponent(fornecedor.cnpj)}` : '/gastos/fornecedores'
    navigateTo(destino)
    screenReader.announceRouteChange('Navegando para fornecedores')
  }, [navigateTo, screenReader])

  const handleSelectAlerta = useCallback((alerta: any) => {
    navigateTo('/gastos/alertas')
    if (alerta?.deputadoId) {
      screenReader.announceRouteChange(`Alerta relacionado ao deputado ${alerta.deputadoId}`)
    } else {
      screenReader.announceRouteChange('Navegando para alertas')
    }
  }, [navigateTo, screenReader])

  return (
    <div className="min-h-screen bg-background">
      <Navigation deputadoSelecionado={deputadoSelecionado} />
      <main id="main-content" className="container mx-auto py-6">
        <Component {...pageProps} />
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

export default function App({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        retry: 3
      }
    }
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalDataProvider>
        <FornecedoresDataProvider autoLoad>
          <MonitorShell Component={Component} pageProps={pageProps} />
        </FornecedoresDataProvider>
      </GlobalDataProvider>
      <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
    </QueryClientProvider>
  )
}
