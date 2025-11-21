import { CNPJValidationResult } from './cnpj-validator'
// Dados devem ser carregados exclusivamente do ETL via fontes de cache

export interface ReceitaData {
  cnpj: string
  razaoSocial: string
  nomeFantasia?: string
  situacao: string
  dataAbertura: string
  naturezaJuridica: string
  porte: string
  endereco: {
    logradouro: string
    numero: string
    complemento?: string
    bairro: string
    municipio: string
    uf: string
    cep: string
  }
  telefones?: string[]
  email?: string
  atividadePrincipal: {
    codigo: string
    descricao: string
  }
  atividadesSecundarias?: Array<{
    codigo: string
    descricao: string
  }>
  capitalSocial: number
  ultimaAtualizacao: string
  status: 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA'
}

export interface CNPJReceitaValidation extends CNPJValidationResult {
  dadosReceita?: ReceitaData
  consultaReceita: {
    consultado: boolean
    dataConsulta?: Date
    sucesso: boolean
    erro?: string
    fonte: string
  }
}

interface CnpjCacheMetadata {
  generatedAt: string
  source: string
  arquivoFonte: string
  version: string
  totalFornecedores: number
  totalDeputados: number
  valorTotalGeral: number
  periodoAnalise: {
    arquivo: string
    geradoEm: string
  }
  totalCnpjs: number
  fonte: string
}

interface CnpjCacheRecord {
  cnpj: string
  nome: string
  status: 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA' | 'DESCONHECIDO'
  naturezaJuridica?: string | null
  porte?: string | null
  atividadePrincipal?: {
    codigo?: string | null
    descricao?: string | null
  } | null
  endereco?: {
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
    municipio?: string | null
    uf?: string | null
    cep?: string | null
  } | null
  capitalSocial?: number | null
  ultimaAtualizacao?: string | null
  totalGasto: number
  numeroTransacoes: number
  numeroDeputados: number
  categoriaPrincipal: string
  fontes: {
    origem: string
    atualizadoEm: string
  }
}

interface CnpjCacheResponse {
  metadata: CnpjCacheMetadata
  data: CnpjCacheRecord[]
}

class CNPJReceitaIntegration {
  private cache = new Map<string, ReceitaData>()
  private loadingPromise: Promise<void> | null = null

  private normalizeCNPJ(cnpj: string): string {
    return cnpj ? cnpj.replace(/\D/g, '') : ''
  }

  private mapStatus(status: CnpjCacheRecord['status']): ReceitaData['status'] {
    switch (status) {
      case 'BAIXADA':
      case 'SUSPENSA':
      case 'INAPTA':
        return status
      case 'ATIVA':
      default:
        return 'ATIVA'
    }
  }

  private mapSituacao(status: ReceitaData['status']): string {
    const situacoes: Record<ReceitaData['status'], string> = {
      ATIVA: 'ATIVA',
      BAIXADA: 'BAIXADA',
      SUSPENSA: 'SUSPENSA',
      INAPTA: 'INAPTA'
    }
    return situacoes[status] || 'ATIVA'
  }

  private mapEntryToReceitaData(entry: CnpjCacheRecord, metadata: CnpjCacheMetadata): ReceitaData {
    const status = this.mapStatus(entry.status)
    const atualizadoEm = entry.fontes?.atualizadoEm || metadata.generatedAt
    const atividadeDescricao = entry.atividadePrincipal?.descricao || entry.categoriaPrincipal || 'NÃO INFORMADA'

    return {
      cnpj: entry.cnpj,
      razaoSocial: entry.nome,
      nomeFantasia: entry.nome,
      situacao: this.mapSituacao(status),
      dataAbertura: atualizadoEm,
      naturezaJuridica: entry.naturezaJuridica || 'NÃO INFORMADA',
      porte: entry.porte || 'NÃO INFORMADO',
      endereco: {
        logradouro: entry.endereco?.logradouro || '',
        numero: entry.endereco?.numero || '',
        complemento: entry.endereco?.complemento || '',
        bairro: entry.endereco?.bairro || '',
        municipio: entry.endereco?.municipio || '',
        uf: entry.endereco?.uf || 'BR',
        cep: entry.endereco?.cep || ''
      },
      telefones: [],
      email: undefined,
      atividadePrincipal: {
        codigo: entry.atividadePrincipal?.codigo || '',
        descricao: atividadeDescricao
      },
      atividadesSecundarias: [],
      capitalSocial: typeof entry.capitalSocial === 'number' ? entry.capitalSocial : 0,
      ultimaAtualizacao: atualizadoEm,
      status
    }
  }

