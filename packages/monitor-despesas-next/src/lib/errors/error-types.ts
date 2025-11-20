
export interface BaseError {
  message: string
  code: string
  timestamp: number
  context?: Record<string, unknown>
  stack?: string
}

export enum ErrorCode {
  DEPUTY_NOT_FOUND = 'DEPUTY_NOT_FOUND',
  SUPPLIER_NOT_FOUND = 'SUPPLIER_NOT_FOUND',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  INVALID_YEAR = 'INVALID_YEAR',
  INVALID_CNPJ = 'INVALID_CNPJ',
  INVALID_CPF = 'INVALID_CPF',
  
  _CONNECTION_ERROR = '_CONNECTION_ERROR',
  CHAMBER_API_ERROR = 'CHAMBER_API_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  
  INVALID_DATA_FORMAT = 'INVALID_DATA_FORMAT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  DATA_INTEGRITY_ERROR = 'DATA_INTEGRITY_ERROR',
  AMOUNT_VALIDATION_ERROR = 'AMOUNT_VALIDATION_ERROR',
  
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  RANKING_GENERATION_ERROR = 'RANKING_GENERATION_ERROR',
  ANALYTICS_PROCESSING_ERROR = 'ANALYTICS_PROCESSING_ERROR',
  EXPORT_GENERATION_ERROR = 'EXPORT_GENERATION_ERROR',
  
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  CACHE_ERROR = 'CACHE_ERROR',
  CACHE_INVALIDATION_ERROR = 'CACHE_INVALIDATION_ERROR',
  
  COMPONENT_RENDER_ERROR = 'COMPONENT_RENDER_ERROR',
  STATE_UPDATE_ERROR = 'STATE_UPDATE_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  NETWORK = 'network',
  DATA = 'data',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}

export class ParliamentaryError extends globalThis.Error {
  public readonly code: ErrorCode
  public readonly severity: ErrorSeverity
  public readonly category: ErrorCategory
  public readonly timestamp: number
  public readonly retryable: boolean
  public readonly userMessage: string
  public readonly technicalDetails?: string
  public readonly expectedRecoveryTime?: number
  public readonly deputyId?: string
  public readonly supplierId?: string
  public readonly transactionId?: string
  public readonly year?: number
  public readonly context?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    message: string,
    options: Partial<Pick<ParliamentaryError, 'severity' | 'category' | 'userMessage' | 'retryable' | 'technicalDetails' | 'expectedRecoveryTime' | 'deputyId' | 'supplierId' | 'transactionId' | 'year' | 'context'>> = {}
  ) {
    super(message)
  this.name = 'ParliamentaryError'
    this.code = code
    this.timestamp = Date.now()
    this.severity = options.severity || ErrorSeverity.MEDIUM
    this.category = options.category || ErrorCategory.SYSTEM
    this.userMessage = options.userMessage || ErrorFactory.getDefaultUserMessage(code)
    this.retryable = options.retryable || ErrorFactory.isRetryable(code)
    this.technicalDetails = options.technicalDetails
    this.expectedRecoveryTime = options.expectedRecoveryTime
    this.deputyId = options.deputyId
    this.supplierId = options.supplierId
    this.transactionId = options.transactionId
    this.year = options.year
    this.context = options.context
  }
}

export class NetworkError extends ParliamentaryError {
  public readonly url?: string
  public readonly method?: string
  public readonly statusCode?: number
  public readonly responseTime?: number

  constructor(
    code: ErrorCode,
    message: string,
    options: Partial<NetworkError> = {}
  ) {
    super(code, message, { category: ErrorCategory.NETWORK, ...options })
    this.name = 'NetworkError'
    this.url = options.url
    this.method = options.method
    this.statusCode = options.statusCode
    this.responseTime = options.responseTime
  }
}

export class ValidationError extends ParliamentaryError {
  public readonly field?: string
  public readonly value?: unknown
  public readonly constraints?: string[]

