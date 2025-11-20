"use client"

import React, { useMemo, useState } from "react"
import { cacheStrategy } from "@/lib/cache"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface CacheMetadata {
  fornecedores?: {
    totalFornecedores?: number
    anosDisponiveis?: number[]
    lastUpdate?: string
  }
  deputados?: {
    totalDeputados?: number
    totalGasto?: number
    anosDisponiveis?: number[]
    lastUpdate?: string
  }
}

export const CacheContext = React.createContext<{ metadata: CacheMetadata | null; stats: any } | null>(null)

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  metadata: CacheMetadata | null
  children: React.ReactNode
}

class InnerErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[DataErrorBoundary]", error, errorInfo)
  }

  reset = () => {
    this.setState({ hasError: false, error: null })
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      const err = this.state.error
      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Ocorreu um erro ao carregar os dados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-red-800">
              Tente novamente. Se o erro persistir, verifique mais detalhes abaixo.
            </p>
            <Button variant="default" onClick={this.reset}>
              Tentar novamente
            </Button>

            {/* Detalhes técnicos */}
            {err && (
              <details className="mt-4 whitespace-pre-wrap text-xs text-red-900">
                <summary className="cursor-pointer">Detalhes técnicos</summary>
                {err.message}
                {"\n\n"}
                {err.stack}
              </details>
            )}
          </CardContent>
        </Card>
      )
    }
    return this.props.children
  }
}

export function DataErrorBoundaryClient({ metadata, children }: ErrorBoundaryProps) {
  const [stats, setStats] = useState<any>(null)

  React.useEffect(() => {
    const controller = new AbortController()

    const fetchStats = async () => {
      try {
        const result = cacheStrategy.getStats?.()
        if (result && typeof (result as Promise<any>).then === 'function') {
          const s = await result
          if (!controller.signal.aborted) {
            setStats(s)
          }
        }
      } catch {
        // ignore
      }
    }

    fetchStats()
    return () => {
      controller.abort()
    }
  }, [])

  const value = useMemo(() => ({ metadata, stats }), [metadata, stats])

  return (
    <CacheContext.Provider value={value}>
      <InnerErrorBoundary metadata={metadata}>{children}</InnerErrorBoundary>
    </CacheContext.Provider>
  )
}