  private async loadCacheFromCDN(): Promise<void> {
    try {
      const { loadCacheByKeyWithSource } = await import('@/lib/cache/cache-sources')
      const result = await loadCacheByKeyWithSource<CnpjCacheResponse>('cnpj-cache')
      const response = result.data as CnpjCacheResponse | null

      if (!response || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error('cnpj-cache.json vazio ou indisponível')
      }

      this.cache.clear()

      response.data.forEach(entry => {
        const cnpj = this.normalizeCNPJ(entry.cnpj)
        if (cnpj.length !== 14) {
          return
        }
        const receita = this.mapEntryToReceitaData(entry, response.metadata)
        this.cache.set(cnpj, receita)
      })
    } catch (error) {
      console.error('❌ [CNPJReceitaIntegration] Erro ao carregar cnpj-cache:', error)
      throw error
    }
  }

  private async ensureCacheLoaded(): Promise<void> {
    if (this.cache.size > 0) {
      return
    }

    if (this.loadingPromise) {
      await this.loadingPromise
      return
    }

    this.loadingPromise = this.loadCacheFromCDN()

    try {
      await this.loadingPromise
    } finally {
      this.loadingPromise = null
    }
  }

  async validarComReceita(cnpjOriginal: string): Promise<CNPJReceitaValidation> {
  const { CNPJValidator } = await import('./cnpj-validator')
    const validacaoBase = CNPJValidator.validate(cnpjOriginal)

    const resultado: CNPJReceitaValidation = {
      ...validacaoBase,
      consultaReceita: {
        consultado: false,
        sucesso: false,
        fonte: 'etl-cache'
      }
    }

    const cnpjNormalizado = this.normalizeCNPJ(validacaoBase.valorNormalizado || '')
    if (cnpjNormalizado.length !== 14) {
      return resultado
    }

    try {
      await this.ensureCacheLoaded()

      const dadosReceita = this.cache.get(cnpjNormalizado)
      if (!dadosReceita) {
        resultado.consultaReceita = {
          consultado: true,
          sucesso: false,
          fonte: 'etl-cache',
          dataConsulta: new Date(),
          erro: 'CNPJ não encontrado no cache ETL'
        }
        return resultado
      }

      resultado.dadosReceita = dadosReceita
      resultado.consultaReceita = {
        consultado: true,
        sucesso: true,
        fonte: 'etl-cache',
        dataConsulta: new Date()
      }

      resultado.status = this.ajustarStatusComReceita(resultado.status, dadosReceita)
      resultado.confianca = this.calcularConfiancaComReceita(resultado.confianca, dadosReceita)
      this.adicionarProblemasReceita(resultado, dadosReceita)

      return resultado
    } catch (error) {
      console.error('❌ [CNPJReceitaIntegration] Falha ao validar com cache ETL:', error)
      resultado.consultaReceita = {
        consultado: true,
        sucesso: false,
        fonte: 'etl-cache',
        dataConsulta: new Date(),
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      }
      return resultado
    }
  }

