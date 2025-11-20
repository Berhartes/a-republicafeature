'use client'

import { useMemo, useTransition, type ReactNode } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Building2,
  DollarSign,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { formatCurrencyBRL, formatCompactCurrencyBRL, formatNumberBR } from '@/lib/formatters'

interface PaginationInfo {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface DashboardDeputadoItem {
  id: string
  nome: string
  partido: string
  uf: string
  totalGasto: number
  posicao: number
}

interface DashboardFornecedorItem {
  nome: string
  cnpj: string
  valor: number
  scoreSuspeicao: number
  numTransacoes: number
}

interface PartidoComparativoItem {
  partido: string
  totalGasto: number
  numDeputados: number
  mediaPorDeputado: number
}

interface UfComparativoItem {
  uf: string
  totalGasto: number
  numDeputados: number
  mediaPorDeputado: number
}

interface DashboardAggregatesResponse {
  stats: {
    totalDeputados: number
    totalFornecedores: number
    totalGasto: number
    totalTransacoes: number
    mediaPorDeputado: number
  }
  topFornecedores: {
    items: DashboardFornecedorItem[]
    pagination: PaginationInfo
  }
  partidos: {
    items: PartidoComparativoItem[]
    pagination: PaginationInfo
  }
  ufs: {
    items: UfComparativoItem[]
    pagination: PaginationInfo
  }
  resumoAnual: Array<{ ano: number; total: number }>
}

interface DashboardResponse {
  data: DashboardDeputadoItem[]
  pagination: PaginationInfo
  aggregates: DashboardAggregatesResponse
  metadata?: {
    availableFilters?: {
      anos?: number[]
      partidos?: string[]
      ufs?: string[]
    }
    lastUpdate?: string
  }
  appliedFilters?: {
    ano?: string
    partido?: string
    uf?: string
    page?: number
    pageSize?: number
    partidosPage?: number
  }
}

interface DashboardClientProps {
  response: DashboardResponse
}

const SectionSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <Skeleton key={index} className="h-6 w-full rounded" />
    ))}
  </div>
)

