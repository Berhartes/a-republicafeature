import { describe, it, expect } from 'vitest'

describe('not-found pages exist and export components', () => {
  it('root not-found exports a component', async () => {
    const mod = await import('../app/not-found')
    expect(typeof mod.default).toBe('function')
  })

  it('fornecedores not-found exports a component', async () => {
    const mod = await import('../app/gastos/fornecedores/not-found')
    expect(typeof mod.default).toBe('function')
  })
})