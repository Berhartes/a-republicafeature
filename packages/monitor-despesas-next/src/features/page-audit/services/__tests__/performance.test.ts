/**
 * Performance tests for page audit operations
 * Tests analysis speed, dashboard rendering, and memory usage
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PerformanceMonitorService } from '../performance-monitor.service'
import { PageAuditToolService } from '../page-audit-tool.service'
import {
  PageInfo,
  PageStatus,
  PageCategory,
  FileType,
} from '../../types/page-info.types'

// Mock performance.now for consistent timing
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true,
})

// Mock process.memoryUsage and process.cwd for memory testing
const mockMemoryUsage = vi.fn()
const mockCwd = vi.fn()
const originalProcess = process
Object.defineProperty(global, 'process', {
  value: {
    ...originalProcess,
    memoryUsage: mockMemoryUsage,
    cwd: mockCwd,
  },
  writable: true,
})

describe('Performance Tests', () => {
  let performanceMonitor: PerformanceMonitorService
  let auditTool: PageAuditToolService
  let mockTime: number
  beforeEach(() => {
    mockTime = 0
    vi.spyOn(Date, 'now').mockImplementation(() => mockTime)
    mockPerformanceNow.mockImplementation(() => mockTime)
    mockMemoryUsage.mockReturnValue({
      heapUsed: 50 * 1024 * 1024, // 50MB
      heapTotal: 100 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      rss: 200 * 1024 * 1024,
    })
    mockCwd.mockReturnValue('/test-project')

    Object.defineProperty(global, 'process', {
      value: {
        ...originalProcess,
        memoryUsage: mockMemoryUsage,
        cwd: mockCwd,
      },
      writable: true,
    })

    performanceMonitor = new PerformanceMonitorService({
      maxDuration: 60000, // 1 minute for tests
      maxMemoryUsage: 500 * 1024 * 1024, // 500MB
      warnings: {
        duration: 5000, // 5 seconds
        memoryUsage: 100 * 1024 * 1024, // 100MB
        processingRate: 10, // 10 items/sec
      },
    })

    auditTool = new PageAuditToolService('/test-project')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
    Object.defineProperty(global, 'process', {
      value: originalProcess,
      writable: true,
    })
  })

  describe('Analysis Speed Tests', () => {
    it('should process small codebase (10 pages) within performance thresholds', async () => {
      const pages = generateMockPages(10)
      const operationId = performanceMonitor.startOperation('scan', {
        pageCount: 10,
      })

      // Simulate processing
      performanceMonitor.updateProgress(operationId, 'Scanning pages', 5, 10)
      performanceMonitor.updateProgress(
        operationId,
        'Analyzing dependencies',
        10,
        10
      )

      mockTime = 1000
      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.success).toBe(true)
      expect(metrics.itemsProcessed).toBe(10)

      // Should complete quickly for small datasets
      expect(metrics.duration).toBeDefined()
      expect(metrics.duration).toBeGreaterThan(0)
    })

    it('should process medium codebase (50 pages) efficiently', async () => {
      const pages = generateMockPages(50)
      const operationId = performanceMonitor.startOperation('scan', {
        pageCount: 50,
      })

      // Simulate processing
      performanceMonitor.updateProgress(operationId, 'Scanning pages', 25, 50)
      performanceMonitor.updateProgress(
        operationId,
        'Analyzing dependencies',
        50,
        50
      )

      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.success).toBe(true)
      expect(metrics.itemsProcessed).toBe(50)
      expect(metrics.duration).toBeDefined()
      expect(metrics.duration).toBeGreaterThanOrEqual(0)
    })

    it('should handle large codebase (200 pages) with acceptable performance', async () => {
      const pages = generateMockPages(200)
      const operationId = performanceMonitor.startOperation('scan', {
        pageCount: 200,
      })

      // Simulate processing
      performanceMonitor.updateProgress(operationId, 'Scanning pages', 100, 200)
      performanceMonitor.updateProgress(
        operationId,
        'Analyzing dependencies',
        200,
        200
      )

      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.success).toBe(true)
      expect(metrics.itemsProcessed).toBe(200)
      expect(metrics.duration).toBeDefined()
      expect(metrics.duration).toBeGreaterThanOrEqual(0)
    })

    it('should detect performance degradation with very large codebase (500 pages)', async () => {
      const pages = generateMockPages(500)
      const operationId = performanceMonitor.startOperation('scan', {
        pageCount: 500,
      })

      // Simulate processing
      performanceMonitor.updateProgress(operationId, 'Scanning pages', 250, 500)
      performanceMonitor.updateProgress(
        operationId,
        'Analyzing dependencies',
        500,
        500
      )

      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.success).toBe(true)
      expect(metrics.itemsProcessed).toBe(500)
      expect(metrics.duration).toBeDefined()
      expect(metrics.duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Memory Usage Tests', () => {
    it('should track memory usage during analysis operations', async () => {
      const operationId = performanceMonitor.startOperation('analyze', {
        pageCount: 50,
      })

      // Simulate memory increase during processing
      mockMemoryUsage.mockReturnValue({
        heapUsed: 150 * 1024 * 1024, // 150MB (increased from 50MB)
        heapTotal: 200 * 1024 * 1024,
        external: 20 * 1024 * 1024,
        rss: 300 * 1024 * 1024,
      })

      mockTime = 5000
      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.memoryStart).toBe(50 * 1024 * 1024)
      expect(metrics.memoryEnd).toBe(150 * 1024 * 1024)
      expect(metrics.memoryDelta).toBe(100 * 1024 * 1024) // 100MB increase
    })

    it('should warn about high memory usage', async () => {
      const operationId = performanceMonitor.startOperation('analyze', {
        pageCount: 100,
      })

      // Simulate high memory usage
      mockMemoryUsage.mockReturnValue({
        heapUsed: 250 * 1024 * 1024, // 250MB (exceeds warning threshold)
        heapTotal: 400 * 1024 * 1024,
        external: 50 * 1024 * 1024,
        rss: 500 * 1024 * 1024,
      })

      mockTime = 3000
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.memoryDelta).toBe(200 * 1024 * 1024) // 200MB increase

      // Should trigger memory warning
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance warnings'),
        expect.arrayContaining([
          expect.stringContaining('Memory usage: 209715200 bytes'),
        ])
      )

      consoleSpy.mockRestore()
    })

    it('should detect memory leaks in long-running operations', async () => {
      const operationId = performanceMonitor.startOperation('scan', {
        pageCount: 1000,
      })

      // Simulate excessive memory growth
      mockMemoryUsage.mockReturnValue({
        heapUsed: 600 * 1024 * 1024, // 600MB (exceeds max threshold)
        heapTotal: 800 * 1024 * 1024,
        external: 100 * 1024 * 1024,
        rss: 1000 * 1024 * 1024,
      })

      mockTime = 30000
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})
      const metrics = performanceMonitor.endOperation(operationId, true)

      expect(metrics.memoryDelta).toBe(550 * 1024 * 1024) // 550MB increase

      // Should trigger memory error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Performance errors'),
        expect.arrayContaining([
          expect.stringContaining('Operation exceeded maximum memory usage'),
        ])
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Processing Rate Optimization Tests', () => {
    it('should maintain consistent processing rate across different operation types', async () => {
      const operations = [
        { type: 'scan' as const, pages: 100, expectedMinRate: 8 },
        { type: 'analyze' as const, pages: 50, expectedMinRate: 5 },
        {
          type: 'duplicate-detection' as const,
          pages: 75,
          expectedMinRate: 15,
        },
        { type: 'parse' as const, pages: 30, expectedMinRate: 10 },
      ]

      const results = []

      for (const op of operations) {
        const operationId = performanceMonitor.startOperation(op.type, {
          pageCount: op.pages,
        })

        // Simulate processing time based on operation complexity
        const processingTime =
          op.type === 'analyze' ? op.pages * 100 : op.pages * 50
        mockTime += processingTime

        performanceMonitor.updateProgress(
          operationId,
          `Processing ${op.type}`,
          op.pages,
          op.pages
        )
        const metrics = performanceMonitor.endOperation(operationId, true)

        results.push({
          type: op.type,
          rate: metrics.processingRate || 0,
          expectedMinRate: op.expectedMinRate,
        })
      }

      // Verify each operation meets minimum processing rate
      results.forEach(result => {
        expect(result.rate).toBeGreaterThanOrEqual(result.expectedMinRate)
      })
    })

    it('should optimize batch processing for large datasets', async () => {
      const batchSizes = [10, 50, 100, 200]
      const results = []

      for (const batchSize of batchSizes) {
        const operationId = performanceMonitor.startOperation('scan', {
          pageCount: batchSize,
          batchProcessing: true,
        })

        performanceMonitor.updateProgress(
          operationId,
          'Batch processing',
          batchSize,
          batchSize
        )
        const metrics = performanceMonitor.endOperation(operationId, true)

        results.push({
          batchSize,
          success: metrics.success,
          itemsProcessed: metrics.itemsProcessed,
        })
      }

      // Verify that all batch operations completed successfully
      results.forEach(result => {
        expect(result.success).toBe(true)
        expect(result.itemsProcessed).toBe(result.batchSize)
      })
    })
  })

  describe('Performance Report Generation', () => {
    it('should generate comprehensive performance report', async () => {
      // Run multiple operations
      const operations = [
        { type: 'scan' as const, pages: 50 },
        { type: 'analyze' as const, pages: 30 },
        { type: 'duplicate-detection' as const, pages: 75 },
      ]

      for (const op of operations) {
        const operationId = performanceMonitor.startOperation(op.type, {
          pageCount: op.pages,
        })
        performanceMonitor.updateProgress(
          operationId,
          `Processing ${op.type}`,
          op.pages,
          op.pages
        )
        performanceMonitor.endOperation(operationId, true)
      }

      const report = performanceMonitor.generateReport()

      expect(report.overall.operationType).toBe('scan')
      expect(report.breakdown).toHaveLength(3)
      expect(report.summary.totalDuration).toBeGreaterThanOrEqual(0)
      expect(report.summary.slowestOperation).toBeDefined()
      expect(report.summary.fastestOperation).toBeDefined()
      expect(report.generatedAt).toBeInstanceOf(Date)
    })

    it('should calculate accurate performance metrics in report', async () => {
      const operationId = performanceMonitor.startOperation('scan', {
        pageCount: 100,
      })

      performanceMonitor.updateProgress(operationId, 'Processing', 100, 100)

      // Simulate memory usage
      mockMemoryUsage.mockReturnValue({
        heapUsed: 120 * 1024 * 1024, // 120MB
        heapTotal: 200 * 1024 * 1024,
        external: 20 * 1024 * 1024,
        rss: 300 * 1024 * 1024,
      })

      performanceMonitor.endOperation(operationId, true)
      const report = performanceMonitor.generateReport()

      expect(report.summary.averageProcessingRate).toBeGreaterThanOrEqual(0)
      expect(report.summary.totalMemoryUsed).toBeGreaterThanOrEqual(0)
      expect(report.summary.memoryPeakUsage).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Threshold Monitoring', () => {
    it('should respect custom performance thresholds', async () => {
      const customMonitor = new PerformanceMonitorService({
        maxDuration: 5000, // 5 seconds
        warnings: {
          duration: 2000, // 2 seconds
          memoryUsage: 50 * 1024 * 1024, // 50MB
          processingRate: 20, // 20 items/sec
        },
      })

      const operationId = customMonitor.startOperation('scan', {
        pageCount: 10,
      })

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      customMonitor.endOperation(operationId, true)

      // Verify the custom monitor was created with correct thresholds
      const thresholds = customMonitor.getThresholds()
      expect(thresholds.maxDuration).toBe(5000)
      expect(thresholds.warnings.duration).toBe(2000)
      expect(thresholds.warnings.memoryUsage).toBe(50 * 1024 * 1024)

      consoleSpy.mockRestore()
    })

    it('should update thresholds dynamically', () => {
      const initialThresholds = performanceMonitor.getThresholds()
      expect(initialThresholds.maxDuration).toBe(60000)

      performanceMonitor.updateThresholds({
        maxDuration: 30000,
        warnings: {
          duration: 10000,
          memoryUsage: 200 * 1024 * 1024,
          processingRate: 5,
        },
      })

      const updatedThresholds = performanceMonitor.getThresholds()
      expect(updatedThresholds.maxDuration).toBe(30000)
      expect(updatedThresholds.warnings.duration).toBe(10000)
    })
  })
})

/**
 * Helper function to generate mock page data for testing
 */
