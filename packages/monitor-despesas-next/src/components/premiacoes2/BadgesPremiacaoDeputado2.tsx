
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2 } from 'lucide-react'
import { deputadoPremiacaoUnificado, type PremiacoesDeputado, type PremiacaoVisual, type PremiacaoAgrupada } from '@/services/deputado-premiacao-unificado'

interface BadgesPremiacaoDeputado2Props {
  deputadoId: string
  deputadoNome?: string
  size?: 'sm' | 'md' | 'lg'
  maxBadges?: number
  showCounter?: boolean
  className?: string
}

export function BadgesPremiacaoDeputado2({
  deputadoId,
  deputadoNome,
  size = 'md',
  maxBadges = 4,
  showCounter = true,
  className = ''
}: BadgesPremiacaoDeputado2Props) {
  const [premiacoes, setPremiacoes] = useState<PremiacoesDeputado | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarPremiacoes = useCallback(async () => {
    if (!deputadoId) return
    
    try {
      setLoading(true)
      setError(null)
      const result = await deputadoPremiacaoUnificado.buscarPremiacoesDeputado(deputadoId)
      setPremiacoes(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar premiações')
      console.error('❌ [BadgesPremiacaoDeputado2] Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [deputadoId])

  useEffect(() => {
    carregarPremiacoes()
  }, [carregarPremiacoes])

  const config = useMemo(() => {
    const sizeConfig = {
      sm: { 
        badge: 'w-6 h-6 text-xs',
        counter: 'w-4 h-4 text-xs',
        gap: 'gap-1'
      },
      md: { 
        badge: 'w-8 h-8 text-sm',
        counter: 'w-5 h-5 text-xs',
        gap: 'gap-2'
      },
      lg: { 
        badge: 'w-10 h-10 text-base',
        counter: 'w-6 h-6 text-sm',
        gap: 'gap-2'
      }
    }
    return sizeConfig[size]
  }, [size])

  const { visuais, badgesToShow, remaining } = useMemo(() => {
    if (!premiacoes) return { visuais: [], badgesToShow: [], remaining: 0 }
    
    const visuais = deputadoPremiacaoUnificado.converterPremiacoesParaVisuais(premiacoes)
    const badgesToShow = visuais.slice(0, maxBadges)
    const remaining = Math.max(0, visuais.length - maxBadges)
    
    return { visuais, badgesToShow, remaining }
  }, [premiacoes, maxBadges])

  if (loading) {
    return (
      <div className={`flex items-center ${config.gap} ${className}`}>
        <Loader2 className={`${config.badge} animate-spin text-gray-400`} />
      </div>
    )
  }

  if (error || !premiacoes) {
    return null
  }

  if (premiacoes.totalPremiacoes === 0) {
    return null
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center ${config.gap} ${className}`}>
        {badgesToShow.map((visual, index) => (
          <BadgePremiacaoItem2
            key={`${visual.tipo}-${visual.subtipo}-${index}`}
            visual={visual}
            size={config.badge}
            deputadoNome={deputadoNome || premiacoes.deputadoNome}
          />
        ))}
        
        {/* Contador de badges extras */}
        {remaining > 0 && showCounter && (
          <Tooltip>
            <TooltipTrigger>
              <div className={`
                flex items-center justify-center ${config.badge} rounded-full 
                bg-gray-500 text-white font-bold hover:scale-110 transition-transform cursor-help
                shadow-sm hover:shadow-md
              `}>
                +{remaining}
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm">
              <div className="space-y-2">
                <p className="font-semibold text-gray-900">+{remaining} outras premiações</p>
                <div className="space-y-1">
                  {visuais.slice(maxBadges).map((visual, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span>{visual.emoji}</span>
                      <span className="text-gray-700">
                        {visual.descricao}
                        {visual.categoria && visual.categoria !== 'geral_historico' && visual.categoria !== 'geral_anual' && 
                          ` - ${visual.categoria}`
                        }
                        {visual.ano && ` (${visual.ano})`}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 text-xs text-gray-600">
                  <p>Total: {premiacoes.coroas.length} coroas, {premiacoes.trofeus.length} troféus, {premiacoes.medalhas.length} medalhas</p>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}

interface BadgeAgrupadaItem2Props {
  agrupada: PremiacaoAgrupada
  size: string
  deputadoNome: string
}

interface BadgePremiacaoItem2Props {
  visual: PremiacaoVisual
  size: string
  deputadoNome: string
}

function BadgeAgrupadaItem2({ agrupada, size, deputadoNome }: BadgeAgrupadaItem2Props) {
  const formatarCategoriaLocal = (categoria?: string) => {
    if (!categoria) return ''
    return categoria
  }

  const formatarMoeda = (valor: number) => {
    return deputadoPremiacaoUnificado.formatarMoeda(valor)
  }

  const obterTituloCompleto = () => {
    let titulo = `${agrupada.emoji} ${agrupada.descricao}`
    if (agrupada.quantidade > 1) {
      titulo += ` (${agrupada.quantidade})`
    }
    return titulo
  }

  const obterDescricaoDetalhada = () => {
    const detalhes = []
    
    detalhes.push(`Deputado: ${deputadoNome}`)
    detalhes.push(`Quantidade: ${agrupada.quantidade}`)
    
    if (agrupada.quantidade === 1) {
      const primeira = agrupada.premiacoes[0]
      detalhes.push(`Valor: ${formatarMoeda(primeira.valor)}`)
      
      if (primeira.categoria && primeira.categoria !== 'geral_historico' && primeira.categoria !== 'geral_anual') {
        detalhes.push(`Categoria: ${formatarCategoriaLocal(primeira.categoria)}`)
      }
      
      if (primeira.ano) {
        detalhes.push(`Ano: ${primeira.ano}`)
      }
    } else {
      const valorTotal = agrupada.premiacoes.reduce((sum, p) => sum + p.valor, 0)
      detalhes.push(`Valor total: ${formatarMoeda(valorTotal)}`)
      
      const anos = [...new Set(agrupada.premiacoes.map(p => p.ano).filter(Boolean))].sort()
      if (anos.length > 0) {
        detalhes.push(`Anos: ${anos.join(', ')}`)
      }
      
      const categorias = [...new Set(agrupada.premiacoes.map(p => p.categoria).filter(c => c && c !== 'geral_historico' && c !== 'geral_anual'))].slice(0, 3)
      if (categorias.length > 0) {
        const categoriasText = categorias.map(formatarCategoriaLocal).join(', ')
        detalhes.push(`Categorias: ${categoriasText}${categorias.length > 3 ? '...' : ''}`)
      }
    }
    
    return detalhes
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={`
          relative flex items-center justify-center ${size} rounded-full 
          bg-gradient-to-r ${agrupada.cor} text-white
          hover:scale-110 transition-transform cursor-help
          shadow-sm hover:shadow-md
        `}>
          {agrupada.emoji}
          {agrupada.numeroAlto && (
            <span className="absolute -top-1 -right-1 text-xs font-bold text-white drop-shadow-md">
              {agrupada.numeroAlto}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{obterTituloCompleto()}</p>
          {obterDescricaoDetalhada().map((detalhe, idx) => (
            <p key={idx} className="text-xs text-gray-700">{detalhe}</p>
          ))}
          <p className="text-xs text-gray-600 italic">
            {agrupada.tipo === 'coroa' ? 'Campeão histórico' :
             agrupada.tipo === 'trofeu' ? 'Campeão anual' :
             'Medalha de mérito'}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

function BadgePremiacaoItem2({ visual, size, deputadoNome }: BadgePremiacaoItem2Props) {
  const formatarCategoriaLocal = (categoria?: string) => {
    if (!categoria) return ''
    return categoria
  }

  const formatarMoeda = (valor: number) => {
    return deputadoPremiacaoUnificado.formatarMoeda(valor)
  }

  const obterTituloCompleto = () => {
    let titulo = `${visual.emoji} ${visual.descricao}`
    
    if (visual.categoria && visual.categoria !== 'geral_historico' && visual.categoria !== 'geral_anual') {
      titulo += ` - ${formatarCategoriaLocal(visual.categoria)}`
    }
    
    if (visual.ano) {
      titulo += ` (${visual.ano})`
    }
    
    return titulo
  }

  const obterDescricaoDetalhada = () => {
    const detalhes = []
    
    detalhes.push(`Deputado: ${deputadoNome}`)
    detalhes.push(`Valor: ${formatarMoeda(visual.valor)}`)
    
    if (visual.posicao) {
      const posicaoTexto = visual.posicao === 1 ? '1º lugar' : 
                          visual.posicao === 2 ? '2º lugar' : 
                          visual.posicao === 3 ? '3º lugar' : 
                          `${visual.posicao}º lugar`
      detalhes.push(`Posição: ${posicaoTexto}`)
    }
    
    return detalhes
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <div className={`
          flex items-center justify-center ${size} rounded-full 
          bg-gradient-to-r ${visual.cor} text-white
          hover:scale-110 transition-transform cursor-help
          shadow-sm hover:shadow-md
        `}>
          {visual.emoji}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold text-gray-900">{obterTituloCompleto()}</p>
          {obterDescricaoDetalhada().map((detalhe, idx) => (
            <p key={idx} className="text-xs text-gray-700">{detalhe}</p>
          ))}
          <p className="text-xs text-gray-600 italic">
            {visual.tipo === 'coroa' ? 'Campeão histórico' :
             visual.tipo === 'trofeu' ? 'Campeão anual' :
             'Medalha de mérito'}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export default BadgesPremiacaoDeputado2