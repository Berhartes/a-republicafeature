'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { DollarSign, FileText, TrendingUp, AlertTriangle } from 'lucide-react'

interface ComparisonSummaryProps {
    deputados: any[]
}

export default function ComparisonSummary({ deputados }: ComparisonSummaryProps) {
    if (!deputados.length) return null

    const metrics = [
        {
            label: 'Gasto Total',
            icon: DollarSign,
            getValue: (d: any) => formatCurrencyBRL(d.totalGasto || 0),
            getRawValue: (d: any) => d.totalGasto || 0,
            highlightMax: true
        },
        {
            label: 'Transações',
            icon: FileText,
            getValue: (d: any) => formatNumberBR(d.totalTransacoes || 0),
            getRawValue: (d: any) => d.totalTransacoes || 0,
            highlightMax: true
        },
        {
            label: 'Média por Transação',
            icon: TrendingUp,
            getValue: (d: any) => {
                const total = d.totalGasto || 0
                const transacoes = d.totalTransacoes || 0
                return formatCurrencyBRL(transacoes > 0 ? total / transacoes : 0)
            },
            getRawValue: (d: any) => {
                const total = d.totalGasto || 0
                const transacoes = d.totalTransacoes || 0
                return transacoes > 0 ? total / transacoes : 0
            },
            highlightMax: false
        },
        {
            label: 'Alertas/Suspeitas',
            icon: AlertTriangle,
            getValue: (d: any) => {
                const score = d.scoreSuspeicao || 0
                return score > 0 ? score.toFixed(0) : '0'
            },
            getRawValue: (d: any) => d.scoreSuspeicao || 0,
            highlightMax: false,
            isWarning: true
        }
    ]

    // Find max values for highlighting
    const maxValues: Record<string, number> = {}
    metrics.forEach(metric => {
        if (metric.highlightMax) {
            const values = deputados.map(d => metric.getRawValue(d))
            maxValues[metric.label] = Math.max(...values)
        }
    })

    return (
        <Card>
            <CardHeader>
                <CardTitle>Resumo Comparativo</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                                <th className="px-6 py-4 rounded-tl-lg">Métrica</th>
                                {deputados.map(dep => (
                                    <th key={dep.id} className="px-6 py-4 text-center min-w-[150px]">
                                        <div className="flex flex-col items-center gap-2">
                                            {dep.urlFoto && (
                                                <img
                                                    src={dep.urlFoto}
                                                    alt={dep.nome}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-sm"
                                                />
                                            )}
                                            <span className="font-bold text-foreground">{dep.nome}</span>
                                            <Badge variant="outline" className="text-[10px]">
                                                {dep.partido}-{dep.uf}
                                            </Badge>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {metrics.map((metric, idx) => (
                                <tr key={idx} className="bg-card hover:bg-accent/5 transition-colors">
                                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                                        <metric.icon className="w-4 h-4 text-muted-foreground" />
                                        {metric.label}
                                    </td>
                                    {deputados.map(dep => {
                                        const value = metric.getValue(dep)
                                        const rawValue = metric.getRawValue(dep)
                                        const isMax = metric.highlightMax && rawValue === maxValues[metric.label] && rawValue > 0
                                        const isWarning = metric.isWarning && rawValue > 50

                                        return (
                                            <td
                                                key={dep.id}
                                                className={`px-6 py-4 text-center font-medium ${isMax ? 'text-primary font-bold' : ''
                                                    } ${isWarning ? 'text-destructive' : ''}`}
                                            >
                                                {value}
                                            </td>
                                        )
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