export function DashboardClient({ response }: DashboardClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const { data: deputados, pagination, aggregates, metadata, appliedFilters } = response
  const { stats, resumoAnual, topFornecedores, partidos, ufs } = aggregates

  const anosDisponiveis = metadata?.availableFilters?.anos || []
  const partidosDisponiveis = metadata?.availableFilters?.partidos || []
  const ufsDisponiveis = metadata?.availableFilters?.ufs || []

  const appliedAno = appliedFilters?.ano || 'all'
  const appliedPartido = appliedFilters?.partido || 'TODOS'
  const appliedUf = appliedFilters?.uf || 'TODOS'

  const serieAnual = useMemo(() => [...resumoAnual].sort((a, b) => a.ano - b.ano), [resumoAnual])

  const updateParams = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    mutator(params)
    startTransition(() => {
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  const handleFilterChange = (key: 'ano' | 'partido' | 'uf', value: string) => {
    updateParams(params => {
      const normalized = value === 'all' || value === 'TODOS' ? '' : value
      if (normalized) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      params.set('page', '1')
      if (key === 'partido') {
        params.set('partidosPage', '1')
      }
    })
  }

  const handleRankingPageChange = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1
    const next = Math.min(Math.max(pagination.page + delta, 1), pagination.totalPages)
    if (next === pagination.page) return
    updateParams(params => {
      params.set('page', next.toString())
    })
  }

  const handlePartidosPageChange = (direction: 'prev' | 'next') => {
    const delta = direction === 'prev' ? -1 : 1
    const next = Math.min(
      Math.max((appliedFilters?.partidosPage || partidos.pagination.page) + delta, 1),
      partidos.pagination.totalPages,
    )
    if (next === partidos.pagination.page) return
    updateParams(params => {
      params.set('partidosPage', next.toString())
    })
  }

  return (
    <div className="space-y-6" aria-busy={isPending}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros principais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select value={appliedAno} onValueChange={value => handleFilterChange('ano', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {anosDisponiveis.map(ano => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={appliedPartido}
              onValueChange={value => handleFilterChange('partido', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Partido" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os partidos</SelectItem>
                {partidosDisponiveis.map(partido => (
                  <SelectItem key={partido} value={partido}>
                    {partido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={appliedUf} onValueChange={value => handleFilterChange('uf', value)}>
              <SelectTrigger>
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos os estados</SelectItem>
                {ufsDisponiveis.map(uf => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Users />} title="Deputados" value={formatNumberBR(stats.totalDeputados)} loading={isPending} />
        <StatCard icon={<Building2 />} title="Fornecedores" value={formatNumberBR(stats.totalFornecedores)} loading={isPending} />
        <StatCard icon={<DollarSign />} title="Gasto Total" value={formatCompactCurrencyBRL(stats.totalGasto)} loading={isPending} />
        <StatCard icon={<Receipt />} title="Transações" value={formatNumberBR(stats.totalTransacoes)} loading={isPending} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tendência anual de gastos</CardTitle>
          {metadata?.lastUpdate && (
            <p className="text-xs text-muted-foreground">Atualizado em {new Date(metadata.lastUpdate).toLocaleString('pt-BR')}</p>
          )}
        </CardHeader>
        <CardContent>
          {isPending ? (
            <SectionSkeleton rows={6} />
          ) : serieAnual.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={serieAnual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis tickFormatter={value => `R$ ${(value / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => [formatCurrencyBRL(value), 'Total']} />
                <Line type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados suficientes para plotar a série histórica.</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Ranking de deputados</CardTitle>
              <p className="text-sm text-muted-foreground">Top gastos considerando os filtros aplicados</p>
            </div>
            <Badge variant="secondary">{formatCurrencyBRL(stats.mediaPorDeputado)} média/deputado</Badge>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <SectionSkeleton rows={pagination.pageSize} />
            ) : (
              <div className="space-y-3">
                {deputados.map(dep => (
                  <div key={dep.id} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{dep.posicao}</Badge>
                      <div>
                        <p className="font-medium">{dep.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {dep.partido} • {dep.uf}
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold">{formatCurrencyBRL(dep.totalGasto)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page === 1 || isPending}
                onClick={() => handleRankingPageChange('prev')}
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                disabled={pagination.page === pagination.totalPages || isPending}
                onClick={() => handleRankingPageChange('next')}
                aria-label="Próxima página"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top fornecedores</CardTitle>
            <p className="text-sm text-muted-foreground">Valores ajustados para o ano selecionado</p>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <SectionSkeleton rows={topFornecedores.pagination.pageSize} />
            ) : (
              <div className="space-y-3">
                {topFornecedores.items.map(fornecedor => (
                  <div key={fornecedor.cnpj} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium">{fornecedor.nome}</p>
                      <p className="text-xs text-muted-foreground">{fornecedor.cnpj}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrencyBRL(fornecedor.valor)}</p>
                      <p className="text-xs text-muted-foreground">{fornecedor.numTransacoes} transações</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Comparativo de partidos</CardTitle>
              <p className="text-sm text-muted-foreground">Paginação server-side</p>
            </div>
            <Badge variant="outline">Página {partidos.pagination.page} / {partidos.pagination.totalPages}</Badge>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <SectionSkeleton rows={partidos.pagination.pageSize} />
            ) : partidos.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados para os filtros atuais.</p>
            ) : (
              <div className="space-y-3">
                {partidos.items.map(item => (
                  <div
                    key={item.partido}
                    className={`flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0 ${
                      item.partido === appliedPartido ? 'bg-muted/50 px-2 py-2 rounded' : ''
                    }`}
                  >
                    <div>
                      <p className="font-medium">{item.partido}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.numDeputados} deputado(s) • Média {formatCurrencyBRL(item.mediaPorDeputado)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatCurrencyBRL(item.totalGasto)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={partidos.pagination.page === 1 || isPending}
              onClick={() => handlePartidosPageChange('prev')}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={partidos.pagination.page === partidos.pagination.totalPages || isPending}
              onClick={() => handlePartidosPageChange('next')}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gasto por UF</CardTitle>
            <p className="text-sm text-muted-foreground">Resumo dos estados com maior volume</p>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <SectionSkeleton rows={ufs.pagination.pageSize} />
            ) : (
              <div className="space-y-3">
                {ufs.items.map(item => (
                  <div key={item.uf} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <p className="font-medium">{item.uf}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.numDeputados} deputado(s)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrencyBRL(item.totalGasto)}</p>
                      <p className="text-xs text-muted-foreground">
                        Média {formatCurrencyBRL(item.mediaPorDeputado)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  title,
  value,
  loading,
}: {
  icon: ReactNode
  title: string
  value: string
  loading?: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        {loading ? <Skeleton className="h-6 w-20" /> : <div className="text-2xl font-bold">{value}</div>}
      </CardContent>
    </Card>
  )
}
