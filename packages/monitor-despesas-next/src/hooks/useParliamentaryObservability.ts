
import { useEffect, useRef, useState, useCallback } from 'react'
import { cacheStrategy } from '@/lib/cache'

interface PerformanceMetrics {
  dataLoadTime: number
  cacheHitRate: number
  workerProcessingTime: number
  
  renderTime: number
  interactionDelay: number
  memoryUsage: number
  
  deputadosCount: number
  processedCount: number
  errorCount: number
  
  cacheSize: number
  cacheMissCount: number
  cacheHitCount: number
}

interface ObservabilityEvent {
  type: 'data_load' | 'cache_hit' | 'cache_miss' | 'worker_start' | 'worker_complete' | 'error' | 'interaction'
  timestamp: number
  duration?: number
  metadata?: Record<string, any>
}

interface UseParliamentaryObservabilityOptions {
  enabled?: boolean
  sampleRate?: number // 0-1, percentage of events to track
  bufferSize?: number
  enablePerformanceObserver?: boolean
}

interface UseParliamentaryObservabilityReturn {
  metrics: PerformanceMetrics
  events: ObservabilityEvent[]
  
  trackDataLoad: (duration: number, source: 'cache' | '' | 'worker') => void
  trackInteraction: (type: string, duration?: number) => void
  trackError: (error: Error, context?: string) => void
  trackWorkerProcessing: (stage: 'start' | 'complete', duration?: number) => void
  
  getAverageLoadTime: () => number
  getCacheEfficiency: () => number
  getErrorRate: () => number
  
  clearMetrics: () => void
  exportMetrics: () => string
  isHealthy: () => boolean
}

