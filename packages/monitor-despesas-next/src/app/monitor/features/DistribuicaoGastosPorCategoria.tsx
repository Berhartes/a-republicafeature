"use client"

import React, { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useFilter } from '@/contexts/FilterContext'
import { Loader2, User } from 'lucide-react'

// Tipo local para manter o componente autocontido neste arquivo
interface CategoryData {
  categoria: string
  valor: number
  percentual: string
  count?: number
  cor?: string
}

// Tipos para o ranking de deputados
interface RankingItem {
  deputadoId: string
  nomeEleitoral: string
  foto?: string
  numeroTransacoes: number
  totalGasto: number
  fornecedorTopNome?: string
}

interface DistribuicaoGastosPorCategoriaProps {
  data: CategoryData[]
  loading?: boolean
  title?: string
  description?: string
  className?: string
  height?: number
  onCategoryClick?: (categoria: string) => void
}

// Componente interno para ranking de deputados por categoria
function RankingDeputadosCategoria({ max = 10, selectedCategory }: { max?: number; selectedCategory?: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<RankingItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems([])
    setError(null)
    setOpen(false)
  }, [selectedCategory])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!open || !selectedCategory) return
      setLoading(true)
      setError(null)
      try {
        const { getRankingPorCategoriaSA } = await import('@/features/premiacoes/services/ranking-premiacoes')
        const res = await getRankingPorCategoriaSA(selectedCategory, max)
        if (!ignore) setItems(Array.isArray(res?.ranking) ? res.ranking : [])
      } catch (err) {
        if (!ignore) setError('Falha ao carregar ranking')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [open, selectedCategory, max])

  const totalFiltrado = useMemo(() => items.reduce((s, it) => s + (it.totalGasto || 0), 0), [items])

  if (!selectedCategory) return null

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>Ranking de Deputados na categoria</CardTitle>
          <CardDescription>{selectedCategory}</CardDescription>
        </div>
        <div>
          <Button variant="outline" size="sm" aria-expanded={open} onClick={() => setOpen(v => !v)}>
            {open ? 'Ocultar ranking' : 'Mostrar ranking'}
          </Button>
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</div>
          ) : error ? (
            <div className="text-red-600 text-sm">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum deputado encontrado para a categoria.</div>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={`${it.deputadoId}-${idx}`} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center gap-3">
                    {it.foto ? (
                      <img src={it.foto} alt="Foto" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><User className="h-5 w-5" /></div>
                    )}
                    <div>
                      <div className="font-medium leading-tight">
                        <a href={`/gastos/perfil/${encodeURIComponent(it.deputadoId)}`} className="hover:underline">{it.nomeEleitoral}</a>
                      </div>
                      <div className="text-xs text-muted-foreground">Fornecedor mais gasto: {it.fornecedorTopNome || 'N/D'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-xs">{it.numeroTransacoes} transações</Badge>
                    <div className="text-right">
                      <div className="font-semibold">R$ {it.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-xs text-muted-foreground">{totalFiltrado > 0 ? ((it.totalGasto / totalFiltrado) * 100).toFixed(1) : '0.0'}% do total</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function DistribuicaoGastosPorCategoria({
  data,
  loading = false,
  title,
  description,
  className,
  height = 340,
  onCategoryClick: onCategoryClickProp,
}: DistribuicaoGastosPorCategoriaProps) {
  const { selectedCategory, setSelectedCategory } = useFilter()
  const [showPie, setShowPie] = useState(false)

  // Paleta e lógica de cores replicando a aparência anterior
  const PALETA_CORES = useMemo(() => [
    '#3B82F6', // Azul
    '#10B981', // Verde
    '#F59E0B', // Amarelo/Laranja
    '#EF4444', // Vermelho
    '#8B5CF6', // Roxo
    '#06B6D4', // Ciano
    '#6B7280', // Cinza
    '#EC4899', // Rosa
    '#14B8A6', // Verde-água
    '#F97316', // Laranja
  ] as const, [])

  const MAPEAMENTO_CATEGORIA_COR = useMemo(() => ({
    'COMBUSTÍVEIS E LUBRIFICANTES': '#3B82F6',
    'COMBUSTIVEIS E LUBRIFICANTES': '#3B82F6',

    'PASSAGENS AÉREAS': '#EF4444',
    'PASSAGENS AEREAS': '#EF4444',

    'FORNECIMENTO DE ALIMENTAÇÃO DO PARLAMENTAR': '#F59E0B',
    'FORNECIMENTO DE ALIMENTACAO DO PARLAMENTAR': '#F59E0B',
    'ALIMENTAÇÃO DO PARLAMENTAR': '#F59E0B',
    'ALIMENTACAO DO PARLAMENTAR': '#F59E0B',

    'HOSPEDAGEM ,EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': '#14B8A6',
    'HOSPEDAGEM, EXCETO DO PARLAMENTAR NO DISTRITO FEDERAL': '#14B8A6',
    'HOSPEDAGEM (EXCETO DF)': '#14B8A6',
    'HOSPEDAGEM': '#14B8A6',

    'LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES': '#06B6D4',
    'LOCACAO OU FRETAMENTO DE VEICULOS AUTOMOTORES': '#06B6D4',
    'LOCAÇÃO DE VEÍCULOS AUTOMOTORES': '#06B6D4',
    'LOCACAO DE VEICULOS AUTOMOTORES': '#06B6D4',

    'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR': '#10B981',
    'DIVULGACAO DA ATIVIDADE PARLAMENTAR': '#10B981',

    'CONSULTORIAS, PESQUISAS E TRABALHOS TÉCNICOS': '#8B5CF6',
    'CONSULTORIA, PESQUISA E TRABALHO TECNICO': '#8B5CF6',
    'CONSULTORIAS E TRABALHOS TÉCNICOS': '#8B5CF6',
    'CONSULTORIAS E TRABALHOS TECNICOS': '#8B5CF6',

    'TELEFONIA': '#6B7280',

    'SERVIÇO DE TÁXI, PEDÁGIO E ESTACIONAMENTO': '#6B7280',
    'SERVICO DE TAXI, PEDAGIO E ESTACIONAMENTO': '#6B7280',
    'TÁXI, PEDÁGIO E ESTACIONAMENTO': '#6B7280',
    'TAXI, PEDAGIO E ESTACIONAMENTO': '#6B7280',

    'PASSAGENS TERRESTRES, MARÍTIMAS OU FLUVIAIS': '#8B5CF6',
    'PASSAGENS TERRESTRES, MARITIMAS OU FLUVIAIS': '#8B5CF6',
    'PASSAGENS TERRESTRES/MARÍTIMAS': '#8B5CF6',
    'PASSAGENS TERRESTRES/MARITIMAS': '#8B5CF6',

    'LOCAÇÃO OU FRETAMENTO DE AERONAVES': '#F97316',
    'LOCACAO OU FRETAMENTO DE AERONAVES': '#F97316',
    'LOCAÇÃO DE AERONAVES': '#F97316',
    'LOCACAO DE AERONAVES': '#F97316',

    'PARTICIPAÇÃO EM CURSO, PALESTRA OU EVENTO SIMILAR': '#EC4899',
    'PARTICIPACAO EM CURSO, PALESTRA OU EVENTO SIMILAR': '#EC4899',
    'PARTICIPAÇÃO EM CURSOS/EVENTOS': '#EC4899',
    'PARTICIPACAO EM CURSOS/EVENTOS': '#EC4899',

    'SERVIÇOS POSTAIS': '#EC4899',
    'SERVICOS POSTAIS': '#EC4899',

    'MANUTENÇÃO DE EQUIPAMENTOS DE INFORMÁTICA': '#3B82F6',
    'MANUTENCAO DE EQUIPAMENTOS DE INFORMATICA': '#3B82F6',
    'MANUTENÇÃO DE EQUIPAMENTOS DE TI': '#3B82F6',
    'MANUTENCAO DE EQUIPAMENTOS DE TI': '#3B82F6',

    'ASSINATURA DE PUBLICAÇÕES': '#F97316',
    'ASSINATURA DE PUBLICACOES': '#F97316',

    'AQUISIÇÃO DE TOKENS': '#10B981',
    'AQUISICAO DE TOKENS': '#10B981',
    'MANUTENÇÃO DE ESCRITÓRIO DE APOIO À ATIVIDADE PARLAMENTAR': '#14B8A6',
    'MANUTENCAO DE ESCRITORIO DE APOIO A ATIVIDADE PARLAMENTAR': '#14B8A6',
    'SERVIÇO DE SEGURANÇA PRESTADO POR EMPRESA ESPECIALIZADA': '#EF4444',
    'SERVICO DE SEGURANCA PRESTADO POR EMPRESA ESPECIALIZADA': '#EF4444',
  } as Record<string, string>), [])

  const normalizarCategoria = (text: string): string => {
    return (text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  }

  const getCategoriaColor = (categoria: string): string => {
    if (!categoria) return PALETA_CORES[0]
    const upper = categoria.toUpperCase()
    if (MAPEAMENTO_CATEGORIA_COR[upper]) {
      return MAPEAMENTO_CATEGORIA_COR[upper]
    }

    const norm = normalizarCategoria(categoria)

    if (norm.includes('combusti') || norm.includes('lubrificant')) return '#3B82F6'
    if ((norm.includes('locacao') || norm.includes('fretamento')) && norm.includes('veiculo')) return '#06B6D4'
    if (norm.includes('aeronav') || norm.includes('aviao')) return '#F97316'
    if (norm.includes('passag') && norm.includes('aer')) return '#EF4444'
    if (norm.includes('alimenta') || norm.includes('refeic')) return '#F59E0B'
    if (norm.includes('hospedagem')) return '#14B8A6'
    if (norm.includes('consultoria') || norm.includes('pesquisa')) return '#8B5CF6'
    if (norm.includes('divulgacao') || norm.includes('atividade-parlamentar')) return '#10B981'
    if (norm.includes('telefon')) return '#6B7280'
    if (norm.includes('taxi') || norm.includes('pedagio')) return '#6B7280'

    // Fallback determinístico por hash
    const hash = categoria.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
    return PALETA_CORES[Math.abs(hash) % PALETA_CORES.length]
  }

  const hexToRgba = (hex: string, alpha: number): string => {
    const clean = hex.replace('#', '')
    const bigint = parseInt(clean, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const norm = (s: string) => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim()
  const handleCategoryClick = (categoria: string) => {
    const current = selectedCategory
    const next = current && norm(current) === norm(categoria) ? undefined : categoria
    setSelectedCategory(next)
  }

  // Garantir que onCategoryClick exista no escopo e tenha fallback seguro
  const onCategoryClick = onCategoryClickProp ?? handleCategoryClick

  const maxValor = useMemo(() => {
    return data && data.length > 0 ? Math.max(...data.map(d => d.valor)) : 0
  }, [data])

  const defaultTitle = title || 'Distribuição de Gastos por Categoria'
  const defaultDescription = description || 'Análise detalhada dos fornecedores por categoria'

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center h-[300px]">
          <span className="animate-pulse">Carregando categorias...</span>
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={className}>
        <p className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
          Não há dados de categorias para o período selecionado.
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`} style={height ? { maxHeight: `${height}px` } : undefined}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{defaultTitle}</h3>
          <p className="text-sm text-muted-foreground">{defaultDescription}</p>
        </div>
        <div>
          <Button variant="outline" size="sm" onClick={() => setShowPie(!showPie)}>
            {showPie ? 'Ver barras' : 'Ver gráfico pizza'}
          </Button>
        </div>
      </div>

      {showPie ? (
        <div className="w-full h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data.map(d => ({ name: d.categoria, value: d.valor, color: d.cor || getCategoriaColor(d.categoria) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor || getCategoriaColor(entry.categoria)} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto pr-2 h-full">
          {(selectedCategory ? data.filter(d => norm(d.categoria) === norm(selectedCategory)) : data).map((item, index) => {
            const percent = maxValor > 0 ? Math.max((item.valor / maxValor) * 100, 3) : 0
            const handleClick = () => onCategoryClick(item.categoria)
            const cor = item.cor || getCategoriaColor(item.categoria)
            return (
              <div key={`${item.categoria}-${index}`} className="space-y-2">
                <div className="flex items-start justify-between text-sm gap-4 cursor-pointer" onClick={handleClick}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="font-medium leading-relaxed">{item.categoria}</span>
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-full"
                      style={{
                        backgroundColor: hexToRgba(cor, 0.15),
                        color: cor,
                        border: `1px solid ${hexToRgba(cor, 0.3)}`,
                      }}
                    >
                      {item.percentual}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold whitespace-nowrap">R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    {typeof item.count === 'number' && (
                      <div className="text-xs text-muted-foreground">{item.count} fornecedores</div>
                    )}
                  </div>
                </div>
                <div className="relative w-full bg-muted rounded-full h-5 ring-1 ring-border cursor-pointer" onClick={handleClick}>
                  <div className="absolute left-0 top-0 h-5 rounded-full"
                    style={{ width: `${percent}%`, backgroundColor: cor }}
                  />
                </div>
                {typeof item.count === 'number' && (
                  <div className="cursor-pointer hover:underline" onClick={handleClick}>
                    <span style={{ color: cor }}>→ Ver todos os {item.count} fornecedores desta categoria</span>
                  </div>
                )}
              </div>
            )
          })}
          {data.length > 7 && (
            <div className="text-center text-xs text-muted-foreground mt-4 pt-2 border-t">
              <span className="bg-gray-100 px-2 py-1 rounded">
                ↓ Role para ver todas as {data.length} categorias ↓
              </span>
            </div>
          )}
        </div>
      )}
      <RankingDeputadosCategoria selectedCategory={selectedCategory} max={10} />
    </div>
  )
}



