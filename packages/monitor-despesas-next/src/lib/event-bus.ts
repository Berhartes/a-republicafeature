import { AlertaSuspeito, AnaliseDeputado, FornecedorSuspeito } from '@/types/gastos'

export interface AnaliseEventPayloads {
  'analysis:started': {
    totalRecords: number
    timestamp: number
  }
  
  'analysis:progress': {
    step: string
    progress: number
    processed: number
    total: number
    timestamp: number
  }
  
  'analysis:completed': {
    alertas: AlertaSuspeito[]
    deputadosAnalise: AnaliseDeputado[]
    fornecedoresSuspeitos: FornecedorSuspeito[]
    estatisticas: any
    duration: number
    timestamp: number
  }
  
  'analysis:error': {
    error: string
    stack?: string
    timestamp: number
  }
  
  'alert:found': {
    alert: AlertaSuspeito
    context?: any
    timestamp: number
  }
  
  'alert:batch': {
    alerts: AlertaSuspeito[]
    type: 'combustivel' | 'limite' | 'fornecedor' | 'temporal' | 'valor'
    count: number
    timestamp: number
  }
  
  'filter:applied': {
    filterType: string
    filterValue: any
    resultCount: number
    timestamp: number
  }
  
  'filter:cleared': {
    filterType?: string
    timestamp: number
  }
  
  'ui:loading': {
    component: string
    isLoading: boolean
    timestamp: number
  }
  
  'ui:notification': {
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
    timestamp: number
  }
}

export type EventListener<T extends keyof AnaliseEventPayloads> = (
  payload: AnaliseEventPayloads[T]
) => void | Promise<void>

class EventBus {
  private listeners: Record<string, Set<EventListener<any>>> = {}

  on<T extends keyof AnaliseEventPayloads>(
    event: T,
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners[event as string]) {
      this.listeners[event as string] = new Set()
    }

    this.listeners[event as string].add(listener as EventListener<any>)

    return () => {
      this.listeners[event as string]?.delete(listener as EventListener<any>)
      if (this.listeners[event as string]?.size === 0) {
        delete this.listeners[event as string]
      }
    }
  }

  once<T extends keyof AnaliseEventPayloads>(
    event: T,
    listener: EventListener<T>
  ): () => void {
    const unsubscribe = this.on(event, (payload) => {
      unsubscribe()
      return listener(payload)
    })

    return unsubscribe
  }

  emit<T extends keyof AnaliseEventPayloads>(
    event: T,
    payload: AnaliseEventPayloads[T]
  ): void {
    const listeners = this.listeners[event as string]

    if (!listeners || listeners.size === 0) {
      return
    }

    Promise.resolve().then(() => {
      listeners.forEach(async (listener) => {
        try {
          await listener(payload)
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error)
          
          if (event !== 'analysis:error' && event !== 'ui:notification') {
            this.emit('ui:notification', {
              type: 'error',
              title: 'Event Handler Error',
              message: `Error processing ${event} event`,
              timestamp: Date.now()
            })
          }
        }
      })
    })
  }

  off<T extends keyof AnaliseEventPayloads>(event: T): void {
    delete this.listeners[event]
  }

  clear(): void {
    this.listeners = {}
  }

  getListenerCount<T extends keyof AnaliseEventPayloads>(event?: T): number {
    if (event) {
      return this.listeners[event]?.size || 0
    }

    return Object.values(this.listeners).reduce(
      (total, listeners) => total + (listeners?.size || 0),
      0
    )
  }

  getActiveEvents(): (keyof AnaliseEventPayloads)[] {
    return Object.keys(this.listeners).filter(
      event => this.listeners[event as keyof AnaliseEventPayloads]?.size! > 0
    ) as (keyof AnaliseEventPayloads)[]
  }
}

export const eventBus = new EventBus()

import { useEffect, useCallback, useRef } from 'react'

export function useEventBus() {
  const busRef = useRef(eventBus)

  const emit = useCallback(<T extends keyof AnaliseEventPayloads>(
    event: T,
    payload: AnaliseEventPayloads[T]
  ) => {
    busRef.current.emit(event, payload)
  }, [])

  const on = useCallback(<T extends keyof AnaliseEventPayloads>(
    event: T,
    listener: EventListener<T>
  ) => {
    return busRef.current.on(event, listener)
  }, [])

  const once = useCallback(<T extends keyof AnaliseEventPayloads>(
    event: T,
    listener: EventListener<T>
  ) => {
    return busRef.current.once(event, listener)
  }, [])

  return { emit, on, once }
}

export function useEventListener<T extends keyof AnaliseEventPayloads>(
  event: T,
  listener: EventListener<T>
) {
  const { on } = useEventBus()

  useEffect(() => {
    const unsubscribe = on(event, listener)
    return unsubscribe
  }, [event, on, listener])
}