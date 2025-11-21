import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createLogger } from '../lib/logger'

describe('logger', () => {
  const originalEnv = { ...process.env }
  let debugSpy: ReturnType<typeof vi.spyOn>
  let infoSpy: ReturnType<typeof vi.spyOn>
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.NEXT_PUBLIC_LOG_LEVEL = 'debug'
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    vi.restoreAllMocks()
  })

  it('logs messages according to level with namespace', () => {
    const log = createLogger('test:ns')
    log.debug('debug message', { a: 1 })
    log.info('info message')
    log.warn('warn message')
    log.error('error message', new Error('boom'))

    expect(debugSpy).toHaveBeenCalled()
    expect(infoSpy).toHaveBeenCalled()
    expect(warnSpy).toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalled()
  })
})