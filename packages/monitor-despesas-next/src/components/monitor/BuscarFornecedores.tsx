"use client"

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Building2, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import type { FornecedorResumo } from '@a-republica/shared'

type Values = { search?: string; categoria?: string; uf?: string; sort?: string; page?: string }

type SearchResolved = {
  searchTerm?: string
  categoria?: string
  scoreMinimo?: string
  sortBy?: 'nome' | 'totalRecebido' | 'numeroTransacoes' | 'scoreSuspeicao'
  page?: string
}

export default function BuscarFornecedores({
  categorias,
  ufs,
  values,
  onUpdate,
  onSearch,
  onClear,
  isPending,
  fornecedores,
  total,
  pageSize,
  searchParams,
  dataSource = 'etl',
}: {
  categorias: string[]
  ufs: string[]
  values: Values
  onUpdate: (updates: Record<string, string | null>) => void
  onSearch: (term: string) => void
  onClear: () => void
  isPending?: boolean
  fornecedores: FornecedorResumo[]
  total: number
  pageSize: number
  searchParams: SearchResolved
  dataSource?: 'etl' | 'test' | 'backup' | 'api' | 'cdn' | 'empty'
}) {
  const [searchInput, setSearchInput] = useState(values.search || '')

  const handleSearch = () => {
    onSearch(searchInput || '')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  const hasQuery = Boolean(values.search || values.categoria || values.uf || values.sort || values.page)

  const paginaAtual = parseInt(searchParams.page || '1', 10)
  const totalPaginas = Math.max(1, Math.ceil((total || 0) / pageSize))

  const categoriasDisponiveis = useMemo(() => {
    const mapa: Record<string, number> = {}
    fornecedores.forEach(f => {
      const principal = (f.tipoDespesaPrincipal || '').trim()
      const categoria = principal || 'SEM_CATEGORIA'
      mapa[categoria] = (mapa[categoria] || 0) + (f.totalRecebido || 0)
    })
    return Object.keys(mapa).filter(Boolean).sort((a, b) => mapa[b] - mapa[a])
  }, [fornecedores])

  const mudarPagina = (p: number) => {
    onUpdate({ page: String(p) })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros de Fornecedores</CardTitle>
          <CardDescription>Filtre e busque fornecedores específicos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Label htmlFor="buscar-fornecedores-search" className="sr-only">Buscar fornecedores por nome</Label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="buscar-fornecedores-search"
                    placeholder="Buscar por nome..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isPending}>Aplicar</Button>
              </div>
              <div className="mt-2 text-sm font-medium text-green-800">✅ FONTE DE DADOS: {dataSource === 'etl' ? 'Dados carregados do cache ETL.' : 'Dados processados.'}</div>
            </div>

            <Select
              value={values.categoria || 'todas'}
              onValueChange={(value) => onUpdate({ categoria: value })}
              disabled={isPending}
            >
              <SelectTrigger aria-label="Filtrar por categoria">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={values.uf || 'todos'}
              onValueChange={(value) => onUpdate({ uf: value })}
              disabled={isPending}
            >
              <SelectTrigger aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
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
              <SelectTrigger className="w-[220px]" aria-label="Ordenar por">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gasto">Maior Gasto</SelectItem>
                <SelectItem value="nome">Nome (A-Z)</SelectItem>
                <SelectItem value="categoria">Categoria</SelectItem>
                <SelectItem value="uf">Estado</SelectItem>
              </SelectContent>
            </Select>

            {hasQuery && (
              <Button variant="outline" onClick={onClear} disabled={isPending}>Limpar Filtros</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Fornecedores
            <Badge variant="secondary">{formatNumberBR(total)}</Badge>
          </CardTitle>
          <CardDescription>Fornecedores ordenados por valor total transacionado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`space-y-3 ${isPending ? 'opacity-50' : ''}`}>
            {fornecedores.map((fornecedor, index) => {
              const rank = ((paginaAtual - 1) * pageSize) + index + 1
              const score = (fornecedor as any).scoreSuspeicao as number | undefined
              const scoreColor = score && score > 70 ? 'bg-red-500' : score && score > 30 ? 'bg-yellow-500' : 'bg-green-500'
              const scoreLabel = score && score > 70 ? 'Alto Risco' : score && score > 30 ? 'Risco Médio' : 'Baixo Risco'
              return (
                <div key={`${fornecedor.cnpjCpf}-${rank}`} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground font-mono">#{rank.toString().padStart(3, '0')}</span>
                      <div>
                        <h3 className="font-medium">{fornecedor.nome}</h3>
                        <p className="text-sm text-muted-foreground">CNPJ: {fornecedor.cnpjCpf} • {(fornecedor.tipoDespesaPrincipal || '').trim() || 'SEM_CATEGORIA'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium">{formatCurrencyBRL(fornecedor.totalRecebido)}</p>
                      <p className="text-sm text-muted-foreground">{formatNumberBR(fornecedor.numeroTransacoes)} transações</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${scoreColor}`}></div>
                      <span className="text-sm font-medium">{typeof score === 'number' ? score.toFixed(0) : '-'}</span>
                      <Badge variant="outline" className="text-xs">{scoreLabel}</Badge>
                    </div>
                  </div>
                </div>
              )
            })}

            {total > pageSize && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Mostrando <span className="font-medium text-foreground">{formatNumberBR((paginaAtual - 1) * pageSize + 1)}</span>
                  {' '}–{' '}
                  <span className="font-medium text-foreground">{formatNumberBR(Math.min(paginaAtual * pageSize, total))}</span>
                  {' '}de{' '}
                  <span className="font-medium text-foreground">{formatNumberBR(total)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => mudarPagina(paginaAtual - 1)} disabled={paginaAtual === 1 || isPending} aria-label="Página anterior">
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">Página <span className="font-medium text-foreground">{paginaAtual}</span> de <span className="font-medium text-foreground">{totalPaginas}</span></span>
                  <Button variant="outline" size="sm" onClick={() => mudarPagina(paginaAtual + 1)} disabled={paginaAtual === totalPaginas || isPending} aria-label="Próxima página">
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {total === 0 && !isPending && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground">Ajuste os filtros para ver mais resultados.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
