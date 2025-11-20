"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, MapPin, User, TrendingUp, AlertTriangle, Star } from 'lucide-react'
import type { DeputadoResumo } from '@a-republica/shared'
import { formatCompactCurrencyBRL } from '@/lib/formatters'
import { useRouter } from 'next/navigation'

export default function CardParlamentar({ deputado }: { deputado: DeputadoResumo }) {
  const router = useRouter()
  const [imageError, setImageError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const numAlertas = typeof deputado.alertas === 'number' ? deputado.alertas : 0
  const score = typeof deputado.scoreSuspeicao === 'number' ? deputado.scoreSuspeicao : 0

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getScoreBadge = (s: number) => {
    if (s >= 70) return 'destructive'
    if (s >= 40) return 'secondary'
    return 'default'
  }

  const getScoreColor = (s: number) => {
    if (s >= 70) return 'text-red-600'
    if (s >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  if (!isMounted) {
    return (
      <div className="overflow-hidden border border-gray-200 rounded-lg bg-white animate-pulse">
        <div className="bg-gray-100 p-4 h-32"></div>
        <div className="p-4 space-y-3">
          <div className="h-20 bg-gray-100 rounded"></div>
          <div className="h-10 bg-gray-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden hover:shadow-lg transition-all border border-gray-200 rounded-lg bg-white">
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {!imageError ? (
              <img
                src={`https://www.camara.leg.br/internet/deputado/bandep/${deputado.id}.jpg`}
                alt={deputado.nomeEleitoral}
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-md">
                <User className="h-8 w-8 text-gray-500" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-lg">{deputado.nomeEleitoral}</h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="text-xs">{deputado.siglaPartido}</Badge>
                <span className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" />{deputado.siglaUf}</span>
              </div>
            </div>
          </div>
          <Badge variant={getScoreBadge(score)} className="text-lg px-3 py-1">{score}</Badge>
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-600">Total Gasto</p>
            <p className="font-semibold text-sm flex items-center justify-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {formatCompactCurrencyBRL(deputado.totalDespesas)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Alertas</p>
            <p className="font-semibold text-sm flex items-center justify-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {numAlertas}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Score</p>
            <p className={`font-semibold text-sm ${getScoreColor(score)}`}>{score}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1" variant="outline" onClick={() => router.push(`/gastos/perfil/${deputado.id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>
          <Button size="icon" variant="outline" onClick={toggleFavorite} className={isFavorite ? 'text-yellow-500 hover:text-yellow-600' : ''} aria-label={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}>
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  )
}
