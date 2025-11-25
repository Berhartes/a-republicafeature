'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import { Building2 } from 'lucide-react'

interface SuppliersComparisonProps {
    deputados: any[]
}

export default function SuppliersComparison({ deputados }: SuppliersComparisonProps) {
    if (!deputados.length) return null

    return (
        <div className="space-y-6">
            {deputados.map(dep => {
                const topFornecedores = dep.topFornecedores || []

                if (topFornecedores.length === 0) return null

                return (
                    <Card key={dep.id}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Building2 className="h-5 w-5 text-primary" />
                                        Top Fornecedores - {dep.nome}
                                    </CardTitle>
                                    <CardDescription>
                                        {dep.partido}-{dep.uf}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline">
                                    {topFornecedores.length} fornecedores
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topFornecedores.map((forn: any, index: number) => {
                                    const percentual = dep.totalGasto > 0
                                        ? ((forn.total / dep.totalGasto) * 100).toFixed(1)
                                        : '0.0'

                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 flex-1">
                                                <span className="text-sm font-mono text-muted-foreground w-8">
                                                    #{(index + 1).toString().padStart(2, '0')}
                                                </span>
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-sm">{forn.nome}</h4>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatNumberBR(forn.transacoes)} transações
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm">{formatCurrencyBRL(forn.total)}</p>
                                                <p className="text-xs text-muted-foreground">{percentual}% do total</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            {/* Comparação Cruzada de Fornecedores */}
            <Card>
                <CardHeader>
                    <CardTitle>Fornecedores em Comum</CardTitle>
                    <CardDescription>Fornecedores que aparecem em mais de um deputado</CardDescription>
                </CardHeader>
                <CardContent>
                    {(() => {
                        // Mapear fornecedores por nome
                        const fornecedoresMap = new Map<string, { deputados: string[]; total: number }>()

                        deputados.forEach(dep => {
                            const topFornecedores = dep.topFornecedores || []
                            topFornecedores.forEach((forn: any) => {
                                if (!fornecedoresMap.has(forn.nome)) {
                                    fornecedoresMap.set(forn.nome, { deputados: [], total: 0 })
                                }
                                const data = fornecedoresMap.get(forn.nome)!
                                data.deputados.push(dep.nome)
                                data.total += forn.total
                            })
                        })

                        // Filtrar apenas fornecedores em comum
                        const fornecedoresComuns = Array.from(fornecedoresMap.entries())
                            .filter(([_, data]) => data.deputados.length > 1)
                            .sort((a, b) => b[1].total - a[1].total)

                        if (fornecedoresComuns.length === 0) {
                            return (
                                <p className="text-sm text-muted-foreground text-center py-8">
                                    Não há fornecedores em comum entre os deputados selecionados
                                </p>
                            )
                        }

                        return (
                            <div className="space-y-3">
                                {fornecedoresComuns.map(([nome, data]) => (
                                    <div
                                        key={nome}
                                        className="flex items-center justify-between p-4 border rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium text-sm">{nome}</h4>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {data.deputados.map(dep => (
                                                    <Badge key={dep} variant="secondary" className="text-xs">
                                                        {dep}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="font-bold text-sm">{formatCurrencyBRL(data.total)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {data.deputados.length} deputados
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    })()}
                </CardContent>
            </Card>
        </div>
    )
}
