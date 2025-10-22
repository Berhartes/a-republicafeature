
export interface TransacaoParaChave {
  deputadoId?: string
  cnpjCpfFornecedor?: string
  dataDocumento?: string
  valorLiquido?: number
  numDocumento?: string
  tipoDespesa?: string
}

export function gerarChaveUnicaTransacao(transacao: TransacaoParaChave): string {
  const deputado = transacao.deputadoId || 'unknown'
  const data = transacao.dataDocumento || 'no-date'
  const valor = transacao.valorLiquido?.toString() || '0'
  const cnpj = transacao.cnpjCpfFornecedor || 'no-cnpj'
  const numDoc = transacao.numDocumento || 'no-doc'
  
  const dataNormalizada = data.split('T')[0] || data
  
  return `${deputado}-${dataNormalizada}-${valor}-${cnpj}-${numDoc}`.toLowerCase()
}

export class DeduplicadorTransacoes {
  private chavesProcessadas = new Set<string>()
  private transacoesUnicas: any[] = []
  private duplicatasEncontradas = 0

  adicionarTransacao(transacao: any): boolean {
    const chave = gerarChaveUnicaTransacao(transacao)
    
    if (this.chavesProcessadas.has(chave)) {
      this.duplicatasEncontradas++
      console.log(`🔄 Duplicata detectada: ${chave}`)
      return false
    }
    
    this.chavesProcessadas.add(chave)
    this.transacoesUnicas.push(transacao)
    return true
  }

  getEstatisticas() {
    return {
      transacoesUnicas: this.transacoesUnicas.length,
      duplicatasEncontradas: this.duplicatasEncontradas,
      totalProcessadas: this.transacoesUnicas.length + this.duplicatasEncontradas
    }
  }

  getTransacoesUnicas(): any[] {
    return this.transacoesUnicas
  }

  limpar(): void {
    this.chavesProcessadas.clear()
    this.transacoesUnicas = []
    this.duplicatasEncontradas = 0
  }
}

const cacheParseData = new Map<string, Date | null>()
const MAX_CACHE_SIZE = 1000 // Limite para evitar vazamento de memória

let cacheHits = 0
let cacheMisses = 0

export function parseDataRobusta(dataInput: any): Date | null {
  if (!dataInput) return null
  
  if (dataInput instanceof Date) {
    return isNaN(dataInput.getTime()) ? null : dataInput
  }
  
  if (typeof dataInput === 'string') {
    const cacheKey = dataInput.trim()
    
    if (cacheParseData.has(cacheKey)) {
      cacheHits++
      return cacheParseData.get(cacheKey)!
    }
    
    cacheMisses++
    
    if (cacheParseData.size >= MAX_CACHE_SIZE) {
      cacheParseData.clear()
    }
    let resultado: Date | null = null
    const dataStr = dataInput.trim()
    
    if (/^\d{4}-\d{2}-\d{2}/.test(dataStr)) {
      const data = new Date(dataStr)
      if (!isNaN(data.getTime())) resultado = data
    }
    
    if (!resultado) {
      const brMatch = dataStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (brMatch) {
        const [, dia, mes, ano] = brMatch
        const data = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
        if (!isNaN(data.getTime())) resultado = data
      }
    }
    
    if (!resultado && /^\d{8}$/.test(dataStr)) {
      const ano = parseInt(dataStr.substring(0, 4))
      const mes = parseInt(dataStr.substring(4, 6))
      const dia = parseInt(dataStr.substring(6, 8))
      const data = new Date(ano, mes - 1, dia)
      if (!isNaN(data.getTime())) resultado = data
    }
    
    if (!resultado) {
      const dataNativa = new Date(dataStr)
      if (!isNaN(dataNativa.getTime())) resultado = dataNativa
    }
    
    cacheParseData.set(cacheKey, resultado)
    return resultado
  }
  
  if (typeof dataInput === 'number') {
    const data = new Date(dataInput)
    if (!isNaN(data.getTime())) return data
  }
  
  if (typeof dataInput === 'object' && dataInput !== null) {
    if (dataInput.seconds !== undefined) {
      const data = new Date(dataInput.seconds * 1000)
      if (!isNaN(data.getTime())) return data
    }
    
    if (typeof dataInput.toDate === 'function') {
      try {
        const data = dataInput.toDate()
        if (data instanceof Date && !isNaN(data.getTime())) return data
      } catch (e) {}
    }
    
    if (dataInput.year !== undefined && dataInput.month !== undefined && dataInput.day !== undefined) {
      const data = new Date(dataInput.year, dataInput.month - 1, dataInput.day)
      if (!isNaN(data.getTime())) return data
    }
  }
  
  return null
}