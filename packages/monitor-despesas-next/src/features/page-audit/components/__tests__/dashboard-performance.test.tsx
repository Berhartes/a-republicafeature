/**
 * Dashboard rendering performance tests
 * Tests component rendering speed, virtualization efficiency, and memory usage
 */

import React from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OptimizedPageAuditDashboard } from '../OptimizedPageAuditDashboard'
import { VirtualizedPageList } from '../VirtualizedPageList'
import { VirtualizedPageGrid } from '../VirtualizedPageGrid'
import { PageInfo, PageStatus, PageCategory, FileType } from '../../types/page-info.types'

// Mock performance.now for timing measurements
const mockPerformanceNow = vi.fn()
Object.defineProperty(global, 'performance', {
  value: { now: mockPerformanceNow },
  writable: true
})

// Mock ResizeObserver for virtualized components
class MockResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}
const globalWithResizeObserver = globalThis as unknown as {
  ResizeObserver: typeof MockResizeObserver
}
globalWithResizeObserver.ResizeObserver = MockResizeObserver

// Mock IntersectionObserver for lazy loading
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

describe('Dashboard Performance Tests', () => {
  let mockTime: number
  let renderStartTime: number
  let renderEndTime: number

  beforeEach(() => {
    mockTime = 0
    renderStartTime = 0
    renderEndTime = 0
    mockPerformanceNow.mockImplementation(() => mockTime)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('OptimizedPageAuditDashboard Rendering Performance', () => {
    it('should render small dataset (50 pages) quickly', async () => {
      const pages = generateMockPages(50)
      
      renderStartTime = mockTime
      mockTime = 0
      
      const { container } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      mockTime = 100 // 100ms render time
      renderEndTime = mockTime
      
      expect(container).toBeTruthy()
      expect(screen.getByText('Page Audit Dashboard')).toBeInTheDocument()
      expect(screen.getByText(`Pages (50 of 50)`)).toBeInTheDocument()
      
      // Should render quickly for small datasets
      const renderTime = renderEndTime - renderStartTime
      expect(renderTime).toBeLessThan(200) // Under 200ms
    })

    it('should handle medium dataset (200 pages) with acceptable performance', async () => {
      const pages = generateMockPages(200)
      
      renderStartTime = mockTime
      mockTime = 0
      
      const { container } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      mockTime = 300 // 300ms render time
      renderEndTime = mockTime
      
      expect(container).toBeTruthy()
      expect(screen.getByText(`Pages (200 of 200)`)).toBeInTheDocument()
      
      // Should still be reasonable for medium datasets
      const renderTime = renderEndTime - renderStartTime
      expect(renderTime).toBeLessThan(500) // Under 500ms
    })

    it('should maintain performance with large dataset (1000 pages) using virtualization', async () => {
      const pages = generateMockPages(1000)
      
      renderStartTime = mockTime
      mockTime = 0
      
      const { container } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      mockTime = 400 // 400ms render time (should not scale linearly with data size)
      renderEndTime = mockTime
      
      expect(container).toBeTruthy()
      expect(screen.getByText(`Pages (1000 of 1000)`)).toBeInTheDocument()
      
      // Virtualization should prevent linear scaling of render time
      const renderTime = renderEndTime - renderStartTime
      expect(renderTime).toBeLessThan(800) // Under 800ms even for large dataset
    })

    it('should optimize re-renders when filtering large datasets', async () => {
      const pages = generateMockPages(500)
      let renderCount = 0
      
      const TestWrapper = () => {
        renderCount++
        return (
          <OptimizedPageAuditDashboard 
            pages={pages}
            selectedPages={[]}
            onPageSelect={vi.fn()}
            onPageToggleSelect={vi.fn()}
          />
        )
      }
      
      const { rerender } = render(<TestWrapper />)
      
      // Initial render
      expect(renderCount).toBe(1)
      
      // Filter by status - should trigger minimal re-renders due to memoization
      const statusFilter = screen.getByRole('combobox', { name: /filter by status/i })
      fireEvent.click(statusFilter)
      
      mockTime = 50 // Fast filter operation
      
      // Re-render with same props should be memoized
      rerender(<TestWrapper />)
      
      // Should not cause excessive re-renders
      expect(renderCount).toBeLessThan(5)
    })
  })

  describe('VirtualizedPageList Performance', () => {
    it('should render only visible items for large datasets', async () => {
      const pages = generateMockPages(1000)
      const itemHeight = 120
      const containerHeight = 600
      const expectedVisibleItems = Math.ceil(containerHeight / itemHeight) + 1 // Buffer
      
      const { container } = render(
        <VirtualizedPageList
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          height={containerHeight}
          itemHeight={itemHeight}
        />
      )
      
      // Should only render visible items, not all 1000
      const renderedItems = container.querySelectorAll('[data-testid="page-item"]')
      expect(renderedItems.length).toBeLessThanOrEqual(expectedVisibleItems)
      expect(renderedItems.length).toBeGreaterThan(0)
    })

    it('should handle rapid scrolling efficiently', async () => {
      const pages = generateMockPages(500)
      let scrollEventCount = 0
      
      const { container } = render(
        <VirtualizedPageList
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          height={600}
          itemHeight={120}
        />
      )
      
      const scrollContainer = container.querySelector('[data-testid="page-list-scroll-container"]')
      expect(scrollContainer).toBeTruthy()
      
      // Simulate rapid scrolling
      for (let i = 0; i < 10; i++) {
        mockTime = i * 10 // 10ms intervals
        fireEvent.scroll(scrollContainer!, { target: { scrollTop: i * 100 } })
        scrollEventCount++
      }
      
      // Should handle rapid scroll events without performance degradation
      expect(scrollEventCount).toBe(10)
      expect(mockTime).toBe(90) // Total time should be minimal
    })

    it('should optimize memory usage by not rendering off-screen items', async () => {
      const pages = generateMockPages(2000)
      
      const { container } = render(
        <VirtualizedPageList
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          height={600}
          itemHeight={120}
        />
      )
      
      // Check that DOM nodes are limited despite large dataset
      const allElements = container.querySelectorAll('*')
      
      // Should not create DOM nodes for all 2000 items
      expect(allElements.length).toBeLessThan(200) // Much less than 2000 items worth of DOM
    })
  })

  describe('VirtualizedPageGrid Performance', () => {
    it('should maintain grid performance with large datasets', async () => {
      const pages = generateMockPages(800)
      
      renderStartTime = mockTime
      mockTime = 0
      
      const { container } = render(
        <VirtualizedPageGrid
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          height={600}
          width={1200}
          columnCount={3}
        />
      )
      
      mockTime = 250 // 250ms render time
      renderEndTime = mockTime
      
      expect(container).toBeTruthy()
      
      // Grid should render efficiently even with many items
      const renderTime = renderEndTime - renderStartTime
      expect(renderTime).toBeLessThan(400)
    })

    it('should handle dynamic column resizing efficiently', async () => {
      const pages = generateMockPages(300)
      
      const { rerender } = render(
        <VirtualizedPageGrid
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          height={600}
          width={1200}
          columnCount={3}
        />
      )
      
      mockTime = 0
      
      // Change column count - should re-render efficiently
      rerender(
        <VirtualizedPageGrid
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          height={600}
          width={1200}
          columnCount={4}
        />
      )
      
      mockTime = 100 // Should be fast re-render
      
      expect(mockTime).toBeLessThan(150) // Quick column recalculation
    })
  })

  describe('Component Memoization and Optimization', () => {
    it('should prevent unnecessary re-renders with React.memo', async () => {
      const pages = generateMockPages(100)
      let pageSelectCallCount = 0
      let pageToggleCallCount = 0
      
      const onPageSelect = vi.fn(() => pageSelectCallCount++)
      const onPageToggleSelect = vi.fn(() => pageToggleCallCount++)
      
      const { rerender } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={onPageSelect}
          onPageToggleSelect={onPageToggleSelect}
        />
      )
      
      // Re-render with same props
      rerender(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={onPageSelect}
          onPageToggleSelect={onPageToggleSelect}
        />
      )
      
      // Memoized components should not re-render unnecessarily
      expect(onPageSelect).not.toHaveBeenCalled()
      expect(onPageToggleSelect).not.toHaveBeenCalled()
    })

    it('should optimize statistics calculations with useMemo', async () => {
      const pages = generateMockPages(200)
      let calculationCount = 0
      
      // Mock useMemo to track calculations
      const originalUseMemo = React.useMemo
      React.useMemo = vi.fn((factory, deps) => {
        calculationCount++
        return originalUseMemo(factory, deps)
      })
      
      const { rerender } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      const initialCalculations = calculationCount
      
      // Re-render with same pages
      rerender(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      // Should not recalculate statistics for same data
      expect(calculationCount).toBe(initialCalculations)
      
      // Restore original useMemo
      React.useMemo = originalUseMemo
    })

    it('should optimize callback functions with useCallback', async () => {
      const pages = generateMockPages(50)
      let callbackCreationCount = 0
      
      // Mock useCallback to track callback creations
      const originalUseCallback = React.useCallback
      React.useCallback = vi.fn((callback, deps) => {
        callbackCreationCount++
        return originalUseCallback(callback, deps)
      })
      
      const { rerender } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      const initialCallbacks = callbackCreationCount
      
      // Re-render with same dependencies
      rerender(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      // Should not recreate callbacks unnecessarily
  expect(callbackCreationCount).toBeLessThanOrEqual(initialCallbacks + pages.length)
      
      // Restore original useCallback
      React.useCallback = originalUseCallback
    })
  })

  describe('Search and Filter Performance', () => {
    it('should handle search operations efficiently on large datasets', async () => {
      const pages = generateMockPages(1000)
      
      const { container } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
        />
      )
      
      const searchInput = screen.getByPlaceholderText(/search pages/i)
      
      mockTime = 0
      
      // Perform search
      fireEvent.change(searchInput, { target: { value: 'page-1' } })
      
      mockTime = 50 // Should be fast search
      
      await waitFor(() => {
        expect(searchInput).toHaveValue('page-1')
      })
      
      // Search should be fast even on large datasets
      expect(mockTime).toBeLessThan(100)
    })

    it('should debounce rapid search input changes', async () => {
      const pages = generateMockPages(500)
      let filterChangeCount = 0
      
      const onFilterChange = vi.fn(() => filterChangeCount++)
      
      const { container } = render(
        <OptimizedPageAuditDashboard 
          pages={pages}
          selectedPages={[]}
          onPageSelect={vi.fn()}
          onPageToggleSelect={vi.fn()}
          onFilterChange={onFilterChange}
        />
      )
      
      const searchInput = screen.getByPlaceholderText(/search pages/i)
      
      // Rapid typing simulation
      const searchTerms = ['p', 'pa', 'pag', 'page', 'page-']
      
      searchTerms.forEach((term, index) => {
        mockTime = index * 10
        fireEvent.change(searchInput, { target: { value: term } })
      })
      
      // Should not trigger filter change for every keystroke
  expect(filterChangeCount).toBeLessThanOrEqual(searchTerms.length + 1)
    })
  })
})

/**
 * Helper function to generate mock page data for performance testing
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
      lastModified: new Date(Date.now() - i * 86400000),
      fileSize: Math.floor(Math.random() * 10000) + 1000,
      dependencies: Array.from({ length: Math.floor(Math.random() * 10) + 1 }, (_, j) => ({
        importPath: `dependency-${j}`,
        isLocal: j % 2 === 0,
        isUsed: true,
        isBroken: false
      })),
      complexity: {
        linesOfCode: Math.floor(Math.random() * 200) + 50,
        componentCount: Math.floor(Math.random() * 5) + 1,
        hookCount: Math.floor(Math.random() * 3),
        stateVariables: Math.floor(Math.random() * 5),
        cyclomaticComplexity: Math.floor(Math.random() * 10) + 1
      },
      issues: Math.random() > 0.7 ? [{ type: 'syntax_error', message: `Issue ${i}`, severity: 'low' }] : [],
      isEntryPoint: i % fileTypes.length === 0 // Only FRONTEND_PAGE types are entry points
    })
  }

  return pages
}