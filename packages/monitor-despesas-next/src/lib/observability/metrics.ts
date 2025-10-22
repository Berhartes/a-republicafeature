import { getEnvVar } from '../runtime-env'


const environmentMode = (getEnvVar('NODE_ENV') ?? getEnvVar('MODE') ?? 'development').toLowerCase()

export interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
  unit?: 'ms' | 'bytes' | 'count' | 'percentage' | 'ratio'
}

export interface TimingMetric extends PerformanceMetric {
  unit: 'ms'
  startTime: number
  endTime: number
  duration: number
}

export interface CounterMetric extends PerformanceMetric {
  unit: 'count'
  increment: number
}

export interface GaugeMetric extends PerformanceMetric {
  unit: 'bytes' | 'percentage' | 'ratio'
}

export enum MetricCategory {
  PAGE_LOAD = 'page_load',
  API_RESPONSE = 'api_response', 
  DATABASE_QUERY = 'database_query',
  RENDER_TIME = 'render_time',
  BUNDLE_SIZE = 'bundle_size',
  
  USER_ACTION = 'user_action',
  SEARCH_QUERY = 'search_query',
  NAVIGATION = 'navigation',
  ERROR_RATE = 'error_rate',
  
  DEPUTY_LOOKUP = 'deputy_lookup',
  SUPPLIER_ANALYSIS = 'supplier_analysis',
  TRANSACTION_PROCESSING = 'transaction_processing',
  RANKING_CALCULATION = 'ranking_calculation',
  
  MEMORY_USAGE = 'memory_usage',
  CACHE_HIT_RATIO = 'cache_hit_ratio',
  WORKER_PERFORMANCE = 'worker_performance'
}

interface MetricCollector {
  collect(metric: PerformanceMetric): void
  getMetrics(category?: MetricCategory): PerformanceMetric[]
  reset(): void
}

class MetricsCollector implements MetricCollector {
  private metrics: PerformanceMetric[] = []
  private timers = new Map<string, number>()
  private counters = new Map<string, number>()
  private maxMetrics = 10000 // Prevent memory leaks
  private isEnabled = true

  constructor() {
    this.setupPerformanceObserver()
    
    setInterval(() => this.cleanup(), 5 * 60 * 1000) // Every 5 minutes
  }

  collect(metric: PerformanceMetric): void {
    if (!this.isEnabled) return

    this.metrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    })

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics * 0.8) // Keep 80%
    }

    if (environmentMode === 'development') {
      console.debug(`[Metrics] ${metric.name}: ${metric.value}${metric.unit || ''}`, metric.tags)
    }
  }

  startTimer(name: string, tags?: Record<string, string>): () => void {
    const startTime = performance.now()
    const timerKey = `${name}_${JSON.stringify(tags || {})}`
    
    this.timers.set(timerKey, startTime)

    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      this.collect({
        name,
        value: duration,
        unit: 'ms',
        tags,
        timestamp: endTime
      } as TimingMetric)
      
      this.timers.delete(timerKey)
      return duration
    }
  }

  increment(name: string, tags?: Record<string, string>, value = 1): void {
    const counterKey = `${name}_${JSON.stringify(tags || {})}`
    const currentValue = this.counters.get(counterKey) || 0
    const newValue = currentValue + value
    
    this.counters.set(counterKey, newValue)
    
    this.collect({
      name,
      value: newValue,
      unit: 'count',
      tags,
      increment: value
    } as CounterMetric)
  }

  gauge(name: string, value: number, unit: GaugeMetric['unit'], tags?: Record<string, string>): void {
    this.collect({
      name,
      value,
      unit,
      tags
    } as GaugeMetric)
  }

  getMetrics(category?: MetricCategory): PerformanceMetric[] {
    if (!category) return [...this.metrics]
    
    return this.metrics.filter(metric => 
      metric.tags?.category === category
    )
  }

  getSummary(timeWindow = 60000): Record<string, any> {
    const now = Date.now()
    const recentMetrics = this.metrics.filter(
      metric => now - metric.timestamp <= timeWindow
    )

    const summary: Record<string, any> = {
      totalMetrics: recentMetrics.length,
      timeWindow,
      timestamp: now,
      categories: {}
    }

    const groupedMetrics = recentMetrics.reduce((groups, metric) => {
      if (!groups[metric.name]) {
        groups[metric.name] = []
      }
      groups[metric.name].push(metric)
      return groups
    }, {} as Record<string, PerformanceMetric[]>)

    Object.entries(groupedMetrics).forEach(([name, metrics]) => {
      const values = metrics.map(m => m.value)
      summary.categories[name] = {
        count: values.length,
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: values[values.length - 1],
        unit: metrics[0].unit || ''
      }
    })

    return summary
  }

  reset(): void {
    this.metrics = []
    this.counters.clear()
    this.timers.clear()
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {
      return
    }

    try {
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            
            this.collect({
              name: 'page_load_time',
              value: navEntry.loadEventEnd - navEntry.loadEventStart,
              unit: 'ms',
              timestamp: Date.now(),
              tags: { category: MetricCategory.PAGE_LOAD }
            })
            
            this.collect({
              name: 'dom_content_loaded',
              value: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              unit: 'ms',
              timestamp: Date.now(),
              tags: { category: MetricCategory.PAGE_LOAD }
            })
          }
        })
      })
      
      navObserver.observe({ entryTypes: ['navigation'] })

      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            
            this.collect({
              name: 'resource_load_time',
              value: resourceEntry.responseEnd - resourceEntry.requestStart,
              unit: 'ms',
              timestamp: Date.now(),
              tags: { 
                category: MetricCategory.API_RESPONSE,
                resource: resourceEntry.name.split('/').pop() || 'unknown'
              }
            })
          }
        })
      })
      
      resourceObserver.observe({ entryTypes: ['resource'] })

      const paintObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.collect({
            name: entry.name.replace('-', '_'),
            value: entry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
            tags: { category: MetricCategory.RENDER_TIME }
          })
        })
      })
      
      paintObserver.observe({ entryTypes: ['paint'] })

    } catch (error) {
      console.warn('[Metrics] Failed to setup PerformanceObserver:', error)
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const maxAge = 30 * 60 * 1000 // 30 minutes
    
    this.metrics = this.metrics.filter(
      metric => now - metric.timestamp <= maxAge
    )

    console.debug(`[Metrics] Cleanup completed. ${this.metrics.length} metrics retained.`)
  }
}