  async validarLoteComReceita(cnpjs: string[]): Promise<CNPJReceitaValidation[]> {
    await this.ensureCacheLoaded()
    const resultados: CNPJReceitaValidation[] = []

    for (const cnpj of cnpjs) {
      try {
        const resultado = await this.validarComReceita(cnpj)
        resultados.push(resultado)
      } catch (error) {
        console.error(`❌ [CNPJReceitaIntegration] Erro ao validar ${cnpj}:`, error)
      }
    }

    return resultados
  }

  private ajustarStatusComReceita(statusOriginal: string, dadosReceita: ReceitaData): 'VALIDO' | 'CORRIGIDO' | 'INVALIDO' | 'SUSPEITO' {
    if (dadosReceita.status === 'ATIVA') {
      if (statusOriginal === 'CORRIGIDO') {
        return 'VALIDO'
      }
      return statusOriginal as 'VALIDO' | 'CORRIGIDO' | 'INVALIDO' | 'SUSPEITO'
    }

    if (dadosReceita.status === 'BAIXADA' || dadosReceita.status === 'SUSPENSA') {
      return 'SUSPEITO'
    }

    return statusOriginal as 'VALIDO' | 'CORRIGIDO' | 'INVALIDO' | 'SUSPEITO'
  }

  private calcularConfiancaComReceita(confiancaOriginal: number, dadosReceita: ReceitaData): number {
    let confiancaAjustada = confiancaOriginal

    if (dadosReceita.status === 'ATIVA') {
      confiancaAjustada = Math.min(100, confiancaAjustada + 15)
    }

    if (dadosReceita.status === 'BAIXADA') {
      confiancaAjustada = Math.max(0, confiancaAjustada - 30)
    }

    if (dadosReceita.status === 'SUSPENSA') {
      confiancaAjustada = Math.max(0, confiancaAjustada - 15)
    }

    return confiancaAjustada
  }

  private adicionarProblemasReceita(resultado: CNPJReceitaValidation, dadosReceita: ReceitaData): void {
    if (dadosReceita.status === 'BAIXADA') {
      resultado.problemas.push({
        codigo: 'EMPRESA_BAIXADA',
        descricao: `Empresa baixada na Receita Federal em ${dadosReceita.ultimaAtualizacao}`,
        gravidade: 'ALTA'
      })
    }

    if (dadosReceita.status === 'SUSPENSA') {
      resultado.problemas.push({
        codigo: 'EMPRESA_SUSPENSA',
        descricao: 'Empresa com situação suspensa na Receita Federal',
        gravidade: 'MEDIA'
      })
    }

    if (dadosReceita.status === 'INAPTA') {
      resultado.problemas.push({
        codigo: 'EMPRESA_INAPTA',
        descricao: 'Empresa inapta na Receita Federal',
        gravidade: 'MEDIA'
      })
    }

    if (typeof dadosReceita.capitalSocial === 'number' && dadosReceita.capitalSocial < 1000) {
      resultado.problemas.push({
        codigo: 'CAPITAL_SOCIAL_BAIXO',
        descricao: `Capital social muito baixo: R$ ${dadosReceita.capitalSocial.toFixed(2)}`,
        gravidade: 'BAIXA'
      })
    }
  }

  limparCache(): void {
  this.cache.clear()
    this.loadingPromise = null
  }

  obterEstatisticasCache(): {
    totalCacheados: number
    empresasAtivas: number
    empresasBaixadas: number
    empresasSuspensas: number
  } {
    const dadosCache = Array.from(this.cache.values())

    return {
      totalCacheados: dadosCache.length,
      empresasAtivas: dadosCache.filter(d => d.status === 'ATIVA').length,
      empresasBaixadas: dadosCache.filter(d => d.status === 'BAIXADA').length,
      empresasSuspensas: dadosCache.filter(d => d.status === 'SUSPENSA').length
    }
  }
}

export const cnpjReceitaIntegration = new CNPJReceitaIntegration()

export async function validarCNPJComReceita(cnpj: string): Promise<CNPJReceitaValidation> {
  return cnpjReceitaIntegration.validarComReceita(cnpj)
}
