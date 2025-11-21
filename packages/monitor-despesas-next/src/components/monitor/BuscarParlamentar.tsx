"use client"
 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import CardParlamentar from '@/components/monitor/CardParlamentar'
import type { DeputadoResumo } from '@a-republica/shared'
import { formatCompactCurrencyBRL } from '@/lib/formatters'

type Values = { search?: string; partido?: string; uf?: string; sort?: string; page?: string }

export default function BuscarParlamentar({
  partidos,
  ufs,
  values,
  onUpdate,
  onSearch,
  onClear,
  isPending,
  deputados,
  total,
  pageSize,
}: {
  partidos: string[]
  ufs: string[]
  values: Values
  onUpdate: (updates: Record<string, string | null>) => void
  onSearch: (term: string) => void
  onClear: () => void
  isPending?: boolean
  deputados: DeputadoResumo[]
  total: number
  pageSize: number
}) {
  const [searchInput, setSearchInput] = useState(values.search || '')

  const handleSearch = () => {
    onSearch(searchInput || '')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const hasQuery = Boolean(values.search || values.partido || values.uf || values.sort || values.page)
  const paginaAtual = parseInt(values.page || '1', 10)
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize))
  const statsDisponiveis = useMemo(() => deputados && deputados.length > 0, [deputados])

  return (
    <div className="space-y-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Label htmlFor="buscar-parlamentar-search" className="sr-only">Buscar deputados por nome</Label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="buscar-parlamentar-search"
                    placeholder="Buscar por nome..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isPending}>Buscar</Button>
              </div>
            </div>
 
            <Select
              value={values.partido || 'todos'}
              onValueChange={(value) => onUpdate({ partido: value })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os partidos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os partidos</SelectItem>
                {partidos.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
 
            <Select
              value={values.uf || 'todos'}
              onValueChange={(value) => onUpdate({ uf: value })}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os estados</SelectItem>
                {ufs.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
 
          <div className="mt-4 flex items-center gap-4">
            <Select
              value={values.sort || 'gasto'}
              onValueChange={(value) => onUpdate({ sort: value })}
              disabled={isPending}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasto">Maior Gasto</SelectItem>
                <SelectItem value="nome">Nome (A-Z)</SelectItem>
                <SelectItem value="partido">Partido</SelectItem>
                <SelectItem value="uf">Estado</SelectItem>
              </SelectContent>
            </Select>
 
            {hasQuery && (
              <Button variant="outline" onClick={onClear} disabled={isPending}>Limpar Filtros</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${isPending ? 'opacity-50' : ''}`}>
        {deputados.map((deputado) => (
          <CardParlamentar key={deputado.id} deputado={deputado} />
        ))}
      </div>

      {total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">Página {paginaAtual} de {totalPaginas} • {total} deputados</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onUpdate({ page: String(paginaAtual - 1) })} disabled={paginaAtual === 1 || isPending}>
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={() => onUpdate({ page: String(paginaAtual + 1) })} disabled={paginaAtual === totalPaginas || isPending}>
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
