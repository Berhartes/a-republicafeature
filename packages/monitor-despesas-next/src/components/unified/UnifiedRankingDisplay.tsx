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

interface RankingItemProps {
  deputado: DeputadoProcessado
  position: number
  premiacoes?: PremiacoesProcessadas
  showBadges?: boolean
  onDeputadoClick?: (id: string) => void
}

function RankingItem({
  deputado,
  position,
  premiacoes,
  showBadges,
  onDeputadoClick,
}: RankingItemProps) {
  // Top 3 medal styling
  const getPositionStyles = (pos: number) => {
    switch (pos) {
      case 1:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 2:
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 3:
        return 'bg-amber-100 text-amber-700 border-amber-200'
      default:
        return 'hover:bg-accent/50'
    }
  }

  const handleClick = () => {
    if (onDeputadoClick) {
      onDeputadoClick(deputado.id)
    }
  }

  const itemContent = (
    <div
      className={cn(
        'relative flex items-center gap-4 p-4 rounded-lg border transition-colors',
        position <= 3 ? 'border-2' : 'border',
        getPositionStyles(position),
        (onDeputadoClick || showBadges) && 'cursor-pointer'
      )}
      onClick={handleClick}
    >
      {/* Position Badge (circular, numbered) on left */}
      <div
        className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm shrink-0',
          position === 1 && 'bg-yellow-500 text-white',
          position === 2 && 'bg-gray-400 text-white',
          position === 3 && 'bg-amber-600 text-white',
          position > 3 && 'bg-gray-200 text-gray-700'
        )}
      >
        {position}
      </div>

      {/* Deputado info in center */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm truncate">
            {deputado.nomeEleitoral}
          </h3>
          <Badge variant="secondary" className="text-xs shrink-0">
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
