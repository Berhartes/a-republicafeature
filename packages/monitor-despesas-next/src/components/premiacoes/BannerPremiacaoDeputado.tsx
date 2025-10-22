
import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Crown, Trophy, Medal, Award, Loader2 } from 'lucide-react'
import { deputadoPremiacaoUnificado, type PremiacoesDeputado, type PremiacaoVisual } from '@/services/deputado-premiacao-unificado'
import type { PremiacaoResumo } from '@/services/premiacoes-global-cache'

interface BannerPremiacaoDeputadoProps {
  deputadoId: string
  deputadoNome: string
  className?: string
  compact?: boolean
}

export function BannerPremiacaoDeputado({
  deputadoId,
  deputadoNome,
  className = '',
  compact = false
}: BannerPremiacaoDeputadoProps) {
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
      console.error('❌ [BannerPremiacaoDeputado] Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [deputadoId])

  useEffect(() => {
    carregarPremiacoes()
  }, [carregarPremiacoes])

  const bannerConfig = useMemo(() => {
    if (!premiacoes || premiacoes.totalPremiacoes === 0) {
      return {
        bannerStyle: 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-600',
        iconePrincipal: <Award className="h-8 w-8" />,
        tituloPrincipal: 'Deputado Premiado'
      }
    }

    const temCoroaGeral = premiacoes.coroas.some(c => c.tipo === 'geral')
    const temCoroaCategoria = premiacoes.coroas.some(c => c.tipo === 'categoria')
    const temTrofeus = premiacoes.trofeus.length > 0
    
    if (temCoroaGeral) {
      return {
        bannerStyle: 'bg-gradient-to-r from-pink-500 via-purple-500 to-pink-600',
        iconePrincipal: <Crown className="h-8 w-8" />,
        tituloPrincipal: '👑 Campeão Histórico Geral'
      }
    }
    
    if (temCoroaCategoria) {
      return {
        bannerStyle: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600',
        iconePrincipal: <Crown className="h-8 w-8" />,
        tituloPrincipal: '👑 Campeão de Categoria'
      }
    }
    
    if (temTrofeus) {
      return {
        bannerStyle: 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-600',
        iconePrincipal: <Trophy className="h-8 w-8" />,
        tituloPrincipal: '🏆 Campeão Anual'
      }
    }
    
    return {
      bannerStyle: 'bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600',
      iconePrincipal: <Medal className="h-8 w-8" />,
      tituloPrincipal: '🎖️ Deputado Medalhista'
    }
  }, [premiacoes])

  const { bannerStyle, iconePrincipal, tituloPrincipal } = bannerConfig

  if (loading) {
    return (
      <Card className={`mb-6 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Carregando premiações...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !premiacoes || premiacoes.totalPremiacoes === 0) {
    return null
  }

  if (compact) {
    return (
      <Card className={`mb-4 ${className}`}>
        <CardContent className="p-4">
          <div className={`${bannerStyle} text-white p-4 rounded-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {iconePrincipal}
                <div>
                  <h3 className="font-bold text-lg">{tituloPrincipal}</h3>
                  <p className="text-sm opacity-90">
                    {premiacoes.totalPremiacoes} premiação{premiacoes.totalPremiacoes !== 1 ? 'ões' : ''}
                  </p>
                </div>
              </div>
              <ResumoCounters premiacoes={premiacoes} />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <Card className={`mb-6 overflow-hidden ${className}`}>
        <CardContent className="p-0">
          <div className={`${bannerStyle} text-white p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {iconePrincipal}
                <div>
                  <h2 className="font-bold text-2xl mb-1">{tituloPrincipal}</h2>
                  <p className="text-lg opacity-90 mb-2">{deputadoNome}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>{premiacoes.totalPremiacoes} premiação{premiacoes.totalPremiacoes !== 1 ? 'ões' : ''}</span>
                    <span>•</span>
                    <span>Última atualização: {premiacoes.ultimaAtualizacao.toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3">
                <ResumoCounters premiacoes={premiacoes} />
                <PreviewPremiacoes premiacoes={premiacoes} />
              </div>
            </div>
            
            {/* Seção de destaques */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <DestaquePremiacoes
                titulo="Coroas Conquistadas"
                quantidade={premiacoes.coroas.length}
                icon="👑"
                descricao="Campeão histórico"
                items={premiacoes.coroas.slice(0, 4)}
                tipo="coroa"
              />
              
              <DestaquePremiacoes
                titulo="Troféus Ganhos"
                quantidade={premiacoes.trofeus.length}
                icon="🏆"
                descricao="Campeão anual"
                items={premiacoes.trofeus.slice(0, 4)}
                tipo="trofeu"
              />
              
              <DestaquePremiacoes
                titulo="Medalhas de Mérito"
                quantidade={premiacoes.medalhas.length}
                icon="🎖️"
                descricao="Posições de destaque"
                items={premiacoes.medalhas.slice(0, 4)}
                tipo="medalha"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

interface ResumoCountersProps {
  premiacoes: PremiacoesDeputado
}

function ResumoCounters({ premiacoes }: ResumoCountersProps) {
  return (
    <div className="flex gap-3">
      <div className="text-center bg-white/20 p-2 rounded-lg min-w-[50px]">
        <div className="text-xl font-bold">{premiacoes.coroas.length}</div>
        <div className="text-xs opacity-80">Coroas</div>
      </div>
      <div className="text-center bg-white/20 p-2 rounded-lg min-w-[50px]">
        <div className="text-xl font-bold">{premiacoes.trofeus.length}</div>
        <div className="text-xs opacity-80">Troféus</div>
      </div>
      <div className="text-center bg-white/20 p-2 rounded-lg min-w-[50px]">
        <div className="text-xl font-bold">{premiacoes.medalhas.length}</div>
        <div className="text-xs opacity-80">Medalhas</div>
      </div>
    </div>
  )
}

interface PreviewPremiacoesProps {
  premiacoes: PremiacoesDeputado
}

function PreviewPremiacoes({ premiacoes }: PreviewPremiacoesProps) {
  const visuais = useMemo<PremiacaoVisual[]>(() => {
    return deputadoPremiacaoUnificado.converterPremiacoesParaVisuais(premiacoes)
  }, [premiacoes])

  return (
    <div className="flex gap-1">
      {visuais.slice(0, 8).map((visual, index) => (
        <Tooltip key={index}>
          <TooltipTrigger>
            <div className="bg-white/30 p-1 rounded-full text-sm hover:bg-white/40 transition-colors">
              {visual.emoji}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{visual.descricao}</p>
            {visual.categoria && <p className="text-xs">{visual.categoria}</p>}
            {visual.ano && <p className="text-xs">Ano: {visual.ano}</p>}
          </TooltipContent>
        </Tooltip>
      ))}
      {visuais.length > 8 && (
        <div className="bg-white/30 p-1 rounded-full text-xs font-bold min-w-[24px] text-center">
          +{visuais.length - 8}
        </div>
      )}
    </div>
  )
}

interface DestaquePremiacoesProps {
  titulo: string
  quantidade: number
  icon: string
  descricao: string
  items: PremiacaoResumo[]
  tipo: 'coroa' | 'trofeu' | 'medalha'
}

function DestaquePremiacoes({ titulo, quantidade, icon, descricao, items, tipo }: DestaquePremiacoesProps) {
  if (quantidade === 0) return null

  const formatarItem = (item: PremiacaoResumo) => {
    if (tipo === 'coroa') {
      return item.tipo === 'geral' ? 'Geral (Histórico)' : item.categoria ?? 'Categoria'
    }
    if (tipo === 'trofeu') {
      return `${item.tipo === 'geral' ? 'Geral' : item.categoria ?? 'Categoria'} ${item.ano ?? ''}`.trim()
    }
    if (tipo === 'medalha') {
      return `${item.posicao ?? '-'}º lugar ${item.ano ? item.ano : 'Histórico'}`
    }
    return 'Item'
  }

  return (
    <div className="bg-white/10 p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{icon}</span>
        <div>
          <div className="font-semibold text-sm">{titulo}</div>
          <div className="text-xs opacity-80">{descricao}</div>
        </div>
        <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
          {quantidade}
        </Badge>
      </div>
      
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item, index) => (
            <div key={index} className="text-xs bg-white/10 p-1 rounded text-center truncate">
              {formatarItem(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BannerPremiacaoDeputado