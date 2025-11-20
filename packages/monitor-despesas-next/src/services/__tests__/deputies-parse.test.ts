import { describe, it, expect } from 'vitest'
import { parseDeputiesCache } from '@/app/gastos/actions/analytics'

describe('parseDeputiesCache', () => {
  it('deve aceitar array na raiz', () => {
    const payload = [{ id: 1 }, { id: 2 }]
    const result = parseDeputiesCache(payload)
    expect(Array.isArray(result.deputados)).toBe(true)
    expect(result.deputados.length).toBe(2)
  })

  it('deve aceitar objeto com deputados', () => {
    const payload = { deputados: [{ id: 3 }] }
    const result = parseDeputiesCache(payload)
    expect(result.deputados.length).toBe(1)
    expect(result.deputados[0].id).toBe(3)
  })

  it('deve aceitar objeto com data.deputados', () => {
    const payload = { data: { deputados: [{ id: 4 }] } }
    const result = parseDeputiesCache(payload)
    expect(result.deputados.length).toBe(1)
    expect(result.deputados[0].id).toBe(4)
  })
})
