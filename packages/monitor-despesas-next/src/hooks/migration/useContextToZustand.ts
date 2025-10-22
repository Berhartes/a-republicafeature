
import { useEffect, useRef, useState } from 'react'
import { StoreApi, UseBoundStore } from 'zustand'

export function useContextToZustand<T>(
  contextValue: T | undefined,
  zustandStore: UseBoundStore<StoreApi<T>>,
  migrationConfig: {
    autoMigrate?: boolean
    
    preferZustand?: boolean
    
    debug?: boolean
    
    name?: string
  } = {}
): T & { _migrationStatus: 'context' | 'zustand' | 'hybrid' } {
  
  const {
    autoMigrate = true,
    preferZustand = true,
    debug = process.env.NODE_ENV === 'development',
    name = 'unknown'
  } = migrationConfig

  const [migrationStatus, setMigrationStatus] = useState<'context' | 'zustand' | 'hybrid'>('context')
  const migrationStarted = useRef(false)
  const zustandData = zustandStore()

  useEffect(() => {
    if (!autoMigrate || migrationStarted.current) return

    if (contextValue && !hasZustandData(zustandData)) {
      migrationStarted.current = true
      
      if (debug) {
        console.log(`🔄 [Migration ${name}] Starting auto-migration from Context to Zustand`)
      }

      migrateContextToStore(contextValue, zustandStore, name)
      setMigrationStatus('hybrid')
    }
  }, [contextValue, zustandData, autoMigrate, debug, name, zustandStore])

  const hasContext = !!contextValue
  const hasZustand = hasZustandData(zustandData)
  
  useEffect(() => {
    if (hasContext && hasZustand) {
      setMigrationStatus('hybrid')
    } else if (hasZustand) {
      setMigrationStatus('zustand')
    } else if (hasContext) {
      setMigrationStatus('context')
    }
  }, [hasContext, hasZustand])

  let selectedData: T
  let source: 'context' | 'zustand' | 'hybrid'

  if (preferZustand && hasZustand) {
    selectedData = zustandData
    source = 'zustand'
    
    if (debug && hasContext) {
      console.log(`✅ [Migration ${name}] Using Zustand data (Context available but not preferred)`)
    }
  } else if (hasContext) {
    selectedData = contextValue
    source = 'context'
    
    if (debug) {
      console.log(`📊 [Migration ${name}] Using Context data (Zustand not ready)`)
    }
  } else if (hasZustand) {
    selectedData = zustandData
    source = 'zustand'
    
    if (debug) {
      console.log(`🎯 [Migration ${name}] Using Zustand data (Context not available)`)
    }
  } else {
    selectedData = {} as T
    source = 'context'
    
    if (debug) {
      console.warn(`⚠️ [Migration ${name}] No data available from Context or Zustand`)
    }
  }

  return {
    ...selectedData,
    _migrationStatus: source,
  }
}

function hasZustandData<T>(data: T): boolean {
  if (!data || typeof data !== 'object') return false
  
  const keys = Object.keys(data)
  if (keys.length === 0) return false
  
  return keys.some(key => {
    const value = (data as any)[key]
    
    if (Array.isArray(value)) {
      return value.length > 0
    }
    
    if (value && typeof value === 'object') {
      return Object.keys(value).length > 0
    }
    
    return value !== null && value !== undefined && value !== '' && value !== 0
  })
}

function migrateContextToStore<T>(
  contextData: T,
  zustandStore: UseBoundStore<StoreApi<T>>,
  name: string
) {
  try {
    const currentState = zustandStore.getState()
    
    const mergedState = mergeStates(currentState, contextData)
    
    zustandStore.setState(mergedState)
    
    console.log(`✅ [Migration ${name}] Successfully migrated Context data to Zustand`)
    
  } catch (error) {
    console.error(`❌ [Migration ${name}] Failed to migrate Context data:`, error)
  }
}

function mergeStates<T>(zustandState: T, contextState: T): T {
  if (!contextState || typeof contextState !== 'object') {
    return zustandState
  }
  
  const merged = { ...zustandState }
  
  Object.entries(contextState as Record<string, any>).forEach(([key, contextValue]) => {
    const zustandValue = (zustandState as any)[key]
    
    if (isMeaningfulValue(contextValue)) {
      (merged as any)[key] = contextValue
    } else if (!isMeaningfulValue(zustandValue) && contextValue !== undefined) {
      (merged as any)[key] = contextValue
    }
  })
  
  return merged
}

function isMeaningfulValue(value: any): boolean {
  if (value === null || value === undefined) return false
  if (value === '' || value === 0) return false
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  if (typeof value === 'boolean') return true // booleans are always meaningful
  return !!value
}

export function useDeprecatedContext<T>(
  contextValue: T | undefined,
  deprecationConfig: {
    name: string
    migrationGuide?: string
    warnAfter?: Date
    errorAfter?: Date
  }
): T | undefined {
  
  const {
    name,
    migrationGuide = 'Please migrate to the corresponding Zustand store',
    warnAfter,
    errorAfter
  } = deprecationConfig

  const now = new Date()

  useEffect(() => {
    if (contextValue) {
      if (errorAfter && now > errorAfter) {
        console.error(
          `🚨 [DEPRECATED] Context ${name} is deprecated and will be removed! ` +
          `${migrationGuide}`
        )
        throw new Error(`Context ${name} is deprecated. ${migrationGuide}`)
      }
      
      if (warnAfter && now > warnAfter) {
        console.warn(
          `⚠️ [DEPRECATED] Context ${name} is deprecated. ` +
          `${migrationGuide}`
        )
      }
    }
  }, [contextValue, name, migrationGuide, warnAfter, errorAfter, now])

  return contextValue
}

export function useMigrationProgress(migrations: Array<{
  name: string
  hasContext: boolean
  hasZustand: boolean
  preferZustand: boolean
}>) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const total = migrations.length
    const completed = migrations.filter(m => !m.hasContext || (m.hasZustand && m.preferZustand)).length
    const inProgress = migrations.filter(m => m.hasContext && m.hasZustand).length
    const notStarted = migrations.filter(m => m.hasContext && !m.hasZustand).length

    console.group('🔄 Migration Progress')
    console.log(`Total migrations: ${total}`)
    console.log(`✅ Completed: ${completed} (${Math.round(completed / total * 100)}%)`)
    console.log(`🔄 In Progress: ${inProgress}`)
    console.log(`❌ Not Started: ${notStarted}`)
    console.groupEnd()

    if (notStarted > 0) {
      console.group('❌ Not Started Migrations:')
      migrations.filter(m => m.hasContext && !m.hasZustand).forEach(m => {
        console.log(`- ${m.name}`)
      })
      console.groupEnd()
    }

    if (inProgress > 0) {
      console.group('🔄 In Progress Migrations:')
      migrations.filter(m => m.hasContext && m.hasZustand && !m.preferZustand).forEach(m => {
        console.log(`- ${m.name} (set preferZustand: true when ready)`)
      })
      console.groupEnd()
    }
  }, [migrations])
}

export default useContextToZustand