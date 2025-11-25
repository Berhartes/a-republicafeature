'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'

interface PartiesComparisonProps {
    data: Array<{
        partido: string
        totalDeputados: number
        totalGasto: number
        totalTransacoes: number
        mediaGastoPorDeputado: number
        mediaTransacaoPorDeputado: number
    }>
}

export default function PartiesComparison({ data }: PartiesComparisonProps) {
    if (!data || data.length === 0) return null

    // Ordenar por total gasto
    const sortedData = [...data].sort((a, b) => b.totalGasto - a.totalGasto)

    return (
        <div className="space-y-6">
            {/* Gráfico de Barras - Total por Partido */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Comparação de Partidos
                    </CardTitle>
                    <CardDescription>Total de gastos por partido</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="partido"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickFormatter={(value) => `R$ ${(value / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrencyBRL(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="totalGasto" fill="#EF4444" radius={[8, 8, 0, 0]} name="Total Gasto" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Gráfico de Média por Deputado */}
            <Card>
                <CardHeader>
                    <CardTitle>Média de Gastos por Deputado</CardTitle>
                    <CardDescription>Comparação da média de gastos por deputado em cada partido</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={sortedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="partido"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    formatter={(value: number) => formatCurrencyBRL(value)}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="mediaGastoPorDeputado" fill="#F59E0B" radius={[8, 8, 0, 0]} name="Média por Deputado" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
                <CardHeader>
                    <CardTitle>Detalhamento por Partido</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left">Partido</th>
                                    <th className="px-4 py-3 text-right">Deputados</th>
                                    <th className="px-4 py-3 text-right">Total Gasto</th>
                                    <th className="px-4 py-3 text-right">Transações</th>
                                    <th className="px-4 py-3 text-right">Média/Deputado</th>
                                    <th className="px-4 py-3 text-right">Média/Transação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {sortedData.map((partido) => (
                                    <tr key={partido.partido} className="hover:bg-accent/5">
                                        <td className="px-4 py-3 font-medium">
                                            <Badge variant="outline">{partido.partido}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">{formatNumberBR(partido.totalDeputados)}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrencyBRL(partido.totalGasto)}</td>
                                        <td className="px-4 py-3 text-right">{formatNumberBR(partido.totalTransacoes)}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrencyBRL(partido.mediaGastoPorDeputado)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {formatCurrencyBRL(partido.totalTransacoes > 0 ? partido.totalGasto / partido.totalTransacoes : 0)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
