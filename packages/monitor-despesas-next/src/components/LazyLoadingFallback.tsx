/**
 * Loading fallback components for lazy-loaded modules
 * Provides consistent loading states across the application
 */

import { Loader2, FileText, BarChart3, Users, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface LazyLoadingFallbackProps {
  type?: 'page' | 'component' | 'chart' | 'table'
  message?: string | undefined
  className?: string | undefined
}

export function LazyLoadingFallback({ 
  type = 'component', 
  message,
  className = '' 
}: LazyLoadingFallbackProps) {
  const getIcon = () => {
    switch (type) {
      case 'page':
        return <FileText className="h-8 w-8 text-muted-foreground" />
      case 'chart':
        return <BarChart3 className="h-8 w-8 text-muted-foreground" />
      case 'table':
        return <Users className="h-8 w-8 text-muted-foreground" />
      default:
        return <Building2 className="h-8 w-8 text-muted-foreground" />
    }
  }

  const getMessage = () => {
    if (message) return message
    
    switch (type) {
      case 'page':
        return 'Carregando página...'
      case 'chart':
        return 'Carregando gráfico...'
      case 'table':
        return 'Carregando dados...'
      default:
        return 'Carregando componente...'
    }
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative">
          {getIcon()}
          <Loader2 className="h-4 w-4 animate-spin absolute -top-1 -right-1 text-primary" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {getMessage()}
          </p>
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Specialized loading fallbacks for different content types
 */

export function PageLoadingFallback({ message }: { message?: string | undefined }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LazyLoadingFallback type="page" message={message} className="min-h-[400px]" />
      </main>
    </div>
  )
}

export function ChartLoadingFallback({ message }: { message?: string | undefined }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
      </CardHeader>
      <CardContent>
        <LazyLoadingFallback type="chart" message={message} className="h-64" />
      </CardContent>
    </Card>
  )
}

export function TableLoadingFallback({ message }: { message?: string | undefined }) {
  return (
    <Card>
      <CardHeader>
        <div className="h-4 bg-muted rounded animate-pulse" />
        <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 border rounded">
              <div className="w-12 h-12 bg-muted rounded animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded animate-pulse" />
                <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
              </div>
              <div className="w-20 h-4 bg-muted rounded animate-pulse" />
            </div>
          ))}
        </div>
        <LazyLoadingFallback type="table" message={message} className="mt-4" />
      </CardContent>
    </Card>
  )
}

/**
 * Error boundary fallback for lazy loading failures
 */
export function LazyLoadingError({ 
  error, 
  retry 
}: { 
  error: Error
  retry?: () => void 
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-red-900">Erro ao carregar componente</h3>
              <p className="text-sm text-red-700">
                Falha ao carregar o módulo. Verifique sua conexão.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="text-xs text-red-600 mt-2">
                  <summary className="cursor-pointer">Detalhes do erro</summary>
                  <pre className="mt-2 p-2 bg-red-50 rounded text-left overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}
            </div>
            {retry && (
              <button
                onClick={retry}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}