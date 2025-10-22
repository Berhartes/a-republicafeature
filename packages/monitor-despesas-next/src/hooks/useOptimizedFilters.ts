import { useState, useMemo, useEffect, useTransition, useCallback } from 'react'
import { useEventBus } from '@/lib/event-bus'

export interface OptimizedFilterConfig<T, F> {
  data: T[]
  initialFilters: F
  filterFn: (items: T[], filters: F) => T[]
  sortFn?: (items: T[], sortBy: string) => T[]
  chunkSize?: number
}

export interface OptimizedFilterState<T, F> {
  filteredData: T[]
  isPending: boolean
  isFiltering: boolean
  
  filters: F
  
  inputFilters: F
  
  updateFilter: <K extends keyof F>(key: K, value: F[K], immediate?: boolean) => void
  resetFilters: () => void
  
  totalFiltered: number
  processingTime: number
}

export function useOptimizedFilters<T, F extends Record<string, any>>({
  data,
  initialFilters,
  filterFn,
  sortFn,
  chunkSize = 1000
}: OptimizedFilterConfig<T, F>): OptimizedFilterState<T, F> {
  
  const { emit } = useEventBus()
  const [isPending, startTransition] = useTransition()
  
  const [inputFilters, setInputFilters] = useState<F>(initialFilters)
  
  const [filters, setFilters] = useState<F>(initialFilters)
  
  const [isFiltering, setIsFiltering] = useState(false)
  const [processingTime, setProcessingTime] = useState(0)

  const filteredData = useMemo(() => {
    const startTime = Date.now()
    setIsFiltering(true)
    
    emit('filter:applied', {
      filterType: 'bulk',
      filterValue: filters,
      resultCount: 0, // Will be updated below
      timestamp: startTime
    })

    let result: T[]
    
    if (data.length > chunkSize) {
      result = processInChunks(data, filters, filterFn, chunkSize)
    } else {
      result = filterFn(data, filters)
    }
    
    if (sortFn && 'sortBy' in filters) {
      result = sortFn(result, filters.sortBy as string)
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    setProcessingTime(duration)
    setIsFiltering(false)
    
    emit('filter:applied', {
      filterType: 'bulk',
      filterValue: filters,
      resultCount: result.length,
      timestamp: endTime
    })
    
    console.log(`🔍 Filtered ${result.length}/${data.length} items in ${duration}ms`)
    
    return result
  }, [data, filters, filterFn, sortFn, chunkSize, emit])

  const updateFilter = useCallback(<K extends keyof F>(
    key: K, 
    value: F[K], 
    immediate: boolean = false
  ) => {
    setInputFilters(prev => ({ ...prev, [key]: value }))
    
    if (immediate) {
      setFilters(prev => ({ ...prev, [key]: value }))
    } else {
      startTransition(() => {
        setFilters(prev => ({ ...prev, [key]: value }))
      })
    }
  }, [])

  const resetFilters = useCallback(() => {
    setInputFilters(initialFilters)
    
    startTransition(() => {
      setFilters(initialFilters)
    })
    
    emit('filter:cleared', {
      timestamp: Date.now()
    })
  }, [initialFilters, emit])

  useEffect(() => {
    if (!isPending && JSON.stringify(inputFilters) !== JSON.stringify(filters)) {
      const timeoutId = setTimeout(() => {
        startTransition(() => {
          setFilters(inputFilters)
        })
      }, 300) // Debounce delay

      return () => clearTimeout(timeoutId)
    }
    return undefined
  }, [inputFilters, filters, isPending])

  return {
    filteredData,
    isPending,
    isFiltering,
    filters: inputFilters, // Return input filters for immediate UI updates
    inputFilters,
    updateFilter,
    resetFilters,
    totalFiltered: filteredData.length,
    processingTime
  }
}

function processInChunks<T, F>(
  data: T[], 
  filters: F, 
  filterFn: (items: T[], filters: F) => T[],
  chunkSize: number
): T[] {
  const chunks: T[][] = []
  
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize))
  }
  
  const results: T[] = []
  for (const chunk of chunks) {
    const chunkResult = filterFn(chunk, filters)
    results.push(...chunkResult)
  }
  
  return results
}

export function useOptimizedSearch<T>(
  data: T[],
  searchFn: (items: T[], term: string) => T[],
  debounceMs: number = 300
) {
  const { emit } = useEventBus()
  const [isPending, startTransition] = useTransition()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedTerm, setDebouncedTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        setDebouncedTerm(searchTerm)
      })
    }, debounceMs)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, debounceMs])

  const searchResults = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return data
    }

    setIsSearching(true)
    const startTime = Date.now()
    
    const results = searchFn(data, debouncedTerm)
    
    const duration = Date.now() - startTime
    setIsSearching(false)
    
    emit('filter:applied', {
      filterType: 'search',
      filterValue: debouncedTerm,
      resultCount: results.length,
      timestamp: Date.now()
    })
    
    console.log(`🔍 Search for "${debouncedTerm}" found ${results.length} results in ${duration}ms`)
    
    return results
  }, [data, debouncedTerm, searchFn, emit])

  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const clearSearch = useCallback(() => {
    setSearchTerm('')
    setDebouncedTerm('')
    
    emit('filter:cleared', {
      filterType: 'search',
      timestamp: Date.now()
    })
  }, [emit])

  return {
    searchTerm,
    searchResults,
    isPending,
    isSearching,
    updateSearchTerm,
    clearSearch,
    resultCount: searchResults.length
  }
}

export function useOptimizedRangeFilter<T>(
  data: T[],
  getValue: (item: T) => number,
  initialMin: number = 0,
  initialMax: number = Infinity
) {
  const [isPending, startTransition] = useTransition()
  
  const [minValue, setMinValue] = useState(initialMin)
  const [maxValue, setMaxValue] = useState(initialMax)
  
  const [debouncedMin, setDebouncedMin] = useState(initialMin)
  const [debouncedMax, setDebouncedMax] = useState(initialMax)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      startTransition(() => {
        setDebouncedMin(minValue)
        setDebouncedMax(maxValue)
      })
    }, 100) // Shorter debounce for ranges

    return () => clearTimeout(timeoutId)
  }, [minValue, maxValue])

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const value = getValue(item)
      return value >= debouncedMin && value <= debouncedMax
    })
  }, [data, debouncedMin, debouncedMax, getValue])

  const updateRange = useCallback((min: number, max: number) => {
    setMinValue(min)
    setMaxValue(max)
  }, [])

  const updateMin = useCallback((min: number) => {
    setMinValue(min)
  }, [])

  const updateMax = useCallback((max: number) => {
    setMaxValue(max)
  }, [])

  const resetRange = useCallback(() => {
    setMinValue(initialMin)
    setMaxValue(initialMax)
    startTransition(() => {
      setDebouncedMin(initialMin)
      setDebouncedMax(initialMax)
    })
  }, [initialMin, initialMax])

  return {
    minValue,
    maxValue,
    filteredData,
    isPending,
    updateRange,
    updateMin,
    updateMax,
    resetRange,
    resultCount: filteredData.length
  }
}