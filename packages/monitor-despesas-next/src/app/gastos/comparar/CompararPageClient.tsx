'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, X } from 'lucide-react'
import { formatCurrencyBRL } from '@/lib/formatters'
import type { DeputadoResumo } from '@a-republica/shared'

interface CompararPageClientProps {
  todosDeputados: DeputadoResumo[]
  deputadosSelecionados: DeputadoResumo[]
  deputadoIds: string[]
}

export function CompararPageClient({ 
  todosDeputados, 
  deputadosSelecionados, 
  deputadoIds 
}: CompararPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const handleSelectChange = (index: number, deputadoId: string) => {
    const newIds = [...deputadoIds]
    newIds[index] = deputadoId
    const filteredIds = newIds.filter(id => id && id !== 'remover')

    const params = new URLSearchParams()
    if (filteredIds.length > 0) {
      params.set('deputados', filteredIds.join(','))
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const addComparator = () => {
    if (deputadoIds.length >= 4) return // Limite de 4 comparações
    const newIds = [...deputadoIds, ''] // Adiciona um slot vazio
    const params = new URLSearchParams()
    params.set('deputados', newIds.join(','))
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <div className="space-y-6">
      {/* Seletores de Deputados */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione os Deputados para Comparar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].slice(0, Math.max(2, deputadoIds.length)).map((index) => (
            <Select
              key={index}
              value={deputadoIds[index] || ''}
              onValueChange={(id) => handleSelectChange(index, id)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={`Selecionar Deputado ${index + 1}...`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remover">Remover Comparação</SelectItem>
                {todosDeputados.map(dep => (
                  <SelectItem key={dep.id} value={dep.id.toString()}>
                    {dep.nomeEleitoral} ({dep.siglaPartido}-{dep.siglaUf})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </CardContent>
      </Card>

      {/* Resultados da Comparação */}
      {deputadosSelecionados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados da Comparação</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Métrica</th>
                  {deputadosSelecionados.map(dep => (
                    <th key={dep.id} scope="col" className="px-6 py-3 text-center">
                      {dep.nomeEleitoral}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    Partido
                  </th>
                  {deputadosSelecionados.map(dep => (
                    <td key={dep.id} className="px-6 py-4 text-center">{dep.siglaPartido}-{dep.siglaUf}</td>
                  ))}
                </tr>
                <tr className="bg-white border-b">
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                    Gasto Total
                  </th>
                  {deputadosSelecionados.map(dep => (
                    <td key={dep.id} className="px-6 py-4 text-center font-bold text-lg">
                      {formatCurrencyBRL(dep.totalDespesas)}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
