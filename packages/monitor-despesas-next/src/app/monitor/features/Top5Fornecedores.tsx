"use client"

import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Building2, Eye, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useFilter } from '@/contexts/FilterContext'

// Simple color mapping for categories
const getCategoriaColor = (categoria: string): string => {
  const colors: Record<string, string> = {
    'COMBUSTÍVEIS': '#3B82F6',
    'PASSAGENS': '#EF4444',
    'ALIMENTAÇÃO': '#F59E0B',
    'HOSPEDAGEM': '#14B8A6',
    'DIVULGAÇÃO': '#10B981',
    'TELEFONIA': '#6B7280',
  }
  const key = Object.keys(colors).find(k => categoria.toUpperCase().includes(k))
  return key ? colors[key] : '#3B82F6'
}

export interface TopFornecedorItem {
  nome: string
  cnpj?: string
  valor: number
  numeroTransacoes: number
  categoriaPrincipal?: string
  categorias?: string[]
  deputadosAtendidos?: string[] | number
}

interface Top5FornecedoresProps {
  items: TopFornecedorItem[]
  title?: string
  description?: string
  className?: string
  height?: number
  totalReferencia?: number
  categorias?: string[]
  categoriaSelecionada?: string
  onCategoriaChange?: (categoria: string) => void
  categorySelectMode?: 'none' | 'dropdown' | 'button'
  emptyMessage?: string
  monetaryFormat?: 'with-cents' | 'without-cents'
  showDeputadosCount?: boolean
}

