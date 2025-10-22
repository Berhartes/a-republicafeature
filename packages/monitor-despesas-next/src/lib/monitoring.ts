
import { professionalLogger } from './logger';
import { getRetryStats } from './retry';
import { getEnvVar, isNodeEnvironment, safeProcess } from './runtime-env';

const runtimeProcess = safeProcess();
const nodeEnvironment = isNodeEnvironment();

const MONITORING_CONFIG = {
  metricsInterval: Number(getEnvVar('METRICS_INTERVAL', '30000')),
  errorRateThreshold: Number(getEnvVar('ERROR_RATE_THRESHOLD', '0.1')),
  responseTimeThreshold: Number(getEnvVar('RESPONSE_TIME_THRESHOLD', '30000')),
  memoryUsageThreshold: Number(getEnvVar('MEMORY_USAGE_THRESHOLD', '0.8')),
  enabled: getEnvVar('ENABLE_PERFORMANCE_METRICS', 'false') === 'true'
};

interface MemoryUsageStats {
  heapUsed: number
  heapTotal: number
  external?: number
}

interface CpuUsageStats {
  user: number
  system: number
}

function getMemoryUsage(): MemoryUsageStats | null {
  if (runtimeProcess?.memoryUsage) {
    try {
      const usage = runtimeProcess.memoryUsage()
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: (usage as MemoryUsageStats).external
      }
    } catch {
      return null
    }
  }
  return null
}

function getCpuUsage(): CpuUsageStats | null {
  if (runtimeProcess?.cpuUsage) {
    try {
      const usage = runtimeProcess.cpuUsage()
      return { user: usage.user, system: usage.system }
    } catch {
      return null
    }
  }
  return null
}

function getUptime(): number | null {
  if (runtimeProcess?.uptime) {
    try {
      return runtimeProcess.uptime()
    } catch {
      return null
    }
  }
  return null
}

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface HealthStatus {
  component: string;
  status: 'healthy' | 'warning' | 'error';
  message?: string;
  lastChecked: number;
  metrics?: Record<string, any>;
}

export interface PerformanceMetrics {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  operations: {
    total: number;
    successful: number;
    failed: number;
    avgResponseTime: number;
  };
  timestamp: number;
}

class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  private operations: Array<{
    name: string;
    startTime: number;
    endTime?: number;
    success?: boolean;
    error?: any;
  }> = [];
  
  private maxMetricsPerType = 1000; // Limite para evitar memory leak

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    if (metrics.length > this.maxMetricsPerType) {
      metrics.splice(0, metrics.length - this.maxMetricsPerType);
    }
  }

  startOperation(name: string): (success?: boolean, error?: unknown) => void {
    const operation: {
      name: string
      startTime: number
      endTime?: number
      success?: boolean
      error?: unknown
    } = {
      name,
      startTime: Date.now()
    };

    this.operations.push(operation);

    return (success: boolean = true, error?: unknown) => {
      operation.endTime = Date.now();
      operation.success = success;
      operation.error = error;

      const duration = operation.endTime - operation.startTime;
      this.recordMetric(`operation.${name}.duration`, duration);
      this.recordMetric(`operation.${name}.${success ? 'success' : 'error'}`, 1);
    };
  }

  getMetrics(name: string): Metric[] {
    return this.metrics.get(name) || [];
  }

  getStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    const now = Date.now();
    const fiveMinutesAgo = now - (5 * 60 * 1000);

    const recentOps = this.operations.filter(op => op.startTime > fiveMinutesAgo && op.endTime);
    const successfulOps = recentOps.filter(op => op.success);
    const failedOps = recentOps.filter(op => !op.success);

    stats.operations = {
      total: recentOps.length,
      successful: successfulOps.length,
      failed: failedOps.length,
      successRate: recentOps.length > 0 ? successfulOps.length / recentOps.length : 0,
      avgResponseTime: recentOps.length > 0 
        ? recentOps.reduce((sum, op) => sum + (op.endTime! - op.startTime), 0) / recentOps.length 
        : 0
    };

    return stats;
  }

  cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.operations = this.operations.filter(op => op.startTime > oneHourAgo);
    
    for (const [name, metrics] of this.metrics.entries()) {
      const recent = metrics.filter(m => m.timestamp > oneHourAgo);
      this.metrics.set(name, recent);
    }
  }
}

class HealthChecker {
  private components: Map<string, () => Promise<HealthStatus>> = new Map();
  private lastResults: Map<string, HealthStatus> = new Map();

  registerHealthCheck(name: string, checker: () => Promise<HealthStatus>): void {
    this.components.set(name, checker);
  }

