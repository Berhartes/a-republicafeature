/**
 * Extrai o CNPJ do objeto `query` do Next Router de forma resiliente.
 * - Aceita string ou array
 * - Faz decode de URL quando necessário
 */
export function getCnpjFromRoute(query: Record<string, any> | undefined): string | undefined {
  if (!query) return undefined
  const raw = query.cnpj as string | string[] | undefined
  if (!raw) return undefined
  const value = Array.isArray(raw) ? raw[0] : raw
  if (!value) return undefined
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export default getCnpjFromRoute