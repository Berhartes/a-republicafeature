import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Alert className="max-w-4xl mx-auto border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong>Algo deu errado</strong>
                <div className="text-sm text-red-700 mt-1">
                  {this.state.error?.message || 'Erro inesperado na aplicação'}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={this.handleReset}>
                <RefreshCw className="w-3 h-3 mr-1" />
                Tentar Novamente
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary