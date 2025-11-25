'use client'

import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

import { UIStateProvider } from '@/contexts/UIStateContext'
import { MonitorNavigation } from '@/features/MonitorNavigation'
import { GlobalSearchModal } from '@/features/search/GlobalSearchModal'
import { Toaster } from '@/components/ui/toaster'

function MonitorShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname() || '/'
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<any>(null)

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
      const destino = `/monitor/features/perfil/${deputadoId || 'geral'}`
      navigateTo(destino)
    },
    [navigateTo],
  )

  const handleSelectFornecedor = useCallback(
    (fornecedor: any) => {
      const destino = fornecedor?.cnpj ? `/monitor/features/fornecedor/${encodeURIComponent(fornecedor.cnpj)}` : '/monitor/features/fornecedores'
      navigateTo(destino)
    },
    [navigateTo],
  )

  const handleSelectAlerta = useCallback(
    (alerta: any) => {
      navigateTo('/monitor/features/relatorios?tab=alertas')
    },
    [navigateTo],
  )

  return (
    <div className="font-sans min-h-screen bg-background">
      <MonitorNavigation deputadoSelecionado={deputadoSelecionado} />
      <main id="main-content" className="container mx-auto py-6">
        {children}
      </main>
      <GlobalSearchModal
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
