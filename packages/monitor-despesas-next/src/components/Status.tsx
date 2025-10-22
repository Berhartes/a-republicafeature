import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Database } from 'lucide-react'

interface StatusProps {
  loading?: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}

export function Status({ loading = false, error = null, onRetry, className = '' }: StatusProps) {
  if (!loading && !error) return null

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardContent className="flex items-center gap-3 p-4">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
        ) : (
          <Database className="h-5 w-5 text-blue-600" />
        )}
        <div className="flex-1">
          <p className="font-medium text-blue-800">
            {loading ? 'Carregando dados...' : 'Falha ao carregar dados'}
          </p>
          <p className="text-sm text-blue-700">
            {loading
              ? 'Processando informações do sistema'
              : error || 'Não foi possível carregar as informações.'}
          </p>
        </div>
        {onRetry && !loading && (
          <button
            type="button"
            onClick={onRetry}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
          >
            Tentar novamente
          </button>
        )}
      </CardContent>
    </Card>
  )
}

interface EmptyDataPlaceholderProps {
  title?: string
  description?: string
  className?: string
}

export function EmptyDataPlaceholder({
  title = 'Nenhum dado encontrado',
  description = 'Não há informações disponíveis para exibir.',
  className = ''
}: EmptyDataPlaceholderProps) {
  return (
    <Card className={`border-gray-200 ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Database className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="font-medium text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600 max-w-sm">{description}</p>
      </CardContent>
    </Card>
  )
}
