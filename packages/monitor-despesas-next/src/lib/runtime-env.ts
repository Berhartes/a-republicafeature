
export type RuntimeEnv = Record<string, string | undefined>

function readImportMetaEnv(): RuntimeEnv {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env as RuntimeEnv
  }
  return {}
}

function readProcessEnv(): RuntimeEnv {
  if (typeof process !== 'undefined' && process.env) {
    return process.env as unknown as RuntimeEnv
  }
  return {}
}

const cachedRuntimeEnv: RuntimeEnv = {
  ...readProcessEnv(),
  ...readImportMetaEnv()
}

export function getRuntimeEnv(): RuntimeEnv {
  return cachedRuntimeEnv
}

export function getEnvVar(key: string, fallback?: string): string | undefined {
  const value = cachedRuntimeEnv[key]
  return value ?? fallback
}

export function isNodeEnvironment(): boolean {
  return typeof process !== 'undefined' && !!process.versions?.node
}

export function safeProcess(): typeof process | undefined {
  return typeof process !== 'undefined' ? process : undefined
}
