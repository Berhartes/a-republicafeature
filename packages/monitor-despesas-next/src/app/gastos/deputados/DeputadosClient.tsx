'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Eye, MapPin, User, Star } from 'lucide-react'
import type { DeputadoResumo } from '@a-republica/shared'
import { formatCurrencyBRL, formatCompactCurrencyBRL } from '@/lib/formatters'
import MiniCardStats from '@/components/monitor/MiniCardStats'
import BuscarParlamentar from '@/components/monitor/BuscarParlamentar'

interface DeputadosClientProps {
  deputados: DeputadoResumo[]
  total: number
  partidos: string[]
  ufs: string[]
  stats: {
    total: number
    totalGasto: number
    mediaGasto: number
  }
  currentPage: number
  pageSize: number
}

function DeputadoCardItem({ 
  deputado, 
  router 
}: { 
  deputado: DeputadoResumo
  router: ReturnType<typeof useRouter>
}) {
  const [imageError, setImageError] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  
  const numAlertas = typeof deputado.alertas === 'number' ? deputado.alertas : 0
  const score = typeof deputado.scoreSuspeicao === 'number' ? deputado.scoreSuspeicao : 0

  // Garante que o componente só renderiza depois de montar no cliente
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getScoreBadge = (score: number) => {
    if (score >= 70) return 'destructive'
    if (score >= 40) return 'secondary'
    return 'default'
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  // Renderiza placeholder durante SSR
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
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Foto do deputado */}
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

            {/* Nome e info básica */}
            <div>
              <h3 className="font-semibold text-lg">{deputado.nomeEleitoral}</h3>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {deputado.siglaPartido}
                </Badge>
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {deputado.siglaUf}
                </span>
              </div>
            </div>
          </div>

          {/* Badge de score */}
          <Badge variant={getScoreBadge(score)} className="text-lg px-3 py-1">
            {score}
          </Badge>
        </div>
      </div>

      {/* Corpo do card */}
      <div className="p-4 space-y-3">
        {/* Grid de estatísticas */}
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
            <p className={`font-semibold text-sm ${getScoreColor(score)}`}>
              {score}
            </p>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            variant="outline"
            onClick={() => router.push(`/gastos/perfil/${deputado.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={toggleFavorite}
            title={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            className={isFavorite ? "text-yellow-500 hover:text-yellow-600" : ""}
          >
            <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export function DeputadosClient({
  deputados,
  total,
  partidos,
  ufs,
  stats,
  currentPage,
  pageSize,
}: DeputadosClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const totalPages = Math.ceil(total / pageSize)

  const updateURL = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'todos') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })

    // Reset page quando mudar filtros (exceto navegação de página)
    if (!updates.page && updates.partido || updates.uf || updates.search !== undefined) {
      params.delete('page')
    }

    const queryString = params.toString()
    const url = queryString ? `?${queryString}` : '/gastos/deputados'
    
    startTransition(() => {
      router.push(url)
    })
  }

  const handleSearch = () => {
    updateURL({ search: searchInput || null })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Lista de Deputados v2
        </h1>
        <p className="text-gray-600">
          Stack moderna: Next.js 15 + React 19 + Server Components
        </p>
      </div>

      <div className="mb-6" suppressHydrationWarning>
        <MiniCardStats
          columns={4}
          items={[
            { title: 'Deputados filtrados', value: total, variant: 'compact', color: 'blue', icon: User, formatType: 'number' },
            { title: 'Média de gastos', value: stats.mediaGasto, variant: 'full', color: 'green', icon: TrendingUp, formatType: 'currencyCompactBRL' },
            { title: 'Total gasto', value: stats.totalGasto, variant: 'full', color: 'purple', icon: TrendingUp, formatType: 'currencyCompactBRL' },
            { title: 'Total cadastrados', value: stats.total, variant: 'compact', color: 'amber', icon: User, formatType: 'number' },
          ]}
        />
      </div>

      <BuscarParlamentar
        partidos={partidos}
        ufs={ufs}
        values={{
          search: searchParams.get('search') || undefined,
          partido: searchParams.get('partido') || undefined,
          uf: searchParams.get('uf') || undefined,
          sort: searchParams.get('sort') || undefined,
          page: searchParams.get('page') || undefined,
        }}
        onUpdate={(updates) => updateURL(updates)}
        onSearch={(term) => {
          const v = term || ''
          updateURL({ search: v || null })
        }}
        onClear={() => router.push('/gastos/deputados')}
        isPending={isPending}
        deputados={deputados}
        total={total}
        pageSize={pageSize}
      />

      
    </div>
  )
}
