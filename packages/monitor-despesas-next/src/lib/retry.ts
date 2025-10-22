
import { professionalLogger } from './logger';
import { getEnvVar } from './runtime-env';

const RETRY_CONFIG = {
  defaultRetries: Number(getEnvVar('DEFAULT_RETRIES', '3')),
  initialDelay: Number(getEnvVar('RETRY_DELAY', '1000')),
  maxDelay: Number(getEnvVar('RETRY_MAX_DELAY', '30000')),
  backoffMultiplier: Number(getEnvVar('RETRY_BACKOFF_MULTIPLIER', '2')),
  jitterMax: 1000, // Máximo jitter em ms
};

export enum ErrorType {
  NETWORK = 'NETWORK',
  API_LIMIT = 'API_LIMIT',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT = 'TIMEOUT',
  _ERROR = '_ERROR',
  PERMANENT = 'PERMANENT'
}

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
  onRetry?: (error: any, attempt: number, delay: number) => void;
  timeoutMs?: number;
}

export class RetryableError extends Error {
  constructor(
    public readonly errorType: ErrorType,
    message: string,
    public readonly originalError?: any,
    public readonly retryAfter?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 60000
  ) {}

  canExecute(): boolean {
    if (this.state === 'CLOSED') {
      return true;
    }

    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailure > this.resetTimeoutMs) {
        this.state = 'HALF_OPEN';
        return true;
      }
      return false;
    }

    return true;
  }

  onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      professionalLogger.warn('Circuit breaker ABERTO - muitas falhas consecutivas', {
        failures: this.failures,
        threshold: this.failureThreshold
      });
    }
  }
}

class RateLimiter {
  private requests: number[] = [];

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getDelay(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

const circuitBreaker = new CircuitBreaker();
const rateLimiter = new RateLimiter(
  Number(getEnvVar('API_CALLS_PER_MINUTE', '60')),
  60000
);

export function classifyError(error: any): ErrorType {
  if (error?.code === 'ENOTFOUND' || error?.code === 'ECONNREFUSED') {
    return ErrorType.NETWORK;
  }

  if (error?.response?.status === 429 || error?.code === 'RATE_LIMITED') {
    return ErrorType.API_LIMIT;
  }

  if (error?.response?.status >= 500 && error?.response?.status < 600) {
    return ErrorType.SERVER_ERROR;
  }

  if (error?.code === 'ABORTED' || error?.name === 'TimeoutError') {
    return ErrorType.TIMEOUT;
  }

  if (error?.code?.startsWith('_')) {
    return ErrorType._ERROR;
  }

  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return ErrorType.PERMANENT;
  }

  return ErrorType.NETWORK; // Default para retry
}

function shouldRetryByDefault(error: any, attempt: number): boolean {
  const errorType = classifyError(error);
  
  switch (errorType) {
    case ErrorType.PERMANENT:
      return false;
    case ErrorType.API_LIMIT:
      return attempt <= 5; // Mais tentativas para rate limit
    case ErrorType.NETWORK:
    case ErrorType.SERVER_ERROR:
    case ErrorType.TIMEOUT:
    case ErrorType._ERROR:
      return attempt <= RETRY_CONFIG.defaultRetries;
    default:
      return attempt <= RETRY_CONFIG.defaultRetries;
  }
}

function calculateDelay(attempt: number, errorType: ErrorType, retryAfter?: number): number {
  if (retryAfter) {
    return Math.min(retryAfter * 1000, RETRY_CONFIG.maxDelay);
  }

  let delay = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt - 1);
  
  switch (errorType) {
    case ErrorType.API_LIMIT:
      delay *= 2; // Delay maior para rate limit
      break;
    case ErrorType.NETWORK:
      delay *= 1.5;
      break;
  }

  const jitter = Math.random() * RETRY_CONFIG.jitterMax;
  delay += jitter;

