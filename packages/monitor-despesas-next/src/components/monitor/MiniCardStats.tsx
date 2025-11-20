'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrencyBRL, formatCompactCurrencyBRL } from '@/lib/formatters'
import type { ComponentType } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

type Trend = 'up' | 'down' | 'neutral'

type MiniCardItem = {
  title: string
  value: number | string
  variant?: 'full' | 'compact'
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo' | 'teal' | 'orange' | 'pink' | 'slate'
  icon?: ComponentType<{ className?: string }>
  delta?: { value?: number | string; trend?: Trend }
  formatType?: 'currencyCompactBRL' | 'currencyBRL' | 'number' | 'raw'
}

type MiniCardStatsProps = {
  items: MiniCardItem[]
  columns?: number
  className?: string
}

const colorGradients: Record<string, string> = {
  blue: 'from-blue-50 to-blue-100',
  green: 'from-green-50 to-green-100',
  purple: 'from-purple-50 to-purple-100',
  amber: 'from-amber-50 to-amber-100',
  red: 'from-red-50 to-red-100',
  indigo: 'from-indigo-50 to-indigo-100',
  teal: 'from-teal-50 to-teal-100',
  orange: 'from-orange-50 to-orange-100',
  pink: 'from-pink-50 to-pink-100',
  slate: 'from-slate-50 to-slate-100',
}

const colorText: Record<string, string> = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
  indigo: 'text-indigo-600',
  teal: 'text-teal-600',
  orange: 'text-orange-600',
  pink: 'text-pink-600',
  slate: 'text-slate-600',
}

function formatValue(value: number | string, formatType?: MiniCardItem['formatType']) {
  if (typeof value === 'string') return value
  if (formatType === 'currencyCompactBRL') return formatCompactCurrencyBRL(value)
  if (formatType === 'currencyBRL') return formatCurrencyBRL(value)
  if (formatType === 'number') return new Intl.NumberFormat('pt-BR').format(value)
  if (value >= 100000) return formatCompactCurrencyBRL(value)
  return new Intl.NumberFormat('pt-BR').format(value)
}

function gridClass(columns?: number) {
  const map: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
    5: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-6',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 2xl:grid-cols-6',
  }
  if (!columns) return map[4]
  const c = Math.max(2, Math.min(6, columns))
  return map[c]
}

export function MiniCardStats({ items, columns = 4, className }: MiniCardStatsProps) {
  const list = Array.isArray(items) ? items.slice(0, 15) : []
  const valid = list.length >= 2 ? list : list
  return (
    <div className={`grid ${gridClass(columns)} gap-4 ${className || ''}`}>
      {valid.map((item, idx) => {
        const variant = item.variant || 'full'
        const color = item.color || 'blue'
        const gradient = colorGradients[color] || colorGradients.blue
        const textColor = colorText[color] || colorText.blue
        const Icon = item.icon
        const value = formatValue(item.value, item.formatType)
        const deltaVal = item.delta?.value
        const trend = item.delta?.trend || 'neutral'
        const DeltaIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

        return (
          <Card key={`${item.title}-${idx}`} className={`overflow-hidden border border-gray-200 rounded-lg`}>
            <div className={`bg-gradient-to-r ${gradient} p-3`}></div>
            <CardContent className="p-4">
              {variant === 'full' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {Icon ? <Icon className={`h-5 w-5 ${textColor}`} /> : <div className={`h-5 w-5 ${textColor}`} />}
                    <span className="text-sm text-gray-600">{item.title}</span>
                  </div>
                  {DeltaIcon && deltaVal !== undefined ? (
                    <div className={`flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
                      <DeltaIcon className="h-4 w-4" />
                      <span className="text-xs">{typeof deltaVal === 'number' ? new Intl.NumberFormat('pt-BR').format(deltaVal) : String(deltaVal)}</span>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="text-sm text-gray-600">{item.title}</div>
              )}
              <div className="mt-2 text-2xl font-bold text-gray-900">{value}</div>
              {variant === 'full' ? null : <div className="mt-1 text-xs text-gray-500">{item.title}</div>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default MiniCardStats