  async checkAll(): Promise<Record<string, HealthStatus>> {
    const results: Record<string, HealthStatus> = {};

    for (const [name, checker] of this.components.entries()) {
      try {
        const result = await checker();
        results[name] = result;
        this.lastResults.set(name, result);

        const lastResult = this.lastResults.get(name);
        if (lastResult && lastResult.status !== result.status) {
          professionalLogger.info(`Health status changed: ${name}`, {
            component: name,
            oldStatus: lastResult.status,
            newStatus: result.status,
            message: result.message
          });
        }
      } catch (error) {
        const errorResult: HealthStatus = {
          component: name,
          status: 'error',
          message: `Health check failed: ${error instanceof Error ? error.message : String(error)}`,
          lastChecked: Date.now()
        };
        results[name] = errorResult;
        this.lastResults.set(name, errorResult);
      }
    }

    return results;
  }

  async isSystemHealthy(): Promise<boolean> {
    const results = await this.checkAll();
    return Object.values(results).every(r => r.status === 'healthy');
  }
}

const metricsCollector = new MetricsCollector();
const healthChecker = new HealthChecker();

healthChecker.registerHealthCheck('system', async (): Promise<HealthStatus> => {
  const memoryUsage = getMemoryUsage();

  if (!memoryUsage || memoryUsage.heapTotal === 0) {
    return {
      component: 'system',
      status: 'healthy',
      message: 'Memory metrics unavailable in this environment',
      lastChecked: Date.now(),
      metrics: {
        supported: false
      }
    };
  }

  const memoryPercentage = memoryUsage.heapUsed / memoryUsage.heapTotal;

  if (memoryPercentage > MONITORING_CONFIG.memoryUsageThreshold) {
    return {
      component: 'system',
      status: 'warning',
      message: `High memory usage: ${(memoryPercentage * 100).toFixed(1)}%`,
      lastChecked: Date.now(),
      metrics: {
        memoryPercentage,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      }
    };
  }

  return {
    component: 'system',
    status: 'healthy',
    message: `Memory usage: ${(memoryPercentage * 100).toFixed(1)}%`,
    lastChecked: Date.now(),
    metrics: {
      memoryPercentage,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal
    }
  };
});

healthChecker.registerHealthCheck('operations', async (): Promise<HealthStatus> => {
  const stats = metricsCollector.getStats();
  const { operations } = stats;

  if (operations.total === 0) {
    return {
      component: 'operations',
      status: 'healthy',
      message: 'No recent operations',
      lastChecked: Date.now()
    };
  }

  const errorRate = operations.failed / operations.total;
  
  if (errorRate > MONITORING_CONFIG.errorRateThreshold) {
    return {
      component: 'operations',
      status: 'error',
      message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      lastChecked: Date.now(),
      metrics: operations
    };
  }

  if (operations.avgResponseTime > MONITORING_CONFIG.responseTimeThreshold) {
    return {
      component: 'operations',
      status: 'warning',
      message: `Slow response time: ${operations.avgResponseTime.toFixed(0)}ms`,
      lastChecked: Date.now(),
      metrics: operations
    };
  }

  return {
    component: 'operations',
    status: 'healthy',
    message: `${operations.total} operations, ${(operations.successRate * 100).toFixed(1)}% success rate`,
    lastChecked: Date.now(),
    metrics: operations
  };
});

export class MonitoringSystem {
  private intervalId?: ReturnType<typeof setInterval>;
  private isRunning = false;

