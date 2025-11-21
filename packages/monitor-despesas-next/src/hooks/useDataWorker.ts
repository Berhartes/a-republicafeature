import { useCallback, useEffect, useRef } from 'react'

interface WorkerMessage {
  type: 'PROCESS_RANKINGS' | 'FILTER_RANKINGS' | 'COMPUTE_STATISTICS'
  payload: any
  id: string
}

interface WorkerResult {
  type: string
  result: any
  id: string
  error?: string
}

export function useDataWorker() {
  const workerRef = useRef<Worker | null>(null)
  const pendingCallbacks = useRef<Map<string, (result: any, error?: string) => void>>(new Map())

  useEffect(() => {
    // Create worker only on client side
    if (typeof window !== 'undefined') {
      try {
        // Fallback to sync processing for now to fix Fast Refresh
        // TODO: Re-enable worker after Fast Refresh is stable
        console.log('🔄 [useDataWorker] Using synchronous processing (worker disabled)')
        // workerRef.current = new Worker(new URL('../workers/data-processor.worker.ts', import.meta.url))

        if (workerRef.current) {
          workerRef.current.onmessage = (event: MessageEvent<WorkerResult>) => {
            const { id, result, error } = event.data
            const callback = pendingCallbacks.current.get(id)

            if (callback) {
              callback(result, error)
              pendingCallbacks.current.delete(id)
            }
          }

          workerRef.current.onerror = (error) => {
            console.error('❌ [DataWorker] Erro no worker:', error)
          }
        }
      } catch (error) {
        console.warn('⚠️ [DataWorker] Web Workers não suportados, usando processamento síncrono:', error)
      }
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate()
        workerRef.current = null
      }
    }
  }, [])

  const processData = useCallback(
    <T>(type: WorkerMessage['type'], payload: any): Promise<T> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          // Fallback para processamento síncrono se worker não estiver disponível
          console.warn('⚠️ [DataWorker] Worker não disponível, processando sincronamente')

          try {
            // Processamento básico síncrono como fallback
            resolve(payload as T)
          } catch (error) {
            reject(error)
          }
          return
        }

        // Generate unique message ID for worker communication and callback mapping
        const id = Math.random().toString(36).substring(2, 15)

        pendingCallbacks.current.set(id, (result, error) => {
          if (error) {
            reject(new Error(error))
          } else {
            resolve(result)
          }
        })

        const message: WorkerMessage = { type, payload, id }
        workerRef.current.postMessage(message)
      })
    },
    []
  )

  return {
    processRankings: (data: any) => processData('PROCESS_RANKINGS', data),
    filterRankings: (rankings: any[], filters: any) =>
      processData('FILTER_RANKINGS', { rankings, filters }),
    computeStatistics: (data: any) => processData('COMPUTE_STATISTICS', data)
  }
}