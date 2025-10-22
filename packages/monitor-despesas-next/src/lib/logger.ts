
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const environmentConfig = {
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_DIRECTORY: process.env.LOG_DIRECTORY || './logs'
};

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  [key: string]: any;
  timestamp?: string;
  source?: string;
  operation?: string;
  deputadoId?: number;
  processingId?: string;
}

const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.align(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(sanitizeLogData(meta))}` : '';
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    return JSON.stringify({
      ...sanitizeLogData(info),
      environment: environmentConfig.NODE_ENV
    });
  })
);

function sanitizeLogData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'credential',
    'authorization', 'auth', 'apikey', 'GOOGLE_APPLICATION_CREDENTIALS'
  ];

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLogData(sanitized[key]);
    }
  }

  return sanitized;
}

const dailyRotateTransport = new DailyRotateFile({
  filename: 'logs/etl-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d', // Manter logs por 14 dias
  format: fileFormat
});

const errorTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d', // Manter logs de erro por 30 dias
  level: 'error',
  format: fileFormat
});

const logger = winston.createLogger({
  level: environmentConfig.LOG_LEVEL || 'info',
  format: winston.format.errors({ stack: true }),
  defaultMeta: {
    service: 'camara-etl',
    version: process.env.npm_package_version || '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test'
    }),
    
    dailyRotateTransport,
    
    errorTransport
  ],

  exceptionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/exceptions.log',
      format: fileFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: 'logs/rejections.log',
      format: fileFormat
    })
  ]
});

class ProfessionalLogger {
  private winston: winston.Logger;
  private context: LogContext;

  constructor(winstonLogger: winston.Logger) {
    this.winston = winstonLogger;
    this.context = {};
  }

  setContext(context: LogContext): this {
    this.context = { ...this.context, ...context };
    return this;
  }

  clearContext(): this {
    this.context = {};
    return this;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const logContext = { ...this.context, ...context };
    
    if (error instanceof Error) {
      this.winston.error(message, {
        ...logContext,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        }
      });
    } else {
      this.winston.error(message, { ...logContext, error });
    }
  }

  warn(message: string, context?: LogContext): void {
    this.winston.warn(message, { ...this.context, ...context });
  }

  info(message: string, context?: LogContext): void {
    this.winston.info(message, { ...this.context, ...context });
  }

  debug(message: string, context?: LogContext): void {
    this.winston.debug(message, { ...this.context, ...context });
  }

  startOperation(operation: string, context?: LogContext): () => void {
    const startTime = Date.now();
    const operationId = Math.random().toString(36).substr(2, 9);
    
    this.info(`[INÍCIO] ${operation}`, {
      ...context,
      operation,
      operationId,
      phase: 'start'
    });

    return () => {
      const duration = Date.now() - startTime;
      this.info(`[FIM] ${operation}`, {
        ...context,
        operation,
        operationId,
        duration: `${duration}ms`,
        phase: 'end'
      });
    };
  }

  metrics(operation: string, metrics: Record<string, number | string>, context?: LogContext): void {
    this.info(`[MÉTRICAS] ${operation}`, {
      ...context,
      operation,
      metrics,
      type: 'performance'
    });
  }

  progress(operation: string, current: number, total: number, context?: LogContext): void {
    const percentage = Math.round((current / total) * 100);
    this.info(`[PROGRESSO] ${operation}: ${current}/${total} (${percentage}%)`, {
      ...context,
      operation,
      current,
      total,
      percentage,
      type: 'progress'
    });
  }

  audit(action: string, context?: LogContext): void {
    this.winston.info(`[AUDITORIA] ${action}`, {
      ...this.context,
      ...context,
      type: 'audit',
      timestamp: new Date().toISOString()
    });
  }
}

export const professionalLogger = new ProfessionalLogger(logger);

export const logger_v2 = {
  error: (message: string, error?: any) => professionalLogger.error(message, error),
  warn: (message: string) => professionalLogger.warn(message),
  info: (message: string) => professionalLogger.info(message),
  debug: (message: string) => professionalLogger.debug(message),
};

export default professionalLogger;

export function createContextLogger(context: LogContext): ProfessionalLogger {
  return new ProfessionalLogger(logger).setContext(context);
}

export function logRequest(url: string, method: string = 'GET', duration?: number): void {
  professionalLogger.info(`[HTTP] ${method} ${url}`, {
    type: 'http',
    method,
    url,
    duration: duration ? `${duration}ms` : undefined
  });
}

export function logSystemStatus(component: string, status: 'healthy' | 'warning' | 'error', details?: any): void {
  const level = status === 'error' ? 'error' : status === 'warning' ? 'warn' : 'info';
  professionalLogger[level](`[SISTEMA] ${component}: ${status.toUpperCase()}`, {
    type: 'system',
    component,
    status,
    details
  });
}