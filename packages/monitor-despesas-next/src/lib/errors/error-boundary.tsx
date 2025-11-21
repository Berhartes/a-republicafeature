
import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ParliamentaryError, ErrorCode, ErrorSeverity, ErrorFactory } from './error-types'
import { ErrorHandler } from './error-handler'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  level?: 'page' | 'section' | 'component'
  onError?: (error: ParliamentaryError, errorInfo: ErrorInfo) => void
  resetKeys?: Array<string | number>
  resetOnPropsChange?: boolean
}

export interface ErrorFallbackProps {
  error: ParliamentaryError
  resetError: () => void
  level: 'page' | 'section' | 'component'
}

interface ErrorBoundaryState {
  hasError: boolean
  error: ParliamentaryError | null
  eventId?: string
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private _resetTimeoutId: number | undefined

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const parliamentaryError = ErrorFactory.createParliamentaryError(
      ErrorCode.COMPONENT_RENDER_ERROR,
      error.message,
      {
        severity: ErrorSeverity.HIGH,
        technicalDetails: `${error.name}: ${error.stack}`,
        context: {
          component: 'ErrorBoundary',
          action: 'render'
        }
      }
    )

    return {
      hasError: true,
      error: parliamentaryError
    }
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    if (this.state.error) {
      const enhancedError: ParliamentaryError = {
        ...this.state.error,
        context: {
          ...this.state.error.context,
          componentStack: errorInfo.componentStack,
          errorBoundary: this.props.level || 'component'
        }
      }

      ErrorHandler.handle(enhancedError)

      this.props.onError?.(enhancedError, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => key !== prevProps.resetKeys?.[idx])) {
        this.resetError()
      }
    }

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError()
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      eventId: undefined
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || this.getDefaultFallback()
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          level={this.props.level || 'component'}
        />
      )
    }

    return this.props.children
  }

  private getDefaultFallback(): React.ComponentType<ErrorFallbackProps> {
    switch (this.props.level) {
      case 'page':
        return PageErrorFallback
      case 'section':
        return SectionErrorFallback
      default:
        return ComponentErrorFallback
    }
  }
}

const PageErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
        <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 8.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <h1 className="text-xl font-bold text-gray-900 mb-2">
        Ops! Algo deu errado
      </h1>
      
      <p className="text-gray-600 mb-6">
        {error.userMessage}
      </p>
      
      <div className="space-y-3">
        <button
          onClick={resetError}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Tentar novamente
        </button>
        
        <button
          onClick={() => window.location.href = '/'}
          className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="text-sm text-gray-500 cursor-pointer">
            Detalhes técnicos (desenvolvimento)
          </summary>
          <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(error, null, 2)}
          </pre>
        </details>
      )}
    </div>
  </div>
)

const SectionErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="bg-red-50 border border-red-200 rounded-md p-4">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      
      <div className="ml-3 flex-1">
        <h3 className="text-sm font-medium text-red-800">
          Erro na seção
        </h3>
        <p className="mt-1 text-sm text-red-700">
          {error.userMessage}
        </p>
        
        <div className="mt-3">
          <button
            onClick={resetError}
            className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
          >
            Recarregar seção
          </button>
        </div>
      </div>
    </div>
  </div>
)

const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
    <div className="flex items-start">
      <div className="flex-shrink-0">
        <svg className="h-4 w-4 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      
      <div className="ml-2 flex-1">
        <p className="text-xs text-yellow-800">
          {error.userMessage}
        </p>
        
        <button
          onClick={resetError}
          className="mt-1 text-xs text-yellow-700 underline hover:text-yellow-900"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  </div>
)


export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="page"
    resetOnPropsChange
    onError={(error) => {
      console.error('[AppErrorBoundary] App-level error:', error)
    }}
  >
    {children}
  </ErrorBoundary>
)

export const RouteErrorBoundary: React.FC<{ children: ReactNode; route?: string }> = ({ 
  children, 
  route 
}) => (
  <ErrorBoundary
    level="page"
    resetKeys={route ? [route] : undefined}
    onError={(error) => {
      console.error(`[RouteErrorBoundary] Route error in ${route}:`, error)
    }}
  >
    {children}
  </ErrorBoundary>
)

export const FeatureErrorBoundary: React.FC<{ 
  children: ReactNode
  feature: string
  onError?: (error: ParliamentaryError) => void 
}> = ({ children, feature, onError }) => (
  <ErrorBoundary
    level="section"
    onError={(error) => {
      console.error(`[FeatureErrorBoundary] Feature error in ${feature}:`, error)
      onError?.(error)
    }}
  >
    {children}
  </ErrorBoundary>
)

export const ComponentErrorBoundary: React.FC<{ 
  children: ReactNode
  componentName?: string 
}> = ({ children, componentName }) => (
  <ErrorBoundary
    level="component"
    onError={(error) => {
      console.error(`[ComponentErrorBoundary] Component error in ${componentName}:`, error)
    }}
  >
    {children}
  </ErrorBoundary>
)

export const useThrowError = () => {
  return (error: Error | ParliamentaryError | string) => {
    if (typeof error === 'string') {
      throw new Error(error)
    }
    throw error
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}