const metricsCollector = new MetricsCollector()

export const startTimer = metricsCollector.startTimer.bind(metricsCollector)
export const increment = metricsCollector.increment.bind(metricsCollector)
export const gauge = metricsCollector.gauge.bind(metricsCollector)
export const collect = metricsCollector.collect.bind(metricsCollector)
export const getMetrics = metricsCollector.getMetrics.bind(metricsCollector)
export const getSummary = metricsCollector.getSummary.bind(metricsCollector)
export const resetMetrics = metricsCollector.reset.bind(metricsCollector)
export const setMetricsEnabled = metricsCollector.setEnabled.bind(metricsCollector)

export const ParliamentaryMetrics = {
  trackDeputyLookup: (_deputyId: string, success: boolean) => {
    increment('deputy_lookup_total', { 
      category: MetricCategory.DEPUTY_LOOKUP,
      success: success.toString()
    })
  },

  trackSupplierAnalysis: (supplierId: string, duration: number) => {
    collect({
      name: 'supplier_analysis_duration',
      value: duration,
      unit: 'ms',
      tags: { 
        category: MetricCategory.SUPPLIER_ANALYSIS,
        supplierId 
      }
    })
  },

  trackTransactionProcessing: (count: number, duration: number) => {
    collect({
      name: 'transaction_processing_duration',
      value: duration,
      unit: 'ms',
      tags: { 
        category: MetricCategory.TRANSACTION_PROCESSING,
        count: count.toString()
      }
    })

    gauge('transactions_per_second', count / (duration / 1000), 'ratio', {
      category: MetricCategory.TRANSACTION_PROCESSING
    })
  },

  trackRankingCalculation: (type: string, deputyCount: number, duration: number) => {
    collect({
      name: 'ranking_calculation_duration',
      value: duration,
      unit: 'ms',
      tags: { 
        category: MetricCategory.RANKING_CALCULATION,
        type,
        deputyCount: deputyCount.toString()
      }
    })
  },

  trackWorkerPerformance: (workerName: string, taskDuration: number) => {
    collect({
      name: 'worker_task_duration',
      value: taskDuration,
      unit: 'ms',
      tags: { 
        category: MetricCategory.WORKER_PERFORMANCE,
        worker: workerName
      }
    })
  },

  trackCacheHit: (cacheType: string, hit: boolean) => {
    increment('cache_operations', { 
      category: MetricCategory.CACHE_HIT_RATIO,
      type: cacheType,
      result: hit ? 'hit' : 'miss'
    })
  },

  trackMemoryUsage: () => {
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in window.performance) {
      const memory = (window.performance as any).memory
      
      gauge('memory_used_bytes', memory.usedJSHeapSize, 'bytes', {
        category: MetricCategory.MEMORY_USAGE
      })
      
      gauge('memory_total_bytes', memory.totalJSHeapSize, 'bytes', {
        category: MetricCategory.MEMORY_USAGE
      })
      
      gauge('memory_usage_percentage', 
        (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100, 
        'percentage', {
          category: MetricCategory.MEMORY_USAGE
        }
      )
    }
  }
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    ParliamentaryMetrics.trackMemoryUsage()
  }, 30000)
}

export default metricsCollector
