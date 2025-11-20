/**
 * Error Boundary específico para operações de carregamento de dados
 * Focado em erros de ETL, cache e conectividade
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Database, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'

interface Props {
  children: ReactNode
  onRetry?: () => void | Promise<void>
  retryText?: string
  showRetryButton?: boolean
}

interface State {
  hasError: boolean
  error: Error | null
  isRetrying: boolean
  retryCount: number
}

export class DataLoadingErrorBoundary extends Component<Props, State> {
  private maxRetries = 3

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      isRetrying: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log específico para erros de carregamento de dados
    console.error('🗄️ [DataLoadingErrorBoundary] Erro de carregamento:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    })

    // Detectar tipo de erro de dados
    const errorType = this.detectDataErrorType(error)
    console.error('📊 [DataLoadingErrorBoundary] Tipo de erro detectado:', errorType)
  }

  private detectDataErrorType(error: Error): 'etl-cache' | 'network' | 'manifest' | 'processing' | 'unknown' {
    const message = error.message.toLowerCase()
    
    if (message.includes('manifest') || message.includes('not found')) {
      return 'manifest'
    }
    
    if (message.includes('cache') || message.includes('etl') || message.includes('suppliers')) {
      return 'etl-cache'
    }
    
    if (message.includes('fetch') || message.includes('network') || message.includes('connection')) {
      return 'network'
    }
    
    if (message.includes('process') || message.includes('parse') || message.includes('transform')) {
      return 'processing'
    }
    
    return 'unknown'
  }

  private getErrorDetails(errorType: string) {
    switch (errorType) {
      case 'etl-cache':
        return {
          icon: Database,
          title: 'Cache ETL indisponível',
          description: 'Os dados processados não estão disponíveis no momento.',
          suggestions: [
            'O processo ETL pode não ter sido executado ainda',
            'Os dados podem estar sendo atualizados',
            'Verifique se há dados disponíveis para o período selecionado'
          ],
          canRetry: true
        }
      
      case 'manifest':
        return {
          icon: AlertCircle,
          title: 'Manifesto não encontrado',
          description: 'Não foi possível localizar o índice de dados.',
          suggestions: [
            'O sistema de dados pode estar sendo atualizado',
            'Aguarde alguns minutos e tente novamente',
            'Entre em contato com o suporte se o problema persistir'
          ],
          canRetry: true
        }
      
      case 'network':
        return {
          icon: WifiOff,
          title: 'Erro de conectividade',
          description: 'Não foi possível conectar ao servidor de dados.',
          suggestions: [
            'Verifique sua conexão com a internet',
            'O servidor pode estar temporariamente indisponível',
            'Tente novamente em alguns minutos'
          ],
          canRetry: true
        }
      
      case 'processing':
        return {
          icon: AlertCircle,
          title: 'Erro no processamento',
          description: 'Ocorreu um erro ao processar os dados carregados.',
          suggestions: [
            'Os dados podem estar em formato inesperado',
            'Pode haver inconsistências nos dados de origem',
            'Tente recarregar a página'
          ],
          canRetry: false
        }
      
      default:
        return {
          icon: AlertCircle,
          title: 'Erro de carregamento',
          description: 'Ocorreu um erro inesperado ao carregar os dados.',
          suggestions: [
            'Tente recarregar a página',
            'Verifique sua conexão com a internet',
            'Entre em contato com o suporte se necessário'
          ],
          canRetry: true
        }
    }
  }

  private handleRetry = async () => {
    if (this.state.retryCount >= this.maxRetries) {
      console.warn('🚫 [DataLoadingErrorBoundary] Máximo de tentativas atingido')
      return
    }

    this.setState({ isRetrying: true })

    try {
      // Executar callback de retry personalizado se fornecido
      if (this.props.onRetry) {
        await this.props.onRetry()
      }

      // Reset do estado de erro
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false,
        retryCount: this.state.retryCount + 1
      })

      console.log('✅ [DataLoadingErrorBoundary] Retry bem-sucedido')
    } catch (error) {
      console.error('❌ [DataLoadingErrorBoundary] Retry falhou:', error)
      
      this.setState({
        isRetrying: false,
        retryCount: this.state.retryCount + 1
      })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const errorType = this.detectDataErrorType(this.state.error)
      const errorDetails = this.getErrorDetails(errorType)
      const Icon = errorDetails.icon
      const canRetry = errorDetails.canRetry && this.state.retryCount < this.maxRetries
      const showRetryButton = this.props.showRetryButton !== false

      return (
        <div className="min-h-[300px] flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-6">
            {/* Ícone de erro */}
            <div className="flex justify-center">
              <div className="rounded-full bg-orange-100 p-3">
                <Icon className="h-8 w-8 text-orange-600" />
              </div>
            </div>

            {/* Mensagem principal */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {errorDetails.title}
              </h3>
              <p className="text-gray-600">
                {errorDetails.description}
              </p>
            </div>

            {/* Informações adicionais */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-orange-900 mb-2">Possíveis causas:</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                {errorDetails.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-400 mr-2">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contador de tentativas */}
            {this.state.retryCount > 0 && (
              <div className="text-sm text-gray-500">
                Tentativas: {this.state.retryCount}/{this.maxRetries}
              </div>
            )}

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {canRetry && showRetryButton && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className="flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isRetrying ? 'animate-spin' : ''}`} />
                  {this.state.isRetrying ? 'Tentando...' : (this.props.retryText || 'Tentar Novamente')}
                </button>
              )}
              
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar Página
              </button>
            </div>

            {/* Status de conectividade */}
            <div className="flex items-center justify-center text-sm text-gray-500">
              {navigator.onLine ? (
                <>
                  <Wifi className="h-4 w-4 mr-1 text-green-500" />
                  Conectado à internet
                </>
              ) : (
                <>
                  <WifiOff className="h-4 w-4 mr-1 text-red-500" />
                  Sem conexão com a internet
                </>
              )}
            </div>

            {/* Debug info em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Debug: {errorType} - {this.state.error.message}
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                  {this.state.error.stack}
                </pre>
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
 * Wrapper funcional para facilitar o uso
 */
interface DataLoadingErrorWrapperProps {
  children: ReactNode
  onRetry?: () => void | Promise<void>
  retryText?: string
  showRetryButton?: boolean
}

export function DataLoadingErrorWrapper({ 
  children, 
  onRetry, 
  retryText, 
  showRetryButton 
}: DataLoadingErrorWrapperProps) {
  return (
    <DataLoadingErrorBoundary 
      onRetry={onRetry} 
      retryText={retryText} 
      showRetryButton={showRetryButton}
    >
      {children}
    </DataLoadingErrorBoundary>
  )
}