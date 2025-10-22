
import {
  ParliamentaryError,
  ErrorCode,
  ErrorSeverity,
  ErrorCategory,
  ErrorFactory,
  ErrorContext,
  ErrorRecoveryStrategy,
  ErrorPredicates,
  BaseError,
  ErrorReportingConfig
} from './error-types.js'

interface ErrorHandlerConfig {
  enableReporting: boolean
  enableLogging: boolean
  enableUserNotifications: boolean
  maxRetries: number
  retryDelay: number // milliseconds
  reportingEndpoint?: string
  context?: ErrorContext
}

const defaultConfig: ErrorHandlerConfig = {
  enableReporting: true,
  enableLogging: true,
  enableUserNotifications: true,
  maxRetries: 3,
  retryDelay: 1000
}

interface ErrorStats {
  totalErrors: number
  errorsByCode: Record<ErrorCode, number>
  errorsBySeverity: Record<ErrorSeverity, number>
  errorsByCategory: Record<ErrorCategory, number>
  lastReset: number
}

export class ErrorHandler {
  private static config: ErrorHandlerConfig = defaultConfig
  private static stats: ErrorStats = {
    totalErrors: 0,
    errorsByCode: {} as Record<ErrorCode, number>,
    errorsBySeverity: {} as Record<ErrorSeverity, number>,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    lastReset: Date.now()
  }
  
  private static retryAttempts = new Map<string, number>()
  private static userNotificationQueue: ParliamentaryError[] = []