export function Top5Fornecedores({
  items,
  title = 'Top 5 Fornecedores',
  description = 'Fornecedores com maior volume de transações',
  className,
  height = 360,
  totalReferencia,
  categorias = [],
  categoriaSelecionada = 'TODAS',
  onCategoriaChange,
  categorySelectMode = 'none',
  emptyMessage,
  monetaryFormat = 'without-cents',
  showDeputadosCount = true,
}: Top5FornecedoresProps) {
  const router = useRouter()
  const { selectedCategory, setSelectedCategory } = useFilter()
  const fornecedores = (items || []).map((f) => ({
    nome: f.nome,
    cnpj: f.cnpj,
    valor: f.valor,
    numeroTransacoes: f.numeroTransacoes,
    categoriaPrincipal: f.categoriaPrincipal || 'N/D',
    categorias: f.categorias || (f.categoriaPrincipal ? [f.categoriaPrincipal] : []),
    deputadosAtendidos: f.deputadosAtendidos,
  }))

  const total = typeof totalReferencia === 'number' ? totalReferencia : fornecedores.reduce((sum, f) => sum + (f.valor || 0), 0)

  const formatarValor = (valor: number) => {
    const partes = valor.toFixed(monetaryFormat === 'with-cents' ? 2 : 0).split('.')
    const inteiro = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    const decimal = partes[1]
    return monetaryFormat === 'with-cents' && decimal ? `${inteiro},${decimal}` : inteiro
  }

  const getCategoriaCorHex = (categoria: string) => getCategoriaColor(categoria)

  const getCorCategoriaBadge = (categoria: string) => {
    const cor = getCategoriaCorHex(categoria)
    const map: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-300',
      '#10B981': 'bg-green-100 text-green-800 border-green-300',
      '#F59E0B': 'bg-yellow-100 text-yellow-800 border-yellow-300',
      '#EF4444': 'bg-red-100 text-red-800 border-red-300',
      '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-300',
      '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-300',
      '#6B7280': 'bg-gray-100 text-gray-800 border-gray-300',
      '#EC4899': 'bg-pink-100 text-pink-800 border-pink-300',
    }
    return map[cor] || 'bg-gray-100 text-gray-800 border-gray-300'
  }

  const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
  const groupCategory = (s: string) => {
    const n = norm(s)
    if ((/PASSAG/).test(n) && (/AER/).test(n)) return 'PASSAGENS_AEREAS'
    if ((/DIVULGACAO/).test(n) && (/ATIVIDADE/).test(n)) return 'DIVULGACAO_ATIVIDADE'
    if (((/LOCACAO/).test(n) || (/FRETAMENTO/).test(n)) && (/VEICUL/).test(n)) return 'LOCACAO_VEICULOS'
    if ((/TELEFON/).test(n)) return 'TELEFONIA'
    return n
  }

  const handleVerPerfil = (cnpj?: string) => {
    if (!cnpj) return
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '')
    if (cnpjLimpo) router.push(`/gastos/fornecedor/${cnpjLimpo}`)
  }

  const handleCategoriaChange = (nova: string) => {
    if (onCategoriaChange) onCategoriaChange(nova)
    setSelectedCategory(nova === 'TODAS' ? undefined : nova)
  }

  const defaultDescription = `Fornecedores com maior volume de transações${categoriaSelecionada !== 'TODAS' ? ` • Categoria: ${categoriaSelecionada}` : ''}`

  return (
    <Card className={cn('w-full', className)} style={{ minHeight: height }}>
      {(title || description || categorySelectMode !== 'none') && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {title}
              </CardTitle>
              <CardDescription>{description || defaultDescription}</CardDescription>
            </div>
            {categorySelectMode !== 'none' && categorias.length > 0 && (
              <div className="flex flex-col items-end gap-2">
                {categorySelectMode === 'dropdown' && (
                  <>
                    <span className="text-sm text-muted-foreground">Filtrar:</span>
                    <Select value={(selectedCategory ?? categoriaSelecionada) || 'TODAS'} onValueChange={handleCategoriaChange}>
                      <SelectTrigger className="w-[180px]" aria-label="Filtrar por categoria">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TODAS">Todas</SelectItem>
                        {categorias.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                {categorySelectMode === 'button' && (
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar categoria
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      <CardContent>
        {fornecedores.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum fornecedor encontrado</h3>
            <p className="text-muted-foreground mb-4">{emptyMessage || 'Não foram encontrados fornecedores.'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(() => {
              const active = (selectedCategory ?? categoriaSelecionada) || 'TODAS'
              const filtered = active !== 'TODAS'
                ? fornecedores.filter((f) => {
                  const list = Array.isArray(f.categorias) ? f.categorias : []
                  const principal = f.categoriaPrincipal || ''
                  const tgt = groupCategory(active)
                  const matchesList = list.some((c) => {
                    const gc = groupCategory(c)
                    return gc === tgt || norm(c).includes(norm(active)) || norm(active).includes(norm(c))
                  })
                  const matchesPrincipal = groupCategory(principal) === tgt || norm(principal).includes(norm(active)) || norm(active).includes(norm(principal))
                  return matchesList || matchesPrincipal
                })
                : fornecedores
              const sorted = filtered.slice().sort((a, b) => (b.valor || 0) - (a.valor || 0))
              const top5 = sorted.slice(0, 5)
              const totalFiltrado = sorted.reduce((sum, f) => sum + (f.valor || 0), 0)
              return top5.map((f, index) => ({ f, index, totalFiltrado }))
            })().map(({ f, index, totalFiltrado }) => (
              <div key={`fornecedor-${index}`} className="flex flex-col p-4 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div
                      className="w-8 h-8 mt-0.5 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm"
                      style={{
                        backgroundColor:
                          index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#3B82F6',
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-base">
                        {(f.nome || 'Nome não disponível').length > 40 ? (f.nome || '').substring(0, 40) + '...' : (f.nome || 'Nome não disponível')}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{f.numeroTransacoes} transações</span>
                        {showDeputadosCount && typeof f.deputadosAtendidos === 'number' && f.deputadosAtendidos > 0 && (
                          <span className="text-purple-600 font-medium">{f.deputadosAtendidos} {f.deputadosAtendidos === 1 ? 'deputado' : 'deputados'}</span>
                        )}
                        {f.categorias && f.categorias.length > 1 && (
                          <span className="text-blue-600">+{f.categorias.length - 1} categorias</span>
                        )}
                      </div>
                      {f.cnpj && f.cnpj.trim() !== '' && (
                        <div className="text-xs text-muted-foreground font-mono mt-1">CNPJ: {f.cnpj}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-bold text-foreground text-lg">R$ {formatarValor(f.valor)}</div>
                    <div className="text-xs text-muted-foreground">
                      {(() => {
                        const percentual = totalFiltrado > 0 ? (f.valor / totalFiltrado) * 100 : 0
                        return `${percentual.toFixed(1)}% do total`
                      })()}
                    </div>
                    {f.numeroTransacoes > 0 && (
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        R$ {(() => {
                          const vpt = Math.round(f.valor / f.numeroTransacoes)
                          return vpt.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                        })()} /transação
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
                    {(() => {
                      const percentual = total > 0 ? (f.valor / total) * 100 : 0
                      const width = Math.max(2, Math.min(100, percentual))
                      return (
                        <div
                          className="absolute top-0 left-0 h-2 rounded-full shadow-sm transition-all"
                          style={{
                            width: `${width}%`,
                            background:
                              index === 0 || index === 1 || index === 2
                                ? `linear-gradient(to right, ${index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32'}, ${index === 0 ? '#FFD700AA' : index === 1 ? '#C0C0CAA' : '#CD7F32AA'})`
                                : 'linear-gradient(to right, #3B82F6, #3B82F6AA)',
                          }}
                        />
                      )
                    })()}
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg text-center break-words border ${getCorCategoriaBadge(f.categoriaPrincipal || 'N/D')}`}>📁 {f.categoriaPrincipal || 'N/D'}</span>
                  <Button size="sm" variant="outline" className="text-xs h-8 px-3 shrink-0" onClick={() => handleVerPerfil(f.cnpj)} disabled={!f.cnpj || f.cnpj.trim() === ''}>
                    <Eye className="h-3 w-3 mr-1" /> Ver Perfil
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}



