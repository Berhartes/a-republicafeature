'use client'

import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UnifiedRankingDisplay } from '@/components/unified/UnifiedRankingDisplay'
import type { DeputadoProcessado, PremiacoesProcessadas } from '@/types/etl-deputados.types'

export interface RankingsFiltradosProps {
  ranking: DeputadoProcessado[]
  titulo: string
  loading?: boolean
  onDeputadoClick?: (id: string) => void
  premiacoes?: PremiacoesProcessadas
}

export function RankingsFiltrados({
  ranking,
  titulo,
  loading = false,
  onDeputadoClick,
  premiacoes,
}: RankingsFiltradosProps) {
  // Implement useState for deputadosExibidos (initial: 50)
  const [deputadosExibidos, setDeputadosExibidos] = useState(50)

  // Slice ranking array to show only first deputadosExibidos items
  const rankingExibido = ranking.slice(0, deputadosExibidos)
  const totalDeputados = ranking.length
  const deputadosRestantes = Math.max(0, totalDeputados - deputadosExibidos)

  // Handler to increment deputadosExibidos by 50
  const handleVerMais = () => {
    setDeputadosExibidos((prev) => Math.min(prev + 50, totalDeputados))
  }

  return (
    <Card>
      {/* CardHeader showing dynamic titulo */}
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
        {/* CardDescription showing "Exibindo X de Y deputados" */}
        <CardDescription>
          Exibindo {rankingExibido.length} de {totalDeputados} deputados
        </CardDescription>
      </CardHeader>

      {/* Render UnifiedRankingDisplay inside CardContent */}
      <CardContent>
        <UnifiedRankingDisplay
          deputados={rankingExibido}
          premiacoes={premiacoes}
          onDeputadoClick={onDeputadoClick}
          showBadges={true}
        />
      </CardContent>

      {/* Conditionally render Button when deputadosExibidos < ranking.length */}
      {deputadosExibidos < totalDeputados && (
        <CardFooter className="flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleVerMais}
            disabled={loading}
          >
            Ver mais +50 deputados ({deputadosRestantes} restantes)
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