  constructor(
    code: ErrorCode,
    message: string,
    options: Partial<ValidationError> = {}
  ) {
    super(code, message, { category: ErrorCategory.VALIDATION, ...options })
    this.name = 'ValidationError'
    this.field = options.field
    this.value = options.value
    this.constraints = options.constraints
  }
}

export class DataError extends ParliamentaryError {
  public readonly collection?: string
  public readonly document?: string
  public readonly operation?: 'read' | 'write' | 'delete' | 'query'

  constructor(
    code: ErrorCode,
    message: string,
    options: Partial<DataError> = {}
  ) {
    super(code, message, options)
    this.name = 'DataError'
    this.collection = options.collection
    this.document = options.document
    this.operation = options.operation
  }
}

export class ChamberAPIError extends ParliamentaryError {
  public readonly endpoint?: string
  public readonly apiVersion?: string
  public readonly requestId?: string

  constructor(
    code: ErrorCode,
    message: string,
    options: Partial<ChamberAPIError> = {}
  ) {
    super(code, message, options)
    this.name = 'ChamberAPIError'
    this.endpoint = options.endpoint
    this.apiVersion = options.apiVersion
    this.requestId = options.requestId
  }
}

export class ErrorFactory {
  static createParliamentaryError(
    code: ErrorCode,
    message: string,
    options: Partial<ParliamentaryError> = {}
  ): ParliamentaryError {
    return new ParliamentaryError(code, message, options)
  }

  static createNetworkError(
    message: string,
    options: Partial<NetworkError> = {}
  ): NetworkError {
    return new NetworkError(
      options.code || ErrorCode.NETWORK_ERROR,
      message,
      { category: ErrorCategory.NETWORK, ...options }
    )
  }

  static createValidationError(
    field: string,
    message: string,
    options: Partial<ValidationError> = {}
  ): ValidationError {
    return new ValidationError(
      ErrorCode.INVALID_DATA_FORMAT,
      message,
      { field, value: options.value, constraints: options.constraints, ...options }
    )
  }

  static createDataError(
    operation: DataError['operation'],
    message: string,
    options: Partial<DataError> = {}
  ): DataError {
    return new DataError(
      ErrorCode._CONNECTION_ERROR,
      message,
      { operation, collection: options.collection, document: options.document, ...options }
    )
  }

  static createChamberAPIError(
    endpoint: string,
    message: string,
    options: Partial<ChamberAPIError> = {}
  ): ChamberAPIError {
    return new ChamberAPIError(
      ErrorCode.CHAMBER_API_ERROR,
      message,
      { endpoint, apiVersion: options.apiVersion, requestId: options.requestId, ...options }
    )
  }

  static getDefaultUserMessage(code: ErrorCode): string {
    switch (code) {
      case ErrorCode.DEPUTY_NOT_FOUND:
        return 'Deputado não encontrado. Verifique se o ID está correto.'
      
      case ErrorCode.SUPPLIER_NOT_FOUND:
        return 'Fornecedor não encontrado. Verifique se o CNPJ está correto.'
      
      case ErrorCode.INVALID_YEAR:
        return 'Ano inválido. Selecione um ano entre 2019 e o ano atual.'
      
      case ErrorCode.NETWORK_ERROR:
        return 'Erro de conexão. Verifique sua internet e tente novamente.'
      
      case ErrorCode._CONNECTION_ERROR:
        return 'Erro ao acessar os dados. Tente novamente em alguns instantes.'
      
      case ErrorCode.CHAMBER_API_ERROR:
        return 'Erro ao acessar dados da Câmara dos Deputados. Tente novamente mais tarde.'
      
      case ErrorCode.RATE_LIMIT_EXCEEDED:
        return 'Muitas solicitações. Aguarde alguns segundos antes de tentar novamente.'
      
      case ErrorCode.INVALID_DATA_FORMAT:
        return 'Formato de dados inválido. Verifique os dados inseridos.'
      
      case ErrorCode.CALCULATION_ERROR:
        return 'Erro ao processar cálculos. Tente recarregar a página.'
      
      case ErrorCode.PERMISSION_DENIED:
        return 'Acesso negado. Você não tem permissão para esta operação.'
      
      default:
        return 'Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.'
    }
  }

