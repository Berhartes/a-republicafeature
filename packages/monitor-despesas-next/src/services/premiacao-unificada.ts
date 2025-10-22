import { premiacoesGlobalCache, type PremiacoesGlobais } from '@/services/premiacoes-global-cache'
import { premiacoesProcessor } from '@/services/premiacoes-processor'

export type { PremiacoesGlobais } from '@/services/premiacoes-global-cache'

export const premiacaoUnificada = {
  async getPremiacoes(): Promise<PremiacoesGlobais> {
    const cached = premiacoesGlobalCache.getCache()
    if (cached) {
      return cached.premiacoes
    }

    const processed = await premiacoesProcessor.processarPremiacoes()
    return processed.premiacoes
  },

  async calcularPremiacoes(): Promise<PremiacoesGlobais> {
    const processed = await premiacoesProcessor.processarPremiacoes({ forceRefresh: true })
    return processed.premiacoes
  },

  isAvailable(): boolean {
    return premiacoesProcessor.getLastResult() != null
  }
}

export default premiacaoUnificada