  static configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
    console.log('[ErrorHandler] Configured with:', this.config)
  }

  static async handle(error: unknown, context?: Partial<ErrorContext>): Promise<void> {
    try {
      const parliamentaryError = this.normalizeError(error, context)
      
      this.updateStats(parliamentaryError)
      
      if (this.config.enableLogging) {
        this.logError(parliamentaryError)
      }
      
      if (this.config.enableReporting && this.shouldReport(parliamentaryError)) {
        await this.reportError(parliamentaryError)
      }
      
      const recoveryStrategy = this.getRecoveryStrategy(parliamentaryError)
      if (recoveryStrategy.canRecover) {
        await this.attemptRecovery(parliamentaryError, recoveryStrategy)
      }
      
      if (this.config.enableUserNotifications && this.shouldNotifyUser(parliamentaryError)) {
        this.queueUserNotification(parliamentaryError)
      }
      
    } catch (handlerError) {
      console.error('[ErrorHandler] Error in error handler:', handlerError)
      console.error('[ErrorHandler] Original error:', error)
    }
  }

  static async handleWithRetry<T>(
    operation: () => Promise<T>,
    context?: Partial<ErrorContext>,
    maxRetries?: number
  ): Promise<T> {
    const retries = maxRetries || this.config.maxRetries
    let lastError: Error | null = null
    
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error as Error
        
        const parliamentaryError = this.normalizeError(error, context)
        
        if (!parliamentaryError.retryable || attempt > retries) {
          await this.handle(parliamentaryError, context)
          throw parliamentaryError
        }
        
        console.warn(`[ErrorHandler] Retry attempt ${attempt}/${retries} for:`, parliamentaryError.code)
        
        if (attempt <= retries) {
          await this.delay(this.config.retryDelay * attempt) // Exponential backoff
        }
      }
    }
    
    throw lastError
  }

  static getUserMessage(error: unknown): string {
    const parliamentaryError = this.normalizeError(error)
    return parliamentaryError.userMessage
  }

  static shouldNotifyUser(error: ParliamentaryError): boolean {
    if (error.severity === ErrorSeverity.LOW) {
      return false
    }
    
    if (error.category === ErrorCategory.VALIDATION) {
      return false
    }
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      return true
    }
    
    return ErrorPredicates.isNetworkError(error) && error.statusCode !== 404
  }

  private static normalizeError(
    error: unknown, 
    context?: Partial<ErrorContext>
  ): ParliamentaryError {
    if (this.isParliamentaryError(error)) {
      return { ...error, context: { ...error.context, ...context } }
    }
    
    if (error instanceof Error) {
      return ErrorFactory.createParliamentaryError(
        ErrorCode.UNKNOWN_ERROR,
        error.message,
        {
          stack: error.stack,
          context,
          technicalDetails: error.name
        }
      )
    }
    
    if (typeof error === 'string') {
      return ErrorFactory.createParliamentaryError(
        ErrorCode.UNKNOWN_ERROR,
        error,
        { context }
      )
    }
    
    return ErrorFactory.createParliamentaryError(
      ErrorCode.UNKNOWN_ERROR,
      'An unknown error occurred',
      {
        context: { ...context, originalError: String(error) },
        technicalDetails: `Unknown error type: ${typeof error}`
      }
    )
  }

  private static isParliamentaryError(error: unknown): error is ParliamentaryError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'severity' in error &&
      'category' in error &&
      'userMessage' in error &&
      'retryable' in error
    )
  }

  private static getRecoveryStrategy(error: ParliamentaryError): ErrorRecoveryStrategy {
    if (ErrorPredicates.isNetworkError(error)) {
      return {
        canRecover: error.retryable,
        retryAfter: Math.min(30, Math.pow(2, this.getRetryCount(error.code)))
      }
    }
    
    if (error.code === ErrorCode.AUTHENTICATION_ERROR) {
      return {
        canRecover: true,
        redirectUrl: '/login'
      }
    }
    
    if (error.code === ErrorCode.PERMISSION_DENIED) {
      return {
        canRecover: false,
        fallbackComponent: () => null // TODO: Create AccessDenied component
      }
    }
    
    if ([ErrorCode.DEPUTY_NOT_FOUND, ErrorCode.SUPPLIER_NOT_FOUND].includes(error.code)) {
      return {
        canRecover: false,
        fallbackComponent: () => null // TODO: Create NotFound component
      }
    }
    
    if (error.code === ErrorCode.CACHE_ERROR) {
      return {
        canRecover: true,
        recoveryAction: async () => {
          if (typeof window !== 'undefined') {
            localStorage.clear()
            sessionStorage.clear()
          }
        }
      }
    }
    
    return { canRecover: false }
  }

  private static async attemptRecovery(
    error: ParliamentaryError, 
    strategy: ErrorRecoveryStrategy
  ): Promise<void> {
    try {
      if (strategy.recoveryAction) {
        console.log(`[ErrorHandler] Attempting recovery for ${error.code}`)
        await strategy.recoveryAction()
      }
      
      if (strategy.redirectUrl && typeof window !== 'undefined') {
        window.location.href = strategy.redirectUrl
      }
      
    } catch (recoveryError) {
      console.error('[ErrorHandler] Recovery failed:', recoveryError)
    }
  }

  private static updateStats(error: ParliamentaryError): void {
    this.stats.totalErrors++
    this.stats.errorsByCode[error.code] = (this.stats.errorsByCode[error.code] || 0) + 1
    this.stats.errorsBySeverity[error.severity] = (this.stats.errorsBySeverity[error.severity] || 0) + 1
    this.stats.errorsByCategory[error.category] = (this.stats.errorsByCategory[error.category] || 0) + 1
  }

  private static logError(error: ParliamentaryError): void {
    const logData = {
      code: error.code,
      message: error.message,
      severity: error.severity,
      category: error.category,
      context: error.context,
      timestamp: new Date(error.timestamp).toISOString()
    }
    
    switch (error.severity) {
      case ErrorSeverity.LOW:
        console.info('[ErrorHandler]', logData)
        break
      case ErrorSeverity.MEDIUM:
        console.warn('[ErrorHandler]', logData)
        break
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        console.error('[ErrorHandler]', logData)
        break
    }
  }

  private static shouldReport(error: ParliamentaryError): boolean {
    if (error.severity === ErrorSeverity.LOW) {
      return false
    }
    
    if (error.category === ErrorCategory.VALIDATION) {
      return false
    }
    
    if (!this.config.reportingEndpoint) {
      return false
    }
    
    if (error.severity === ErrorSeverity.CRITICAL) {
      return true
    }
    
    return [ErrorCategory.SYSTEM, ErrorCategory.NETWORK].includes(error.category)
  }

  private static async reportError(error: ParliamentaryError): Promise<void> {
    if (!this.config.reportingEndpoint) {
      return
    }
    
    try {
      await fetch(this.config.reportingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          error,
          stats: this.stats,
          userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
          url: typeof window !== 'undefined' ? window.location.href : undefined
        })
      })
    } catch (reportingError) {
      console.error('[ErrorHandler] Failed to report error:', reportingError)
    }
  }

  private static queueUserNotification(error: ParliamentaryError): void {
    this.userNotificationQueue.push(error)
    
    if (this.userNotificationQueue.length > 10) {
      this.userNotificationQueue.shift()
    }
  }

  static getQueuedNotifications(): ParliamentaryError[] {
    return [...this.userNotificationQueue]
  }

  static clearNotificationQueue(): void {
    this.userNotificationQueue.length = 0
  }

  static getStats(): ErrorStats {
    return { ...this.stats }
  }

  static resetStats(): void {
    this.stats = {
      totalErrors: 0,
      errorsByCode: {} as Record<ErrorCode, number>,
      errorsBySeverity: {} as Record<ErrorSeverity, number>,
      errorsByCategory: {} as Record<ErrorCategory, number>,
      lastReset: Date.now()
    }
  }

  private static getRetryCount(code: ErrorCode): number {
    return this.retryAttempts.get(code) || 0
  }

  private static _incrementRetryCount(code: ErrorCode): void {
    const current = this.retryAttempts.get(code) || 0
    this.retryAttempts.set(code, current + 1)
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export const handleError = ErrorHandler.handle.bind(ErrorHandler)
export const handleWithRetry = ErrorHandler.handleWithRetry.bind(ErrorHandler)
export const getUserErrorMessage = ErrorHandler.getUserMessage.bind(ErrorHandler)

export default ErrorHandler