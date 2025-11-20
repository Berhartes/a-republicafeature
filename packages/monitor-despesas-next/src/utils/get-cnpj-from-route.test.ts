import { describe, it, expect } from 'vitest'
import { getCnpjFromRoute } from './get-cnpj-from-route'

describe('getCnpjFromRoute', () => {
  it('retorna undefined quando query está vazio', () => {
    expect(getCnpjFromRoute(undefined)).toBeUndefined()
    expect(getCnpjFromRoute({})).toBeUndefined()
  })

  it('extrai string simples', () => {
    expect(getCnpjFromRoute({ cnpj: '07319323000191' })).toBe('07319323000191')
  })

  it('extrai primeiro item quando array', () => {
    expect(getCnpjFromRoute({ cnpj: ['07319323000191', 'x'] })).toBe('07319323000191')
  })

  it('decodifica valor URL-encoded', () => {
    expect(getCnpjFromRoute({ cnpj: '47.029.518%2F0001-11' })).toBe('47.029.518/0001-11')
  })
})