  static isRetryable(code: ErrorCode): boolean {
    const retryableErrors = [
      ErrorCode.NETWORK_ERROR,
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.SERVER_ERROR,
      ErrorCode._CONNECTION_ERROR,
      ErrorCode.CHAMBER_API_ERROR,
      ErrorCode.CACHE_ERROR
    ]
    
    return retryableErrors.includes(code)
  }

  static createDeputyNotFoundError(deputyId: string): ParliamentaryError {
    return this.createParliamentaryError(
      ErrorCode.DEPUTY_NOT_FOUND,
      `Deputado com ID ${deputyId} não encontrado`,
      { deputyId, userMessage: 'Deputado não encontrado. Verifique se o ID está correto.' }
    )
  }

  static createSupplierNotFoundError(cnpj: string): ParliamentaryError {
    return this.createParliamentaryError(
      ErrorCode.SUPPLIER_NOT_FOUND,
      `Fornecedor com CNPJ ${cnpj} não encontrado`,
      { supplierId: cnpj, userMessage: 'Fornecedor não encontrado. Verifique se o CNPJ está correto.' }
    )
  }

  static createInvalidYearError(year: number): ValidationError {
    return this.createValidationError(
      'year',
      `Ano ${year} é inválido`,
      { 
        value: year, 
        constraints: ['Ano deve estar entre 2019 e o ano atual'],
        userMessage: 'Ano inválido. Selecione um ano entre 2019 e o ano atual.'
      }
    )
  }
}

export interface ErrorContext {
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  route?: string
  userAgent?: string
  timestamp?: number
  buildVersion?: string
  searchTerm?: string
  year?: string | number
  deputyId?: string | number
  [key: string]: unknown
}

export interface ErrorReportingConfig {
  enableReporting: boolean
  endpoint?: string
  sampleRate?: number // 0-1, percentage of errors to report
  ignoredErrors?: ErrorCode[]
  maxRetries?: number
  retryDelay?: number
}

export interface ErrorRecoveryStrategy {
  canRecover: boolean
  recoveryAction?: () => Promise<void> | void
  fallbackComponent?: React.ComponentType
  redirectUrl?: string
  retryAfter?: number // seconds
}

export type ErrorHandler = (error: ParliamentaryError) => void | Promise<void>
export type ErrorRecoveryHandler = (error: ParliamentaryError) => ErrorRecoveryStrategy

export const ErrorPredicates = {
  isNetworkError: (error: ParliamentaryError): error is NetworkError =>
    error.category === ErrorCategory.NETWORK,
  
  isValidationError: (error: ParliamentaryError): error is ValidationError =>
    error.category === ErrorCategory.VALIDATION,
  
  isDataError: (error: ParliamentaryError): error is DataError =>
    error.code === ErrorCode._CONNECTION_ERROR,
  
  isChamberAPIError: (error: ParliamentaryError): error is ChamberAPIError =>
    error.code === ErrorCode.CHAMBER_API_ERROR,
  
  isRetryable: (error: ParliamentaryError): boolean => error.retryable,
  
  isCritical: (error: ParliamentaryError): boolean =>
    error.severity === ErrorSeverity.CRITICAL,
  
  requiresUserAction: (error: ParliamentaryError): boolean =>
    error.category === ErrorCategory.USER_INPUT ||
    error.category === ErrorCategory.VALIDATION,
  
  canRecover: (error: ParliamentaryError): boolean =>
    error.retryable || error.severity === ErrorSeverity.LOW
}