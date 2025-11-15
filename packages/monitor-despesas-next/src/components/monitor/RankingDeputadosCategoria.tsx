'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useFilter } from '@/contexts/FilterContext'
import { Loader2, User } from 'lucide-react'

type Item = {
  deputadoId: string
  nomeEleitoral: string
  foto?: string
  numeroTransacoes: number
  totalGasto: number
  fornecedorTopNome?: string
}

export default function RankingDeputadosCategoria({ max = 10 }: { max?: number }) {
  const { selectedCategory } = useFilter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setItems([])
    setError(null)
    setOpen(false)
  }, [selectedCategory])

  useEffect(() => {
    let ignore = false
    async function fetchData() {
      if (!open || !selectedCategory) return
      setLoading(true)
      setError(null)
      try {
        const qs = new URLSearchParams({ categoria: selectedCategory, limit: String(max) }).toString()
        const res = await fetch(`/api/monitor/top-deputados-categoria?${qs}`)
        const json = await res.json()
        if (!ignore) setItems(Array.isArray(json?.ranking) ? json.ranking : [])
      } catch (err) {
        if (!ignore) setError('Falha ao carregar ranking')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    fetchData()
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