import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorBoundaryAlertProps {
  error: string | null
  onClear: () => void
}

export function ErrorBoundaryAlert({ error, onClear }: ErrorBoundaryAlertProps) {
  if (!error) return null

  return (
    <Alert className="border-red-200 bg-red-50 mb-6">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div>
          <p className="font-medium text-red-800">Erro crítico do sistema</p>
          <p className="text-sm text-red-700">{error}</p>
          <Button 
            onClick={() => {
              onClear()
              window.location.reload()
            }} 
            variant="outline" 
            size="sm"
            className="mt-2"
          >
            Recarregar Página
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}