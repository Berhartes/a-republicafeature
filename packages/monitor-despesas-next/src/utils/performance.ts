// Performance monitoring utility

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private enabled: boolean

  constructor() {
    this.enabled = process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === 'true'
  }

  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    }

    this.metrics.set(name, metric)
    console.log(`⏱️ [Performance] Started: ${name}`)
  }

  end(name: string): number | null {
    if (!this.enabled) return null

    const metric = this.metrics.get(name)
    if (!metric) {
      console.warn(`⚠️ [Performance] Metric not found: ${name}`)
      return null
    }

    metric.endTime = performance.now()
    metric.duration = metric.endTime - metric.startTime

    console.log(
      `✅ [Performance] Completed: ${name} - ${metric.duration.toFixed(2)}ms`,
      metric.metadata ? metric.metadata : ''
    )

    return metric.duration
  }

  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata)
    const result = fn()
    this.end(name)
    return result
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata)
    const result = await fn()
    this.end(name)
    return result
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined)
  }

  clear(): void {
    this.metrics.clear()
  }

  report(): void {
    if (!this.enabled) return

    const completedMetrics = this.getMetrics()

    if (completedMetrics.length === 0) {
      console.log('📊 [Performance] No metrics to report')
      return
    }

    console.group('📊 [Performance Report]')

    completedMetrics
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .forEach(metric => {
        console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`)
      })

    const totalTime = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
    console.log(`Total measured time: ${totalTime.toFixed(2)}ms`)

    console.groupEnd()
  }
}

// Global performance monitor instance
export const perfMonitor = new PerformanceMonitor()

// Utility functions for common performance patterns
export function withPerformanceTracking<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    return perfMonitor.measure(name, () => fn(...args))
  }) as T
}

export function withAsyncPerformanceTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return ((...args: any[]) => {
    return perfMonitor.measureAsync(name, () => fn(...args))
  }) as T
}

// React performance hooks
export function usePerformanceTracking(name: string) {
  return {
    start: (metadata?: Record<string, any>) => perfMonitor.start(name, metadata),
    end: () => perfMonitor.end(name),
    measure: <T>(fn: () => T) => perfMonitor.measure(name, fn),
    measureAsync: <T>(fn: () => Promise<T>) => perfMonitor.measureAsync(name, fn)
  }
}

// Web Vitals monitoring
export function monitorWebVitals() {
  if (typeof window === 'undefined') return

  // Monitor First Contentful Paint
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
        console.log(`🎨 [Web Vitals] First Contentful Paint: ${entry.startTime.toFixed(2)}ms`)
      }

      if (entry.entryType === 'largest-contentful-paint') {
        console.log(`🖼️ [Web Vitals] Largest Contentful Paint: ${entry.startTime.toFixed(2)}ms`)
      }

      if (entry.entryType === 'first-input') {
        console.log(`👆 [Web Vitals] First Input Delay: ${(entry as any).processingStart - entry.startTime}ms`)
      }
    })
  })

  try {
    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input'] })
  } catch (error) {
    console.warn('⚠️ [Web Vitals] Performance Observer not supported')
  }
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('memory' in performance)) return

  const memory = (performance as any).memory
  console.log('💾 [Memory] Usage:', {
    used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
    limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
  })
}