  return Math.min(delay, RETRY_CONFIG.maxDelay);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {},
  operationName: string = 'unknown'
): Promise<T> {
  const {
    maxRetries = RETRY_CONFIG.defaultRetries,
    shouldRetry = shouldRetryByDefault,
    onRetry,
    timeoutMs
  } = config;

  let lastError: any;
  const startTime = Date.now();
  
  if (!circuitBreaker.canExecute()) {
    throw new Error('Circuit breaker está aberto - muitas falhas recentes');
  }

  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    try {
      if (!rateLimiter.canMakeRequest()) {
        const delay = rateLimiter.getDelay();
        professionalLogger.warn('Rate limit atingido, aguardando', {
          operation: operationName,
          delay: `${delay}ms`
        });
        await sleep(delay);
      }

      const result = timeoutMs 
        ? await withTimeout(operation(), timeoutMs)
        : await operation();

      circuitBreaker.onSuccess();
      
      if (attempt > 1) {
        const totalTime = Date.now() - startTime;
        professionalLogger.info(`[RETRY_SUCCESS] ${operationName}`, {
          operation: operationName,
          attempts: attempt,
          totalTime: `${totalTime}ms`,
          type: 'retry_success'
        });
      }

      return result;

    } catch (error) {
      lastError = error;
      const errorType = classifyError(error);
      
      if (attempt > maxRetries || !shouldRetry(error, attempt)) {
        circuitBreaker.onFailure();
        
        professionalLogger.error(`[RETRY_FAILED] ${operationName} falhou definitivamente`, error, {
          operation: operationName,
          attempts: attempt,
          errorType,
          totalTime: `${Date.now() - startTime}ms`
        });
        
        throw error;
      }

      const retryAfter = error?.response?.headers?.['retry-after'];
      const delay = calculateDelay(attempt, errorType, retryAfter);

      if (onRetry) {
        onRetry(error, attempt, delay);
      }

      professionalLogger.warn(`[RETRY] ${operationName} - tentativa ${attempt}/${maxRetries}`, {
        operation: operationName,
        attempt,
        maxRetries,
        delay: `${delay}ms`,
        errorType,
        errorMessage: error?.message || String(error)
      });

      await sleep(delay);
    }
  }

  throw lastError;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeout = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timeout')), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retryOperation<T>(
  operation: () => Promise<T>,
  operationName: string = '_operation'
): Promise<T> {
  return withRetry(
    operation,
    {
      maxRetries: 5,
      shouldRetry: (error, attempt) => {
        const _errorType = classifyError(error);
        
        if (error?.code === 'PERMISSION_DENIED') {
          return false;
        }
        
        if (error?.code === 'DEADLINE_EXCEEDED' || error?.code === 'ABORTED') {
          return attempt <= 5;
        }
        
        return shouldRetryByDefault(error, attempt);
      },
      onRetry: (error, attempt, delay) => {
        professionalLogger.warn(` operation retry`, {
          operation: operationName,
          attempt,
          delay: `${delay}ms`,
          Code: error?.code,
          details: error?.details
        });
      }
    },
    operationName
  );
}

export async function retryCamaraAPI<T>(
  operation: () => Promise<T>,
  operationName: string = 'camara_api'
): Promise<T> {
  return withRetry(
    operation,
    {
      maxRetries: 3,
      timeoutMs: Number(getEnvVar('CAMARA_API_TIMEOUT', '30000')),
      shouldRetry: (error, attempt) => {
        if (error?.response?.status === 429) {
          return attempt <= 5;
        }
        
        return shouldRetryByDefault(error, attempt);
      },
      onRetry: (error, attempt, delay) => {
        professionalLogger.warn('API Câmara retry', {
          operation: operationName,
          attempt,
          delay: `${delay}ms`,
          status: error?.response?.status,
          statusText: error?.response?.statusText
        });
      }
    },
    operationName
  );
}

export function getRetryStats() {
  return {
    circuitBreakerState: circuitBreaker['state'],
    rateLimiterRequests: rateLimiter['requests'].length,
    config: RETRY_CONFIG
  };
}