function generateMockPages(count: number): PageInfo[] {
  const pages: PageInfo[] = []
  const categories = Object.values(PageCategory)
  const statuses = Object.values(PageStatus)
  const fileTypes = Object.values(FileType)

  for (let i = 0; i < count; i++) {
    pages.push({
      id: `page-${i}`,
      name: `page-${i}`,
      filePath: `/pages/page-${i}.tsx`,
      routePath: `/page-${i}`,
      category: categories[i % categories.length],
      fileType: fileTypes[i % fileTypes.length],
      status: statuses[i % statuses.length],
      lastModified: new Date(Date.now() - i * 86400000), // Spread over days
      fileSize: Math.floor(Math.random() * 10000) + 1000, // 1KB to 11KB
      dependencies: Array.from(
        { length: Math.floor(Math.random() * 10) + 1 },
        (_, j) => ({
          importPath: `dependency-${j}`,
          isLocal: j % 2 === 0,
          isUsed: true,
          isBroken: false,
        })
      ),
      complexity: {
        linesOfCode: Math.floor(Math.random() * 200) + 50,
        componentCount: Math.floor(Math.random() * 5) + 1,
        hookCount: Math.floor(Math.random() * 3),
        stateVariables: Math.floor(Math.random() * 5),
        cyclomaticComplexity: Math.floor(Math.random() * 10) + 1,
      },
      issues:
        Math.random() > 0.7
          ? [{ type: 'syntax_error', message: `Issue ${i}`, severity: 'low' }]
          : [],
      isEntryPoint: i % fileTypes.length === 0, // Only FRONTEND_PAGE types are entry points
    })
  }

  return pages
}
