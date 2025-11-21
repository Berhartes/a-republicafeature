import { createLogger } from './lib/logger'
import { getEnv } from './lib/env'

// Next.js executa esta função na inicialização do app (Node/Edge),
// ideal para configurar métricas, traces e observabilidade.
export async function register() {
  const log = createLogger('instrumentation')

  try {
    const runtime = process.env.NEXT_RUNTIME || 'nodejs'
    const envVars = getEnv()
    log.debug('Instrumentation initialized', { runtime, env: process.env.NODE_ENV, envVars })
  } catch (err) {
    log.error('Instrumentation failed to initialize', err)
  }
}
