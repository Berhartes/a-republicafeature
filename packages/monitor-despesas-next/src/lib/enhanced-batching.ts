import { withRetry, type RetryConfig } from './retry'
import { professionalLogger } from './logger'

export type ValidationRule<T = unknown> = (operation: BatchOperation<T>) => boolean

export interface BatchOperation<T = unknown> {
  id?: string
  description: string
  execute: () => Promise<T>
  retryConfig?: RetryConfig
  onSuccess?: (result: T) => void
  onError?: (error: unknown) => void
  validate?: ValidationRule<T>
}

export interface BatchResult {
  total: number
  succeeded: number
  failed: number
  durationMs: number
  errors: Array<{ description: string; error: unknown }>
}

export interface ProcessBatchOptions<T = unknown> {
  documentType?: string
  onProgress?: (processed: number, total: number, operation: BatchOperation<T>) => void
}

export function createBatchOperation<T>(operation: BatchOperation<T>): BatchOperation<T> {
  return operation
}

export async function processBatch<T>(
  operations: BatchOperation<T>[],
  options: ProcessBatchOptions<T> = {}
): Promise<BatchResult> {
  const start = Date.now()
  const result: BatchResult = {
    total: operations.length,
    succeeded: 0,
    failed: 0,
    durationMs: 0,
    errors: []
  }

  for (let index = 0; index < operations.length; index++) {
    const operation = operations[index]

    if (operation.validate && !operation.validate(operation)) {
      professionalLogger.warn('Batch operation skipped by validation rule', {
        description: operation.description,
        id: operation.id
      })
      options.onProgress?.(index + 1, operations.length, operation)
      continue
    }

    try {
      const executionResult = await withRetry(
        operation.execute,
        operation.retryConfig,
        operation.description
      )

      operation.onSuccess?.(executionResult)
      result.succeeded += 1
    } catch (error) {
      professionalLogger.error('Batch operation failed', {
        description: operation.description,
        id: operation.id,
        error
      })
      operation.onError?.(error)
      result.failed += 1
      result.errors.push({ description: operation.description, error })
    } finally {
      options.onProgress?.(index + 1, operations.length, operation)
    }
  }

  result.durationMs = Date.now() - start
  return result
}

export async function processDespesasBatch<T>(
  operations: BatchOperation<T>[],
  options: ProcessBatchOptions<T> = {}
): Promise<BatchResult> {
  return processBatch(operations, {
    documentType: options.documentType ?? 'despesas',
    onProgress: options.onProgress
  })
}

export const enhancedBatchProcessor = {
  processBatch
}

export type EnhancedBatchProcessor = typeof enhancedBatchProcessor
