'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { formatCurrencyBRL } from '@/lib/formatters'

interface MonthlyComparisonProps {
    deputados: any[]
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function MonthlyComparison({ deputados }: MonthlyComparisonProps) {
    if (!deputados.length) return null

    // Dados para evolução mensal (linha)
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

    const monthlyLineData = mesesNomes.map((mes, index) => {
        const entry: any = { mes }
        deputados.forEach(dep => {
            const mesNum = index + 1
            entry[dep.nome] = dep.gastosPorMes?.[mesNum] || 0
        })
        return entry
    })

    // Dados para média mensal (barras)
    const monthlyBarData = deputados.map(dep => {
        const gastosPorMes = dep.gastosPorMes || {}
        const valores = Object.values(gastosPorMes) as number[]
        const total = valores.reduce((sum, val) => sum + val, 0)
        const media = valores.length > 0 ? total / valores.length : 0

        return {
            nome: dep.nome,
            mediaMensal: media,
            maiorMes: Math.max(...valores, 0),
            menorMes: Math.min(...valores.filter(v => v > 0), 0) || 0
        }
    })

    return (
        <div className="space-y-6">
            {/* Evolução Mensal */}
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Mensal de Gastos</CardTitle>
                    <CardDescription>Comparação dos gastos mês a mês (agregado de todos os anos)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyLineData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="mes"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 12 }}
                                    dy={10}
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
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                {deputados.map((dep, index) => (
                                    <Line
                                        key={dep.id}
                                        type="monotone"
                                        dataKey={dep.nome}
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Estatísticas Mensais */}
            <Card>
                <CardHeader>
                    <CardTitle>Estatísticas Mensais</CardTitle>
                    <CardDescription>Média, maior e menor gasto mensal por deputado</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyBarData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="nome"
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
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="mediaMensal" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Média Mensal" />
                                <Bar dataKey="maiorMes" fill="#10B981" radius={[4, 4, 0, 0]} name="Maior Mês" />
                                <Bar dataKey="menorMes" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Menor Mês" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Tabela de Resumo Mensal */}
            <Card>
                <CardHeader>
                    <CardTitle>Resumo Mensal Detalhado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                <tr>
                                    <th className="px-4 py-3 text-left">Mês</th>
                                    {deputados.map(dep => (
                                        <th key={dep.id} className="px-4 py-3 text-right">{dep.nome}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {mesesNomes.map((mes, index) => {
                                    const mesNum = index + 1
                                    return (
                                        <tr key={mes} className="hover:bg-accent/5">
                                            <td className="px-4 py-3 font-medium">{mes}</td>
                                            {deputados.map(dep => (
                                                <td key={dep.id} className="px-4 py-3 text-right">
                                                    {formatCurrencyBRL(dep.gastosPorMes?.[mesNum] || 0)}
                                                </td>
                                            ))}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