  start(): void {
    if (this.isRunning || !MONITORING_CONFIG.enabled) {
      return;
    }

    this.isRunning = true;
    professionalLogger.info('Sistema de monitoramento iniciado', {
      interval: `${MONITORING_CONFIG.metricsInterval}ms`,
      enabled: MONITORING_CONFIG.enabled
    });

    this.intervalId = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.runHealthChecks();
        metricsCollector.cleanup();
      } catch (error) {
        professionalLogger.error('Erro no sistema de monitoramento', error);
      }
    }, MONITORING_CONFIG.metricsInterval);

    if (nodeEnvironment && runtimeProcess?.on) {
      runtimeProcess.on('SIGINT', () => this.stop());
      runtimeProcess.on('SIGTERM', () => this.stop());
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    professionalLogger.info('Sistema de monitoramento parado');
  }

  private async collectMetrics(): Promise<void> {
    const memoryUsage = getMemoryUsage();
    const cpuUsage = getCpuUsage();

    if (memoryUsage) {
      metricsCollector.recordMetric('system.memory.heap_used', memoryUsage.heapUsed);
      metricsCollector.recordMetric('system.memory.heap_total', memoryUsage.heapTotal);
      if (typeof memoryUsage.external === 'number') {
        metricsCollector.recordMetric('system.memory.external', memoryUsage.external);
      }
    }

    if (cpuUsage) {
      metricsCollector.recordMetric('system.cpu.user', cpuUsage.user);
      metricsCollector.recordMetric('system.cpu.system', cpuUsage.system);
    }

    const retryStats = getRetryStats();
    metricsCollector.recordMetric('retry.rate_limiter_requests', retryStats.rateLimiterRequests);
  }

  private async runHealthChecks(): Promise<void> {
    const results = await healthChecker.checkAll();
    
    for (const [component, result] of Object.entries(results)) {
      if (result.status !== 'healthy') {
        professionalLogger.warn(`Health check ${component}: ${result.status}`, {
          component,
          status: result.status,
          message: result.message,
          metrics: result.metrics
        });
      }
    }
  }

  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    metricsCollector.recordMetric(name, value, tags);
  }

  startOperation(name: string): (success?: boolean, error?: unknown) => void {
    return metricsCollector.startOperation(name);
  }

  registerHealthCheck(name: string, checker: () => Promise<HealthStatus>): void {
    healthChecker.registerHealthCheck(name, checker);
  }

  async getSystemStatus(): Promise<{
    overall: 'healthy' | 'warning' | 'error';
    components: Record<string, HealthStatus>;
    metrics: Record<string, any>;
  }> {
    const components = await healthChecker.checkAll();
    const stats = metricsCollector.getStats();
    
    const statuses = Object.values(components).map(c => c.status);
    let overall: 'healthy' | 'warning' | 'error' = 'healthy';
    
    if (statuses.includes('error')) {
      overall = 'error';
    } else if (statuses.includes('warning')) {
      overall = 'warning';
    }

    const memoryUsage = getMemoryUsage()
    const uptime = getUptime()

    return {
      overall,
      components,
      metrics: {
        ...stats,
        system: {
          memoryUsage,
          uptime,
          nodeVersion: runtimeProcess?.version ?? 'browser'
        }
      }
    };
  }
}

export const monitoring = new MonitoringSystem();

export function startMonitoring(): void {
  monitoring.start();
}

export function stopMonitoring(): void {
  monitoring.stop();
}

export function recordMetric(name: string, value: number, tags?: Record<string, string>): void {
  monitoring.recordMetric(name, value, tags);
}

export function startOperation(name: string): (success?: boolean, error?: unknown) => void {
  return monitoring.startOperation(name);
}

export function registerHealthCheck(name: string, checker: () => Promise<HealthStatus>): void {
  monitoring.registerHealthCheck(name, checker);
}

export async function getSystemStatus() {
  return monitoring.getSystemStatus();
}

export async function printDashboard(): Promise<void> {
  const status = await getSystemStatus();
  
  console.clear();
  console.log('='.repeat(80));
  console.log('🎛️  SISTEMA DE MONITORAMENTO ETL - DASHBOARD');
  console.log('='.repeat(80));
  console.log();
  
  const statusIcon = status.overall === 'healthy' ? '✅' : 
                     status.overall === 'warning' ? '⚠️' : '❌';
  console.log(`Status Geral: ${statusIcon} ${status.overall.toUpperCase()}`);
  console.log();
  
  console.log('📊 COMPONENTES:');
  for (const [name, component] of Object.entries(status.components)) {
    const icon = component.status === 'healthy' ? '✅' : 
                 component.status === 'warning' ? '⚠️' : '❌';
    console.log(`  ${icon} ${name}: ${component.message}`);
  }
  console.log();
  
  console.log('📈 MÉTRICAS:');
  if (status.metrics.operations) {
    const ops = status.metrics.operations;
    console.log(`  📦 Operações (5min): ${ops.total} total, ${(ops.successRate * 100).toFixed(1)}% sucesso`);
    console.log(`  ⚡ Tempo resposta: ${ops.avgResponseTime.toFixed(0)}ms`);
  }
  
  if (status.metrics.system) {
    const sys = status.metrics.system;
    const memPercent = ((sys.memoryUsage.heapUsed / sys.memoryUsage.heapTotal) * 100).toFixed(1);
    console.log(`  🖥️  Memória: ${memPercent}% (${Math.round(sys.memoryUsage.heapUsed / 1024 / 1024)}MB)`);
    console.log(`  ⏱️  Uptime: ${Math.round(sys.uptime)}s`);
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log(`📅 Última atualização: ${new Date().toLocaleString()}`);
  console.log('='.repeat(80));
}
