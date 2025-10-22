interface MetricaPerformance {
  nome: string
  duracao: number
  timestamp: number
  detalhes?: Record<string, any>
}

class MonitorPerformance {
  private metricas: MetricaPerformance[] = []
  private inicioTimers: Map<string, number> = new Map()

  iniciar(nome: string, detalhes?: Record<string, any>) {
    this.inicioTimers.set(nome, performance.now())
    console.log(`⏱️ Iniciando: ${nome}`, detalhes)
  }

  finalizar(nome: string, detalhes?: Record<string, any>) {
    const inicio = this.inicioTimers.get(nome)
    if (!inicio) {
      console.warn(`⚠️ Timer não encontrado para: ${nome}`)
      return
    }

    const duracao = performance.now() - inicio
    const metrica: MetricaPerformance = {
      nome,
      duracao,
      timestamp: Date.now(),
      detalhes
    }

    this.metricas.push(metrica)
    this.inicioTimers.delete(nome)

    console.log(`✅ Finalizado: ${nome} (${duracao.toFixed(2)}ms)`, detalhes)
    
    if (duracao > 5000) {
      console.warn(`🐌 Operação lenta detectada: ${nome} levou ${duracao.toFixed(2)}ms`)
    }

    return metrica
  }

  obterMetricas(): MetricaPerformance[] {
    return [...this.metricas]
  }

  obterResumo() {
    const resumo = this.metricas.reduce((acc, metrica) => {
      if (!acc[metrica.nome]) {
        acc[metrica.nome] = {
          count: 0,
          totalDuracao: 0,
          minDuracao: Infinity,
          maxDuracao: 0
        }
      }

      const item = acc[metrica.nome]
      item.count++
      item.totalDuracao += metrica.duracao
      item.minDuracao = Math.min(item.minDuracao, metrica.duracao)
      item.maxDuracao = Math.max(item.maxDuracao, metrica.duracao)

      return acc
    }, {} as Record<string, any>)

    Object.keys(resumo).forEach(nome => {
      resumo[nome].mediaDuracao = resumo[nome].totalDuracao / resumo[nome].count
    })

    return resumo
  }

  limpar() {
    this.metricas = []
    this.inicioTimers.clear()
  }

  exportarCSV(): string {
    const headers = ['Nome', 'Duracao(ms)', 'Timestamp', 'Detalhes']
    const rows = this.metricas.map(m => [
      m.nome,
      m.duracao.toFixed(2),
      new Date(m.timestamp).toISOString(),
      m.detalhes ? JSON.stringify(m.detalhes) : ''
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  monitorarAnaliseCSV() {
    this.iniciar('analise-csv')
  }

  finalizarAnaliseCSV(totalRegistros: number, alertasGerados: number) {
    return this.finalizar('analise-csv', {
      totalRegistros,
      alertasGerados,
      registrosPorSegundo: totalRegistros / (this.inicioTimers.get('analise-csv') || 1) * 1000
    })
  }

  monitorarCarregamentoPagina(pagina: string) {
    this.iniciar(`carregamento-${pagina}`)
  }

  finalizarCarregamentoPagina(pagina: string) {
    return this.finalizar(`carregamento-${pagina}`)
  }

  monitorarRenderizacao(componente: string) {
    this.iniciar(`render-${componente}`)
  }

  finalizarRenderizacao(componente: string, elementos?: number) {
    return this.finalizar(`render-${componente}`, { elementos })
  }
}

export const monitorPerformance = new MonitorPerformance()

export function useMonitorPerformance() {
  const iniciar = (nome: string, detalhes?: Record<string, any>) => {
    monitorPerformance.iniciar(nome, detalhes)
  }

  const finalizar = (nome: string, detalhes?: Record<string, any>) => {
    return monitorPerformance.finalizar(nome, detalhes)
  }

  const obterResumo = () => {
    return monitorPerformance.obterResumo()
  }

  return { iniciar, finalizar, obterResumo }
}

export function medirPerformance(nome: string) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      monitorPerformance.iniciar(nome)
      try {
        const result = await originalMethod.apply(this, args)
        monitorPerformance.finalizar(nome, { sucesso: true })
        return result
      } catch (error) {
        monitorPerformance.finalizar(nome, { sucesso: false, erro: error })
        throw error
      }
    }

    return descriptor
  }
}

export const performance_utils = {
  medirMemoria(): Record<string, number> {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    return {}
  },

  medirCarregamento(): Record<string, number> {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      ttfb: navigation.responseStart - navigation.requestStart
    }
  },

  obterFPS(): Promise<number> {
    return new Promise(resolve => {
      let frames = 0
      const inicio = performance.now()
      
      function contarFrame() {
        frames++
        if (performance.now() - inicio < 1000) {
          requestAnimationFrame(contarFrame)
        } else {
          resolve(frames)
        }
      }
      
      requestAnimationFrame(contarFrame)
    })
  }
}
