'use client'

import { formatCurrencyBRL } from '@/lib/formatters'
import type { DeputadoResumo } from '@a-republica/shared'

interface ComparisonTableProps {
  deputadosSelecionados: DeputadoResumo[]
}

export default function ComparisonTable({ deputadosSelecionados }: ComparisonTableProps) {
  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3">
            Métrica
          </th>
          {deputadosSelecionados.map((dep) => (
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
          {deputadosSelecionados.map((dep) => (
            <td key={dep.id} className="px-6 py-4 text-center">
              {dep.siglaPartido}-{dep.siglaUf}
            </td>
          ))}
        </tr>
        <tr className="bg-white border-b">
          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
            Gasto Total
          </th>
          {deputadosSelecionados.map((dep) => (
            <td key={dep.id} className="px-6 py-4 text-center font-bold text-lg">
              {formatCurrencyBRL(dep.totalDespesas)}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}



