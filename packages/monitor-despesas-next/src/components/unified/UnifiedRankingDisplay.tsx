'use client'

import React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL } from '@/lib/formatters'
import type { DeputadoProcessado, PremiacoesProcessadas } from '@/types/etl-deputados.types'
import { cn } from '@/lib/utils'

export interface UnifiedRankingDisplayProps {
  deputados: DeputadoProcessado[]
  premiacoes?: PremiacoesProcessadas
  onDeputadoClick?: (id: string) => void
  showBadges?: boolean
  maxItems?: number
}

export function UnifiedRankingDisplay({
  deputados,
  premiacoes,
  onDeputadoClick,
<<<<<<< HEAD
  titulo = "Ranking de Deputados",
  descricao
}) => {
  const [ordenacao, setOrdenacao] = useState<OrdenacaoTipo>('maior')
  const navigate = useNavigate()
  const { state } = useGlobalData()

  const getDeputadoCompleto = useCallback((deputadoId: string) => {
    return state.deputados.find(d => 
      String(d.id) === String(deputadoId) ||
      String(d.id) === String(deputadoId)
    )
  }, [state.deputados])

  const deputadosOrdenados = useMemo(() => {
    if (!ranking || ranking.length === 0) return []
    
    const deputados = [...ranking]
    
    switch (ordenacao) {
      case 'maior':
        return deputados.sort((a, b) => (b.totalGastos || b.totalValor || 0) - (a.totalGastos || a.totalValor || 0))
      case 'menor':
        return deputados.sort((a, b) => (a.totalGastos || a.totalValor || 0) - (b.totalGastos || b.totalValor || 0))
      case 'nome':
        return deputados.sort((a, b) => a.nomeEleitoral.localeCompare(b.nomeEleitoral))
      case 'partido':
        return deputados.sort((a, b) => a.siglaPartido.localeCompare(b.siglaPartido))
      case 'uf':
        return deputados.sort((a, b) => a.siglaUf.localeCompare(b.siglaUf))
      case 'transacoesMaior':
        return deputados.sort((a, b) => (b.quantidadeTransacoes || b.totalTransacoes || 0) - (a.quantidadeTransacoes || a.totalTransacoes || 0))
      case 'transacoesMenor':
        return deputados.sort((a, b) => (a.quantidadeTransacoes || a.totalTransacoes || 0) - (b.quantidadeTransacoes || b.totalTransacoes || 0))
      default:
        return deputados
    }
  }, [ranking, ordenacao])

  const deputadosParaExibir = deputadosOrdenados.slice(0, deputadosExibidos)

  const obterCorBadge = (posicao: number) => {
    if (posicao === 1) return 'bg-yellow-500 text-white' // Ouro
    if (posicao === 2) return 'bg-gray-400 text-white'   // Prata
    if (posicao === 3) return 'bg-amber-600 text-white'  // Bronze
    if (posicao <= 10) return 'bg-blue-500 text-white'   // Top 10
    return 'bg-gray-500 text-white'                       // Outros
  }

  const obterIconePremiacoes = (posicao: number) => {
    if (posicao === 1) return <Crown className="w-4 h-4" />
    if (posicao === 2) return <Medal className="w-4 h-4" />
    if (posicao === 3) return <Award className="w-4 h-4" />
    if (posicao <= 10) return <Trophy className="w-4 h-4" />
    return null
  }

  const handleDeputadoClick = (deputado: DeputadoRanking) => {
    if (onDeputadoClick) {
      onDeputadoClick(deputado)
    } else {
      navigate({ to: `/gastos/perfil/${deputado.id}` })
    }
  }

  const QuadroDouradoPremiacoes: React.FC<{ deputadoId: string; deputadoNome: string }> = ({ deputadoId, deputadoNome }) => {
    const [hasPremiacoes, setHasPremiacoes] = useState(false)

    const verificarPremiacoes = useCallback(() => {
      try {
        const premiacoesGlobaisCache = localStorage.getItem('premiacoesGlobais')
        if (!premiacoesGlobaisCache) {
          setHasPremiacoes(false)
          return
        }

        const premiacoesGlobais = JSON.parse(premiacoesGlobaisCache)

        const coroas = premiacoesGlobais.coroas?.filter((c: any) => c.deputadoId === deputadoId) || []
        const trofeus = premiacoesGlobais.trofeus?.filter((t: any) => t.deputadoId === deputadoId) || []
        const medalhas = premiacoesGlobais.medalhas?.filter((m: any) => m.deputadoId === deputadoId) || []

        const totalPremiacoes = coroas.length + trofeus.length + medalhas.length

        setHasPremiacoes(totalPremiacoes >= 3)
      } catch (error) {
        setHasPremiacoes(false)
      }
    }, [deputadoId])

    useEffect(() => {
      verificarPremiacoes()
    }, [verificarPremiacoes])

    return (
      <div className={hasPremiacoes ?
        'bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-300 rounded-lg p-1 shadow-sm inline-block' :
        'inline-block'
      }>
        <BadgesPremiacaoDeputado
          deputadoId={deputadoId}
          deputadoNome={deputadoNome}
          size="sm"
          maxBadges={10}
          showCounter={true}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <Card className={tamanhoCard === 'lg' ? 'p-8' : tamanhoCard === 'sm' ? 'p-2' : 'p-4'}>
        <CardContent className="flex items-center justify-center h-32">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 animate-pulse" />
            <span>Carregando ranking...</span>
          </div>
        </CardContent>
      </Card>
    )
=======
  showBadges = false,
  }
  deputados,
  premiacoes,
  onDeputadoClick,
  showBadges = false,
  maxItems,
}: UnifiedRankingDisplayProps) {
  // Empty state
  if (!deputados || deputados.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">
          Nenhum registro disponível para esta combinação de filtros
        </p>
      </div>
    )
  }

  const displayDeputados = maxItems ? deputados.slice(0, maxItems) : deputados

  return (
    <div className="space-y-2">
      {displayDeputados.map((deputado, index) => {
        const position = index + 1
        return (
          <RankingItem
            key={deputado.id}
            deputado={deputado}
            position={position}
            premiacoes={premiacoes}
            showBadges={showBadges}
            onDeputadoClick={onDeputadoClick}
          />
        )
      })}
    </div>
  )
}
// ...existing code...
            {deputado.siglaPartido}
          </Badge>
          <Badge variant="outline" className="text-xs shrink-0">
            {deputado.siglaUf}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {deputado.totalTransacoes.toLocaleString('pt-BR')} transações
        </p>
      </div>

      {/* Valor on right */}
      <div className="text-right shrink-0">
        <p className="font-bold text-sm">
          {formatCurrencyBRL(deputado.totalGastos)}
        </p>
      </div>

      {/* Badges integration - positioned in top-right corner with absolute positioning */}
      {showBadges && premiacoes && (
        <div className="absolute top-2 right-2">
          {/* Placeholder for BadgesPremiacaoDeputado - will be implemented in task 9 */}
          {/* <BadgesPremiacaoDeputado 
            deputadoId={deputado.id}
            premiacoes={premiacoes}
            maxVisible={3}
          /> */}
        </div>
      )}
    </div>
  )

  // Use Next.js Link for client-side navigation
  if (onDeputadoClick) {
    return (
      <Link href={`/gastos/perfil/${deputado.id}`} className="block">
        {itemContent}
      </Link>
    )
  }

  return itemContent
}
