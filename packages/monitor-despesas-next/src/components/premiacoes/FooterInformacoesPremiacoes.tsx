
import React, { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { type PremiacoesGlobais } from '@/services/premiacao-unificada'

interface FooterInformacoesPremiacoesProps {
  ultimaAtualizacao: Date | null
  premiacoes: PremiacoesGlobais | null
}

export function FooterInformacoesPremiacoes({
  ultimaAtualizacao,
  premiacoes
}: FooterInformacoesPremiacoesProps) {
  const estatisticasPremiacoes = useMemo(() => {
    if (!premiacoes) return null

    const deputadosUnicos = new Set<string>()
    premiacoes.coroas.forEach(c => deputadosUnicos.add(c.deputadoId))
    premiacoes.trofeus.forEach(t => deputadosUnicos.add(t.deputadoId))
    premiacoes.medalhas.forEach(m => deputadosUnicos.add(m.deputadoId))

    return {
      deputadosPremiados: deputadosUnicos.size,
      totalPremiacoes: premiacoes.coroas.length + premiacoes.trofeus.length + premiacoes.medalhas.length
    }
  }, [premiacoes])

  if (!ultimaAtualizacao) return null

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>
            <strong>Última atualização das premiações:</strong> {ultimaAtualizacao.toLocaleString('pt-BR') || 'Não disponível'}
          </span>
          {estatisticasPremiacoes && (
            <div className="flex gap-6">
              <span>
                <strong>Deputados premiados:</strong> {estatisticasPremiacoes.deputadosPremiados}
              </span>
              <span>
                <strong>Total de premiações:</strong> {estatisticasPremiacoes.totalPremiacoes}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default FooterInformacoesPremiacoes