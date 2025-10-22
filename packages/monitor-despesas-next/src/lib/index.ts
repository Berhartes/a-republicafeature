import {
  professionalLogger,
  logger_v2,
  createContextLogger,
  logRequest,
  logSystemStatus
} from './logger'
import type { LogContext, LogLevel } from './logger'
import {
  withRetry,
  retryOperation,
  retryCamaraAPI,
  classifyError,
  RetryableError,
  getRetryStats
} from './retry'
import type { RetryConfig } from './retry'
import {
  startMonitoring,
  stopMonitoring,
  recordMetric,
  startOperation as monitoringStartOperation,
  registerHealthCheck,
  getSystemStatus,
  printDashboard,
  monitoring
} from './monitoring'
import type { MonitoringSystem, Metric, HealthStatus, PerformanceMetrics } from './monitoring'
import {
  enhancedBatchProcessor,
  createBatchOperation,
  processDespesasBatch
} from './enhanced-batching'
import type { BatchOperation, BatchResult, EnhancedBatchProcessor, ValidationRule } from './enhanced-batching'
import { getEnvVar, isNodeEnvironment, safeProcess } from './runtime-env'

const runtimeProcess = safeProcess()
const nodeEnvironment = isNodeEnvironment()

const resolvedEnvironment = (getEnvVar('NODE_ENV') ?? getEnvVar('MODE') ?? 'development').toLowerCase()
const packageVersion = getEnvVar('npm_package_version', '1.0.0')

export function setupETLRobustness(config?: {
  enableMonitoring?: boolean
  logLevel?: LogLevel
  contextInfo?: LogContext
}): void {
  const {
    enableMonitoring = true,
    logLevel = 'info',
    contextInfo = {}
  } = config || {}

  professionalLogger.setContext({
    service: 'etl-camara',
    version: packageVersion,
    environment: resolvedEnvironment,
    ...contextInfo
  })

  professionalLogger.info('Sistema de robustez ETL inicializado', {
    enableMonitoring,
    logLevel,
    pid: runtimeProcess?.pid,
    nodeVersion: runtimeProcess?.version ?? 'browser'
  })

  if (enableMonitoring) {
    startMonitoring()

    registerHealthCheck('etl-system', async () => {
      if (!runtimeProcess?.memoryUsage) {
        return {
          component: 'etl-system',
          status: 'healthy',
          message: 'Monitoramento de memória indisponível neste ambiente',
          lastChecked: Date.now(),
          metrics: { supported: false }
        }
      }

      try {
        const usage = runtimeProcess.memoryUsage()
        const memoryPercent = usage.heapTotal > 0 ? usage.heapUsed / usage.heapTotal : 0
        const status = memoryPercent > 0.9 ? 'error' : memoryPercent > 0.7 ? 'warning' : 'healthy'
        const message = `Sistema ETL - Memória: ${(memoryPercent * 100).toFixed(1)}%`

        return {
          component: 'etl-system',
          status,
          message,
          lastChecked: Date.now(),
          metrics: {
            memoryPercent,
            heapUsed: usage.heapUsed,
            heapTotal: usage.heapTotal,
            uptime: runtimeProcess.uptime?.()
          }
        }
      } catch (error) {
        return {
          component: 'etl-system',
          status: 'warning',
          message: `Falha ao obter métricas de memória: ${error instanceof Error ? error.message : String(error)}`,
          lastChecked: Date.now(),
          metrics: { supported: false }
        }
      }
    })
  }
}

export function createRobustETLProcessor(name: string) {
  const logger = createContextLogger({ processor: name })
  const finishOperation = monitoringStartOperation(`etl_processor_${name}`)

  return {
    logger,

    async execute<T>(operation: () => Promise<T>, description: string, retryConfig?: RetryConfig): Promise<T> {
      const operationFinish = monitoringStartOperation(`${name}_${description}`)

      try {
        logger.info(`[INÍCIO] ${description}`)

        const result = await withRetry(operation, retryConfig, `${name}_${description}`)

        logger.info(`[SUCESSO] ${description}`)
        operationFinish(true)
        return result
      } catch (error) {
        logger.error(`[ERRO] ${description}`, error)
        operationFinish(false, error)
        throw error
      }
    },

    async processBatch<T>(
      data: T[],
      processor: (items: T[]) => Promise<BatchOperation<T>[]>,
      options?: {
        documentType?: string
        onProgress?: (processed: number, total: number) => void
      }
    ): Promise<BatchResult> {
      const operations = await processor(data)

      return enhancedBatchProcessor.processBatch(operations, {
        documentType: options?.documentType,
        onProgress: (processed, total) => {
          if (options?.onProgress) {
            options.onProgress(processed, total)
          }
          logger.progress(`${name}_batch`, processed, total, {
            documentType: options?.documentType
          })
        }
      })
    },

    finish(success: boolean = true, error?: unknown): void {
      if (success) {
        logger.info(`[CONCLUÍDO] Processador ${name} finalizado com sucesso`)
      } else {
        logger.error(`[FALHA] Processador ${name} falhou`, error)
      }

      finishOperation(success, error)
    }
  }
}

export function printSystemConfiguration(): void {
  const enableMetrics = getEnvVar('ENABLE_PERFORMANCE_METRICS', 'false') === 'true'
  const defaultRetries = getEnvVar('DEFAULT_RETRIES', '3')
  const batchSize = getEnvVar('_BATCH_SIZE', '500')
  const concurrency = getEnvVar('DEFAULT_CONCURRENCY', '3')
  const apiTimeout = getEnvVar('CAMARA_API_TIMEOUT', '30000')
  const logLevel = getEnvVar('LOG_LEVEL', 'info')

  console.log('🔧 CONFIGURAÇÃO DO SISTEMA DE ROBUSTEZ')
  console.log('='.repeat(60))
  console.log(`📊 Monitoramento: ${enableMetrics ? '✅ Habilitado' : '❌ Desabilitado'}`)
  console.log(`📝 Nível de Log: ${logLevel}`)
  console.log(`🔄 Retries Padrão: ${defaultRetries}`)
  console.log(`📦 Tamanho do Lote: ${batchSize}`)
  console.log(`🚀 Concorrência: ${concurrency}`)
  console.log(`⏱️ Timeout API: ${apiTimeout}ms`)
  console.log(`🌍 Ambiente: ${resolvedEnvironment}`)

  if (nodeEnvironment && runtimeProcess) {
    console.log(`🆔 PID: ${runtimeProcess.pid}`)
    console.log(`🟢 Uptime: ${typeof runtimeProcess.uptime === 'function' ? `${runtimeProcess.uptime().toFixed(2)}s` : 'N/A'}`)
  } else {
    console.log('🧭 Ambiente: Browser')
  }

  console.log('='.repeat(60))
}

export {
  professionalLogger,
  logger_v2,
  createContextLogger,
  logRequest,
  logSystemStatus,
  withRetry,
  retryOperation,
  retryCamaraAPI,
  classifyError,
  RetryableError,
  getRetryStats,
  startMonitoring,
  stopMonitoring,
  recordMetric,
  monitoringStartOperation as startOperation,
  registerHealthCheck,
  getSystemStatus,
  printDashboard,
  monitoring,
  enhancedBatchProcessor,
  createBatchOperation,
  processDespesasBatch
}

export type {
  LogContext,
  LogLevel,
  RetryConfig,
  Metric,
  HealthStatus,
  PerformanceMetrics,
  BatchOperation,
  BatchResult,
  EnhancedBatchProcessor,
  ValidationRule,
  MonitoringSystem
}
