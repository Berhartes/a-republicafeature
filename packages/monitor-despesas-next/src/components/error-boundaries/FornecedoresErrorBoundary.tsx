/**
 * Error Boundary específico para componentes de fornecedores
 * Captura erros de carregamento de dados, processamento e renderização
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string
}

export class FornecedoresErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Gera um ID único para o erro para facilitar o debugging
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log detalhado do erro
    console.error('🚨 [FornecedoresErrorBoundary] Erro capturado:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString()
    })

    this.setState({
      errorInfo
    })

    // Callback personalizado para logging externo
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log para debugging em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.group('🔍 Error Boundary Debug Info')
      console.error('Error:', error)
      console.error('Error Info:', errorInfo)
      console.error('Component Stack:', errorInfo.componentStack)
      console.groupEnd()
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/gastos/fornecedores'
  }

  private getErrorType(error: Error): 'data-load' | 'processing' | 'render' | 'network' | 'unknown' {
    const message = error.message.toLowerCase()
    
    if (message.includes('fetch') || message.includes('network') || message.includes('manifest')) {
      return 'network'
    }
    
    if (message.includes('cache') || message.includes('data') || message.includes('etl')) {
      return 'data-load'
    }
    
    if (message.includes('filter') || message.includes('process') || message.includes('calculate')) {
      return 'processing'
    }
    
    if (message.includes('render') || message.includes('component')) {
      return 'render'
    }
    
    return 'unknown'
  }

  private getErrorMessage(errorType: string): { title: string; description: string; suggestions: string[] } {
    switch (errorType) {
      case 'data-load':
        return {
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados dos fornecedores.',
          suggestions: [
            'Verifique sua conexão com a internet',
            'Aguarde alguns minutos e tente novamente',
            'Verifique se o processo ETL foi executado recentemente'
          ]
        }
      
      case 'processing':
        return {
          title: 'Erro no processamento',
          description: 'Ocorreu um erro ao processar os dados dos fornecedores.',
          suggestions: [
            'Os dados podem estar corrompidos ou incompletos',
            'Tente recarregar a página',
            'Entre em contato com o suporte se o problema persistir'
          ]
        }
      
      case 'network':
        return {
          title: 'Erro de conexão',
          description: 'Não foi possível conectar ao servidor de dados.',
          suggestions: [
            'Verifique sua conexão com a internet',
            'O servidor pode estar temporariamente indisponível',
            'Tente novamente em alguns minutos'
          ]
        }
      
      case 'render':
        return {
          title: 'Erro de renderização',
          description: 'Ocorreu um erro ao exibir os componentes.',
          suggestions: [
            'Tente recarregar a página',
            'Limpe o cache do navegador',
            'Use um navegador diferente se o problema persistir'
          ]
        }
      
      default:
        return {
          title: 'Erro inesperado',
          description: 'Ocorreu um erro inesperado na aplicação.',
          suggestions: [
            'Tente recarregar a página',
            'Verifique se há atualizações disponíveis',
            'Entre em contato com o suporte técnico'
          ]
        }
    }
  }

  render() {
    if (this.state.hasError) {
      // Se um fallback customizado foi fornecido, use-o
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorType = this.state.error ? this.getErrorType(this.state.error) : 'unknown'
      const errorMessage = this.getErrorMessage(errorType)

      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            {/* Ícone de erro */}
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-3">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>

            {/* Mensagem principal */}
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-gray-900">
                {errorMessage.title}
              </h2>
              <p className="text-gray-600">
                {errorMessage.description}
              </p>
            </div>

            {/* Sugestões */}
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h3 className="font-medium text-gray-900 mb-2">O que você pode fazer:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                {errorMessage.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </button>
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Página Inicial
              </button>
            </div>

            {/* Informações de debug (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && this.props.showDetails && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 flex items-center">
                  <Bug className="h-4 w-4 mr-1" />
                  Detalhes técnicos (desenvolvimento)
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-40">
                  <div className="space-y-2">
                    <div>
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div>
                      <strong>Tipo:</strong> {errorType}
                    </div>
                    <div>
                      <strong>Mensagem:</strong> {this.state.error?.message}
                    </div>
                    {this.state.error?.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="whitespace-pre-wrap text-xs mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Hook para usar o Error Boundary de forma mais simples
 */
export function useFornecedoresErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    console.error('🚨 [useFornecedoresErrorBoundary] Erro capturado:', error)
    setError(error)
  }, [])

  return {
    error,
    resetError,
    captureError,
    hasError: error !== null
  }
}

/**
 * Componente wrapper para facilitar o uso
 */
interface FornecedoresErrorWrapperProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

export function FornecedoresErrorWrapper({ 
  children, 
  fallback, 
  onError, 
  showDetails = false 
}: FornecedoresErrorWrapperProps) {
  return (
    <FornecedoresErrorBoundary 
      fallback={fallback} 
      onError={onError} 
      showDetails={showDetails}
    >
      {children}
    </FornecedoresErrorBoundary>
  )
}