export function useParliamentaryObservability(
  options: UseParliamentaryObservabilityOptions = {}
): UseParliamentaryObservabilityReturn {
  const {
    enabled = true,
    sampleRate = 1.0,
    bufferSize = 1000,
    enablePerformanceObserver = true
  } = options

  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    dataLoadTime: 0,
    cacheHitRate: 0,
    workerProcessingTime: 0,
    renderTime: 0,
    interactionDelay: 0,
    memoryUsage: 0,
    deputadosCount: 0,
    processedCount: 0,
    errorCount: 0,
    cacheSize: 0,
    cacheMissCount: 0,
    cacheHitCount: 0
  })

  const [events, setEvents] = useState<ObservabilityEvent[]>([])
  const eventBufferRef = useRef<ObservabilityEvent[]>([])
  const performanceObserverRef = useRef<PerformanceObserver | null>(null)
  const startTimesRef = useRef<Map<string, number>>(new Map())

  const shouldSample = useCallback(() => {
    return Math.random() < sampleRate
  }, [sampleRate])

  const addEvent = useCallback((event: ObservabilityEvent) => {
    if (!enabled || !shouldSample()) return

    eventBufferRef.current.push(event)
    
    if (eventBufferRef.current.length > bufferSize) {
      eventBufferRef.current = eventBufferRef.current.slice(-bufferSize)
    }
    
    setEvents([...eventBufferRef.current])
  }, [enabled, shouldSample, bufferSize])

  useEffect(() => {
    if (!enabled || !enablePerformanceObserver || !window.PerformanceObserver) return

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('parliamentary')) {
            addEvent({
              type: 'interaction',
              timestamp: entry.startTime,
              duration: entry.duration,
              metadata: { measureName: entry.name }
            })
          }
        }
      })

      observer.observe({ entryTypes: ['measure'] })
      performanceObserverRef.current = observer
    } catch (error) {
      console.warn('[useParliamentaryObservability] Performance Observer não suportado:', error)
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect()
      }
    }
  }, [enabled, enablePerformanceObserver, addEvent])

  useEffect(() => {
    if (!enabled) return

    const interval = setInterval(async () => {
      try {
        const memInfo = (performance as any).memory
        const memoryUsage = memInfo ? memInfo.usedJSHeapSize / 1024 / 1024 : 0 // MB

        const cacheStats = await cacheStrategy.getStats().catch(() => null)
        
        setMetrics(prev => ({
          ...prev,
          memoryUsage,
          cacheSize: cacheStats?.combined?.totalSize || 0,
          cacheHitCount: cacheStats?.memory?.hits || 0,
          cacheMissCount: cacheStats?.memory?.misses || 0,
          cacheHitRate: cacheStats?.combined?.hitRate || 0
        }))
      } catch (error) {
        console.warn('[useParliamentaryObservability] Erro ao coletar métricas:', error)
      }
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [enabled])

  const trackDataLoad = useCallback((duration: number, source: 'cache' | '' | 'worker') => {
    addEvent({
      type: source === 'cache' ? 'cache_hit' : 'data_load',
      timestamp: performance.now(),
      duration,
      metadata: { source }
    })

    setMetrics(prev => ({
      ...prev,
      dataLoadTime: (prev.dataLoadTime + duration) / 2, // Moving average
      cacheHitCount: source === 'cache' ? prev.cacheHitCount + 1 : prev.cacheHitCount,
      cacheMissCount: source !== 'cache' ? prev.cacheMissCount + 1 : prev.cacheMissCount
    }))
  }, [addEvent])

  const trackInteraction = useCallback((type: string, duration?: number) => {
    const now = performance.now()
    
    if (duration === undefined) {
      startTimesRef.current.set(type, now)
      performance.mark(`parliamentary-${type}-start`)
      return
    }

    const startTime = startTimesRef.current.get(type)
    const actualDuration = startTime ? now - startTime : duration
    
    performance.mark(`parliamentary-${type}-end`)
    performance.measure(`parliamentary-${type}`, `parliamentary-${type}-start`, `parliamentary-${type}-end`)

    addEvent({
      type: 'interaction',
      timestamp: now,
      duration: actualDuration,
      metadata: { interactionType: type }
    })

    setMetrics(prev => ({
      ...prev,
      interactionDelay: (prev.interactionDelay + actualDuration) / 2
    }))

    startTimesRef.current.delete(type)
  }, [addEvent])

  const trackError = useCallback((error: Error, context?: string) => {
    addEvent({
      type: 'error',
      timestamp: performance.now(),
      metadata: { 
        message: error.message,
        stack: error.stack,
        context 
      }
    })

    setMetrics(prev => ({
      ...prev,
      errorCount: prev.errorCount + 1
    }))
  }, [addEvent])

  const trackWorkerProcessing = useCallback((stage: 'start' | 'complete', duration?: number) => {
    if (stage === 'start') {
      addEvent({
        type: 'worker_start',
        timestamp: performance.now()
      })
    } else {
      addEvent({
        type: 'worker_complete',
        timestamp: performance.now(),
        duration
      })

      if (duration) {
        setMetrics(prev => ({
          ...prev,
          workerProcessingTime: (prev.workerProcessingTime + duration) / 2
        }))
      }
    }
  }, [addEvent])

  const getAverageLoadTime = useCallback(() => {
    const loadEvents = events.filter(e => e.type === 'data_load' && e.duration)
    if (loadEvents.length === 0) return 0
    
    return loadEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / loadEvents.length
  }, [events])

  const getCacheEfficiency = useCallback(() => {
    return metrics.cacheHitRate
  }, [metrics.cacheHitRate])

  const getErrorRate = useCallback(() => {
    const totalEvents = events.length
    const errorEvents = events.filter(e => e.type === 'error').length
    
    return totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0
  }, [events])

  const clearMetrics = useCallback(() => {
    setMetrics({
      dataLoadTime: 0,
      cacheHitRate: 0,
      workerProcessingTime: 0,
      renderTime: 0,
      interactionDelay: 0,
      memoryUsage: 0,
      deputadosCount: 0,
      processedCount: 0,
      errorCount: 0,
      cacheSize: 0,
      cacheMissCount: 0,
      cacheHitCount: 0
    })
    
    setEvents([])
    eventBufferRef.current = []
    startTimesRef.current.clear()
  }, [])

  const exportMetrics = useCallback(() => {
    const report = {
      metrics,
      events: eventBufferRef.current,
      summary: {
        averageLoadTime: getAverageLoadTime(),
        cacheEfficiency: getCacheEfficiency(),
        errorRate: getErrorRate(),
        totalEvents: events.length,
        timestamp: new Date().toISOString()
      }
    }
    
    return JSON.stringify(report, null, 2)
  }, [metrics, events, getAverageLoadTime, getCacheEfficiency, getErrorRate])

  const isHealthy = useCallback(() => {
    const errorRate = getErrorRate()
    const avgLoadTime = getAverageLoadTime()
    const cacheEfficiency = getCacheEfficiency()
    
    return (
      errorRate < 5 &&           // Less than 5% errors
      avgLoadTime < 5000 &&      // Less than 5 seconds average load
      (cacheEfficiency > 80 || metrics.cacheHitCount === 0) // Good cache efficiency or no cache usage yet
    )
  }, [getErrorRate, getAverageLoadTime, getCacheEfficiency, metrics.cacheHitCount])

  return {
    metrics,
    events,
    
    trackDataLoad,
    trackInteraction,
    trackError,
    trackWorkerProcessing,
    
    getAverageLoadTime,
    getCacheEfficiency,
    getErrorRate,
    
    clearMetrics,
    exportMetrics,
    isHealthy
  }
}

export function useBasicObservability() {
  return useParliamentaryObservability({
    enabled: true,
    sampleRate: 0.1, // Track only 10% of events
    bufferSize: 100,
    enablePerformanceObserver: false
  })
}

export type { PerformanceMetrics, ObservabilityEvent, UseParliamentaryObservabilityReturn }