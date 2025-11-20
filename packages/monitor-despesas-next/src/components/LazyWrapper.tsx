/**
 * Higher-order component for wrapping lazy-loaded components
 * Provides consistent error boundaries and loading states
 */

import { Suspense, ComponentType, ReactNode, useState, useEffect } from 'react'
import { ComponentErrorBoundary } from '@/lib/errors/error-boundary'
import { LazyLoadingFallback, LazyLoadingError, PageLoadingFallback, ChartLoadingFallback, TableLoadingFallback } from './LazyLoadingFallback'

interface LazyWrapperProps {
  children: ReactNode
  fallbackType?: 'page' | 'component' | 'chart' | 'table'
  fallbackMessage?: string | undefined
  className?: string | undefined
  onError?: (error: Error, errorInfo: { componentStack: string }) => void
}

export function LazyWrapper({
  children,
  fallbackType = 'component',
  fallbackMessage,
  className,
  onError
}: LazyWrapperProps) {
  // Prevent hydration mismatch by only rendering Suspense on client
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getFallbackComponent = () => {
    switch (fallbackType) {
      case 'page':
        return <PageLoadingFallback message={fallbackMessage} />
      case 'chart':
        return <ChartLoadingFallback message={fallbackMessage} />
      case 'table':
        return <TableLoadingFallback message={fallbackMessage} />
      default:
        return <LazyLoadingFallback type={fallbackType} message={fallbackMessage} className={className} />
    }
  }

  const handleError = (error: Error, errorInfo: { componentStack: string }) => {
    console.error('LazyWrapper: Component loading failed', error, errorInfo)
    onError?.(error, errorInfo)
  }

  // Show fallback during SSR and before mount
  if (!isMounted) {
    return getFallbackComponent()
  }

  return (
    <ComponentErrorBoundary componentName="LazyWrapper">
      <Suspense 
        fallback={getFallbackComponent()}
      >
        {children}
      </Suspense>
    </ComponentErrorBoundary>
  )
}

/**
 * Higher-order component factory for creating lazy-wrapped components
 */
export function withLazyWrapper<P extends object>(
  Component: ComponentType<P>,
  options: {
    fallbackType?: 'page' | 'component' | 'chart' | 'table'
    fallbackMessage?: string
    className?: string
    displayName?: string
  } = {}
) {
  const WrappedComponent = (props: P) => (
    <LazyWrapper
      fallbackType={options.fallbackType}
      fallbackMessage={options.fallbackMessage}
      className={options.className}
    >
      <Component {...props} />
    </LazyWrapper>
  )

  WrappedComponent.displayName = options.displayName || `LazyWrapped(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

/**
 * Specialized wrappers for common use cases
 */

export function LazyPageWrapper({ children, message }: { children: ReactNode, message?: string | undefined }) {
  return (
    <LazyWrapper fallbackType="page" fallbackMessage={message}>
      {children}
    </LazyWrapper>
  )
}

export function LazyChartWrapper({ children, message }: { children: ReactNode, message?: string | undefined }) {
  return (
    <LazyWrapper fallbackType="chart" fallbackMessage={message}>
      {children}
    </LazyWrapper>
  )
}

export function LazyTableWrapper({ children, message }: { children: ReactNode, message?: string | undefined }) {
  return (
    <LazyWrapper fallbackType="table" fallbackMessage={message}>
      {children}
    </LazyWrapper>
  )
}