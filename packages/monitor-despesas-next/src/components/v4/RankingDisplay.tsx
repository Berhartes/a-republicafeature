
import React, { useState, useMemo } from 'react'
import { Trophy, Crown, Medal, Award, TrendingUp, TrendingDown, Minus, Eye, User, Clock, Database, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Link } from '@/lib/router/navigation'
import { RankingResult, RankingEntry } from '@/core/rankings/RankingEngine'
import { RankingUtils } from '@/core/rankings/RankingEngine'

export interface RankingDisplayProps {
  ranking: RankingResult | null
  
  loading?: boolean
  
  error?: string
  
  title?: string
  
  description?: string
  
  showSortControls?: boolean
  
  showSummaryStats?: boolean
  
  showDataQuality?: boolean
  
  cardSize?: 'sm' | 'md' | 'lg'
  
  onDeputyClick?: (deputyId: string) => void
  
  maxEntries?: number
}

type SortOption = 'position' | 'amount' | 'transactions' | 'suppliers' | 'name' | 'party'

export const RankingDisplay: React.FC<RankingDisplayProps> = ({
  ranking,
  loading = false,
  error,
  title,
  description,
  showSortControls = true,
  showSummaryStats = true,
  showDataQuality = true,
  cardSize = 'md',
  onDeputyClick,
  maxEntries = 100
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('position')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  
  const sortedEntries = useMemo(() => {
    if (!ranking?.entries) return []
    
    const entries = [...ranking.entries].slice(0, maxEntries)
    
    return entries.sort((a, b) => {
      let valueA: any, valueB: any
      
      switch (sortBy) {
        case 'position':
          valueA = a.position
          valueB = b.position
          break
        case 'amount':
          valueA = a.deputy.totalAmount
          valueB = b.deputy.totalAmount
          break
        case 'transactions':
          valueA = a.deputy.transactionCount
          valueB = b.deputy.transactionCount
          break
        case 'suppliers':
          valueA = a.deputy.supplierCount
          valueB = b.deputy.supplierCount
          break
        case 'name':
          valueA = a.deputy.name
          valueB = b.deputy.name
          break
        case 'party':
          valueA = a.deputy.party
          valueB = b.deputy.party
          break
        default:
          valueA = a.position
          valueB = b.position
      }
      
      if (typeof valueA === 'string') {
        const comparison = valueA.localeCompare(valueB)
        return sortDirection === 'desc' ? -comparison : comparison
      } else {
        const comparison = valueA - valueB
        return sortDirection === 'desc' ? -comparison : comparison
      }
    })
  }, [ranking?.entries, sortBy, sortDirection, maxEntries])
  
  const getPositionIcon = (position: number) => {
    if (position === 1) return <Crown className="w-5 h-5 text-yellow-500" />
    if (position === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (position === 3) return <Award className="w-5 h-5 text-amber-600" />
    if (position <= 10) return <Trophy className="w-4 h-4 text-blue-500" />
    return null
  }
  
  const getPositionBadgeColor = (position: number) => {
    if (position === 1) return 'bg-yellow-500 text-white'
    if (position === 2) return 'bg-gray-400 text-white'
    if (position === 3) return 'bg-amber-600 text-white'
    if (position <= 10) return 'bg-blue-500 text-white'
    return 'bg-gray-500 text-white'
  }
  
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />
      case 'stable': return <Minus className="w-4 h-4 text-gray-400" />
      default: return null
    }
  }
  
  const getDataQualityIcon = (quality: 'high' | 'medium' | 'low') => {
    switch (quality) {
      case 'high': return <Database className="w-4 h-4 text-green-500" />
      case 'medium': return <Database className="w-4 h-4 text-yellow-500" />
      case 'low': return <Database className="w-4 h-4 text-red-500" />
    }
  }
  
  const handleDeputyClick = (entry: RankingEntry) => {
    if (onDeputyClick) {
      onDeputyClick(entry.deputy.id)
    }
  }
  
  const sizeClasses = {
    sm: {
      card: 'p-3',
      entry: 'p-3',
      avatar: 'w-8 h-8',
      text: 'text-sm'
    },
    md: {
      card: 'p-4',
      entry: 'p-4',
      avatar: 'w-10 h-10',
      text: 'text-base'
    },
    lg: {
      card: 'p-6',
      entry: 'p-6',
      avatar: 'w-12 h-12',
      text: 'text-lg'
    }
  }
  
  const currentSizeClasses = sizeClasses[cardSize]
  
  if (loading) {
    return (
      <Card className={currentSizeClasses.card}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Carregando ranking...</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (error) {
    return (
      <Card className={currentSizeClasses.card}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-red-500">
            <AlertTriangle className="w-6 h-6" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  if (!ranking || sortedEntries.length === 0) {
    return (
      <Card className={currentSizeClasses.card}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Trophy className="w-12 h-12 opacity-50" />
            <span>Nenhum resultado encontrado</span>
            <span className="text-xs">
              Tente ajustar os filtros ou escolher um período diferente
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const displayTitle = title || 
    (ranking.metadata.categoryName ? 
      `Ranking: ${ranking.metadata.categoryName}` : 
      'Ranking Geral')
      
  const displayDescription = description || 
    `${sortedEntries.length} deputados • ${ranking.metadata.period} • ${ranking.metadata.source}`
  
  return (
    <Card className={currentSizeClasses.card}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              {displayTitle}
            </CardTitle>
            <CardDescription>
              {displayDescription}
            </CardDescription>
          </div>
          
          {/* Controles de ordenação */}
          {showSortControls && (
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="position">Posição</SelectItem>
                  <SelectItem value="amount">Valor Total</SelectItem>
                  <SelectItem value="transactions">Transações</SelectItem>
                  <SelectItem value="suppliers">Fornecedores</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="party">Partido</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
              >
                {sortDirection === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          )}
        </div>
        
        {/* Estatísticas resumidas */}
        {showSummaryStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Deputados</p>
              <p className="text-lg font-bold">{ranking.metadata.totalDeputies}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-green-600">
                {RankingUtils.formatCurrency(ranking.metadata.totalAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Transações</p>
              <p className="text-lg font-bold text-blue-600">
                {RankingUtils.formatNumber(ranking.metadata.totalTransactions)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Média por Deputado</p>
              <p className="text-lg font-bold text-purple-600">
                {RankingUtils.formatCurrency(ranking.metadata.totalAmount / ranking.metadata.totalDeputies)}
              </p>
            </div>
          </div>
        )}
        
        {/* Qualidade dos dados */}
        {showDataQuality && (
          <div className="flex items-center justify-between mt-4 p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              {getDataQualityIcon(ranking.metadata.dataQuality)}
              <span className="text-sm">
                Qualidade: <strong>{ranking.metadata.dataQuality}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{ranking.metadata.processingTime}ms</span>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Lista de deputados */}
        {sortedEntries.map((entry, index) => (
          <div
            key={entry.deputy.id}
            className={`
              border rounded-lg ${currentSizeClasses.entry} 
              hover:bg-muted/50 transition-colors cursor-pointer
              ${entry.position <= 3 ? 'border-yellow-300 bg-yellow-50/50' : ''}
            `}
            onClick={() => handleDeputyClick(entry)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                {/* Posição e ícone */}
                <div className="flex items-center gap-2">
                  <Badge className={`${getPositionBadgeColor(entry.position)} flex items-center gap-1`}>
                    {getPositionIcon(entry.position)}
                    #{entry.position}
                  </Badge>
                  {getTrendIcon(entry.trend)}
                </div>
                
                {/* Avatar (placeholder) */}
                <div className={`${currentSizeClasses.avatar} rounded-full bg-muted flex items-center justify-center`}>
                  {entry.deputy.photoUrl ? (
                    <img 
                      src={entry.deputy.photoUrl} 
                      alt={entry.deputy.name}
                      className={`${currentSizeClasses.avatar} rounded-full object-cover`}
                    />
                  ) : (
                    <User className="w-1/2 h-1/2 text-muted-foreground" />
                  )}
                </div>
                
                {/* Informações do deputado */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${currentSizeClasses.text} truncate`}>
                      {entry.deputy.name}
                    </h3>
                    <Badge variant="outline">{entry.deputy.party}</Badge>
                    <Badge variant="outline">{entry.deputy.state}</Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Valor Total:</p>
                      <p className="font-bold text-green-600">
                        {RankingUtils.formatCurrency(entry.deputy.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Transações:</p>
                      <p className="font-bold">
                        {RankingUtils.formatNumber(entry.deputy.transactionCount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fornecedores:</p>
                      <p className="font-bold">
                        {RankingUtils.formatNumber(entry.deputy.supplierCount)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Barra de progresso - porcentagem do total */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-muted-foreground">
                        {entry.percentageOfTotal.toFixed(1)}% do total
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Média: {RankingUtils.formatCurrency(entry.averageTransaction)}
                      </span>
                    </div>
                    <Progress 
                      value={entry.percentageOfTotal} 
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
              
              {/* Botão de ação */}
              <div className="flex items-center gap-2 ml-4">
                <Link 
                  to={`/gastos/perfil/${entry.deputy.id}`}
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-3"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Perfil
                </Link>
              </div>
            </div>
          </div>
        ))}
        
        {/* Rodapé com informações do sistema */}
        <div className="mt-6 pt-4 border-t text-xs text-muted-foreground text-center">
          🚀 Sistema V4 • Dados processados em tempo real • 
          Última atualização: {ranking.metadata.lastUpdate.toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  )
}

export default RankingDisplay