
export {
  useContextToZustand,
  useDeprecatedContext,
  useMigrationProgress,
  default as useContextToZustandDefault
} from './useContextToZustand.js'

export {
  useMigrationWrapper,
  useGlobalDataMigration,
  useFornecedoresDataMigration,
  useDeputiesDataMigration,
  useAppMigrationStatus,
  useMigratedGlobalData,
  useMigratedFornecedoresData,
  useAdvancedMigration,
  setMigrationPhases,
  getMigrationPhase,
  MigrationPhase,
  MigrationUtils,
  default as useMigrationWrapperDefault
} from './useMigrationWrapper.js'

export type { MigrationPhase as MigrationPhaseType } from './useMigrationWrapper.js'


export { useMigratedGlobalData as useGlobalData } from './useMigrationWrapper.js'
export { useMigratedFornecedoresData as useFornecedoresData } from './useMigrationWrapper.js'
export { useDeputiesDataMigration as useDeputiesData } from './useMigrationWrapper.js'

export { MigrationUtils } from './useMigrationWrapper.js'

export { useAppMigrationStatus } from './useMigrationWrapper.js'

