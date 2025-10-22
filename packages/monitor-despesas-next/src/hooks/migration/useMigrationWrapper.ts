
import { useContext } from 'react'
import { UseBoundStore, StoreApi } from 'zustand'
import { useContextToZustand, useMigrationProgress } from './useContextToZustand.js'

interface MigrationConfig<T> {
  name: string
  context: React.Context<T | undefined>
  store: UseBoundStore<StoreApi<T>>
  autoMigrate?: boolean
  preferZustand?: boolean
  debug?: boolean
}

export function useMigrationWrapper<T>(config: MigrationConfig<T>) {
  const {
    name,
    context,
    store,
    autoMigrate = true,
    preferZustand = true,
    debug = process.env.NODE_ENV === 'development'
  } = config

  const contextValue = useContext(context)
  
  const migratedData = useContextToZustand(contextValue, store, {
    autoMigrate,
    preferZustand,
    debug,
    name
  })

  return migratedData
}


export function useGlobalDataMigration() {
  const UnifiedMicroContextProvider = require('@/contexts/UnifiedMicroContextProvider').UnifiedMicroContextProvider
  const { useGlobalStore } = require('@/stores/global.store')

  return useMigrationWrapper({
    name: 'GlobalData',
    context: UnifiedMicroContextProvider,
    store: useGlobalStore,
    autoMigrate: true,
    preferZustand: false, // Start with Context until we verify Zustand implementation
  })
}

export function useFornecedoresDataMigration() {
  const FornecedoresDataContext = require('@/contexts/FornecedoresDataContext').FornecedoresDataContext
  const { useFornecedoresStore } = require('@/stores/fornecedores.store')

  return useMigrationWrapper({
    name: 'FornecedoresData',
    context: FornecedoresDataContext,
    store: useFornecedoresStore,
    autoMigrate: true,
    preferZustand: false, // Start with Context until we verify Zustand implementation
  })
}

export function useDeputiesDataMigration() {
  const { useDeputyStore } = require('@/features/deputies/stores/deputy.store')

  return useDeputyStore()
}

export function useAppMigrationStatus() {
  const globalMigration = useGlobalDataMigration()
  const fornecedoresMigration = useFornecedoresDataMigration()
  
  useMigrationProgress([
    {
      name: 'GlobalData',
      hasContext: !!globalMigration,
      hasZustand: globalMigration._migrationStatus !== 'context',
      preferZustand: false, // Will be enabled later
    },
    {
      name: 'FornecedoresData', 
      hasContext: !!fornecedoresMigration,
      hasZustand: fornecedoresMigration._migrationStatus !== 'context',
      preferZustand: false, // Will be enabled later
    },
  ])

  return {
    global: globalMigration,
    fornecedores: fornecedoresMigration,
    migrationStatus: {
      global: globalMigration._migrationStatus,
      fornecedores: fornecedoresMigration._migrationStatus,
    }
  }
}


export function useMigratedGlobalData() {
  const migration = useGlobalDataMigration()
  
  const { _migrationStatus, ...data } = migration
  
  return {
    ...data,
    isFromContext: _migrationStatus === 'context',
    isFromZustand: _migrationStatus === 'zustand',
    isHybrid: _migrationStatus === 'hybrid',
  }
}

export function useMigratedFornecedoresData() {
  const migration = useFornecedoresDataMigration()
  
  const { _migrationStatus, ...data } = migration
  
  return {
    ...data,
    isFromContext: _migrationStatus === 'context',
    isFromZustand: _migrationStatus === 'zustand', 
    isHybrid: _migrationStatus === 'hybrid',
  }
}

export enum MigrationPhase {
  CONTEXT_ONLY = 'context-only',           // Using only Context API
  HYBRID_CONTEXT = 'hybrid-context',       // Both available, prefer Context
  HYBRID_ZUSTAND = 'hybrid-zustand',       // Both available, prefer Zustand  
  ZUSTAND_ONLY = 'zustand-only',           // Using only Zustand
}

interface MigrationPhaseConfig {
  globalData: MigrationPhase
  fornecedoresData: MigrationPhase
}

let migrationPhases: MigrationPhaseConfig = {
  globalData: MigrationPhase.HYBRID_CONTEXT,
  fornecedoresData: MigrationPhase.HYBRID_CONTEXT,
}

export function setMigrationPhases(phases: Partial<MigrationPhaseConfig>) {
  migrationPhases = { ...migrationPhases, ...phases }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Migration phases updated:', migrationPhases)
  }
}

export function getMigrationPhase(dataType: keyof MigrationPhaseConfig): MigrationPhase {
  return migrationPhases[dataType]
}

export function useAdvancedMigration<T>(config: MigrationConfig<T> & {
  phaseOverride?: MigrationPhase
}) {
  const { phaseOverride, ...migrationConfig } = config
  const currentPhase = phaseOverride || getMigrationPhase(config.name as keyof MigrationPhaseConfig)
  
  const adjustedConfig = {
    ...migrationConfig,
    autoMigrate: currentPhase !== MigrationPhase.CONTEXT_ONLY,
    preferZustand: currentPhase === MigrationPhase.HYBRID_ZUSTAND || currentPhase === MigrationPhase.ZUSTAND_ONLY,
  }
  
  return useMigrationWrapper(adjustedConfig)
}

export const MigrationUtils = {
  enableZustandGlobally: () => {
    if (process.env.NODE_ENV === 'development') {
      setMigrationPhases({
        globalData: MigrationPhase.HYBRID_ZUSTAND,
        fornecedoresData: MigrationPhase.HYBRID_ZUSTAND,
      })
      console.log('🎯 Enabled Zustand preference globally (dev mode)')
    }
  },
  
  resetToContext: () => {
    if (process.env.NODE_ENV === 'development') {
      setMigrationPhases({
        globalData: MigrationPhase.HYBRID_CONTEXT,
        fornecedoresData: MigrationPhase.HYBRID_CONTEXT,
      })
      console.log('📊 Reset to Context preference (dev mode)')
    }
  },
  
  goFullZustand: () => {
    if (process.env.NODE_ENV === 'development') {
      setMigrationPhases({
        globalData: MigrationPhase.ZUSTAND_ONLY,
        fornecedoresData: MigrationPhase.ZUSTAND_ONLY,
      })
      console.log('🚀 Switched to Zustand-only mode (dev mode)')
    }
  }
}

if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).MigrationUtils = MigrationUtils
}

export default useMigrationWrapper