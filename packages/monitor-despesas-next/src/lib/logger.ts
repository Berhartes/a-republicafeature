export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

function getEnvLevel(): LogLevel {
  const raw = process.env.NEXT_PUBLIC_LOG_LEVEL?.toLowerCase()
  if (raw === 'debug' || raw === 'info' || raw === 'warn' || raw === 'error') return raw
  return process.env.NODE_ENV === 'production' ? 'info' : 'debug'
}

const CURRENT_LEVEL = getEnvLevel()

function formatMessage(ns: string | undefined, level: LogLevel, args: unknown[]): unknown[] {
  const ts = new Date().toISOString()
  const prefix = ns ? `[${ts}] [${ns}] [${level}]` : `[${ts}] [${level}]`
  return [prefix, ...args]
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[CURRENT_LEVEL]
}

export function createLogger(namespace?: string) {
  return {
    debug: (...args: unknown[]) => {
      if (!shouldLog('debug')) return
      // eslint-disable-next-line no-console
      console.debug(...formatMessage(namespace, 'debug', args))
    },
    info: (...args: unknown[]) => {
      if (!shouldLog('info')) return
      // eslint-disable-next-line no-console
      console.info(...formatMessage(namespace, 'info', args))
    },
    warn: (...args: unknown[]) => {
      if (!shouldLog('warn')) return
      // eslint-disable-next-line no-console
      console.warn(...formatMessage(namespace, 'warn', args))
    },
    error: (...args: unknown[]) => {
      if (!shouldLog('error')) return
      // eslint-disable-next-line no-console
      console.error(...formatMessage(namespace, 'error', args))
    },
  }
}

export const logger = createLogger('app')

// Extended logger with contextual metadata used across robustness modules
export type LogContext = Record<string, unknown>

class ContextualLogger {
  private context: LogContext = {}
  private base = createLogger('professional')

  setContext(ctx: LogContext): void {
    this.context = { ...this.context, ...ctx }
  }

  private appendContext(args: unknown[]): unknown[] {
    return this.context && Object.keys(this.context).length > 0
      ? [...args, { context: this.context }]
      : args
  }

  debug(...args: unknown[]): void {
    this.base.debug(...this.appendContext(args))
  }

  info(...args: unknown[]): void {
    this.base.info(...this.appendContext(args))
  }

  warn(...args: unknown[]): void {
    this.base.warn(...this.appendContext(args))
  }

  error(...args: unknown[]): void {
    this.base.error(...this.appendContext(args))
  }

  // Progress helper used by batch processors
  progress(operation: string, processed: number, total: number, extra?: LogContext): void {
    const percent = total > 0 ? Math.round((processed / total) * 100) : 0
    this.info('Progress update', {
      operation,
      processed,
      total,
      percent
    }, extra)
  }
}

export const professionalLogger = new ContextualLogger()

// Factory that returns a contextual logger bound with additional context
export function createContextLogger(additional: LogContext = {}) {
  const instance = new ContextualLogger()
  instance.setContext(additional)
  return instance
}

// Minimal v2 alias to keep compatibility with existing imports
export const logger_v2 = createLogger('app-v2')

// Helper to standardize request logging
export function logRequest(details: {
  method: string
  url: string
  status?: number
  durationMs?: number
  payloadBytes?: number
  requestId?: string
  operation?: string
}): void {
  const { method, url, status, durationMs, payloadBytes, requestId, operation } = details
  const ns = createLogger('request')
  ns.info('[HTTP]', { method, url, status, durationMs, payloadBytes, requestId, operation })
}

// Helper to summarize system status in logs
export function logSystemStatus(status: {
  cpuPercent?: number
  memoryPercent?: number
  uptimeSeconds?: number
  details?: Record<string, unknown>
}): void {
  const ns = createLogger('system')
  ns.info('System status', status)
}