'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts'
import { formatCurrencyBRL } from '@/lib/formatters'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Info } from 'lucide-react'

interface ComparisonChartProps {
    deputados: any[]
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function ComparisonChart({ deputados }: ComparisonChartProps) {
    if (!deputados.length) return null

    // Process data to merge all years
    const allYears = new Set<number>()
    deputados.forEach(dep => {
        if (dep.anos && Array.isArray(dep.anos)) {
            dep.anos.forEach((a: any) => {
                if (a && typeof a.ano === 'number') {
                    allYears.add(a.ano)
                }
            })
        }
    })

    const years = Array.from(allYears).sort((a, b) => a - b)

    if (years.length === 0) {
        return (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                    Não há dados de evolução disponíveis para os deputados selecionados.
                </AlertDescription>
            </Alert>
        )
    }

    // Line chart data (evolution over years)
    const lineChartData = years.map(year => {
        const entry: any = { name: year.toString() }
        deputados.forEach(dep => {
            const yearData = dep.anos?.find((a: any) => a.ano === year)
            entry[dep.nome] = yearData ? yearData.total : 0
        })
        return entry
    })

    // Bar chart data (total comparison)
    const barChartData = deputados.map(dep => ({
        nome: dep.nome,
        total: dep.totalGasto || 0,
        transacoes: dep.totalTransacoes || 0
    }))

    return (
        <div className="space-y-6">
            <Tabs defaultValue="evolucao" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="evolucao">Evolução Anual</TabsTrigger>
                    <TabsTrigger value="comparacao">Comparação Total</TabsTrigger>
                </TabsList>

                <TabsContent value="evolucao" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Evolução Anual de Gastos</CardTitle>
                            <CardDescription>Comparativo do total gasto por ano</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={lineChartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
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
                </TabsContent>

                <TabsContent value="comparacao" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparação de Gastos Totais</CardTitle>
                            <CardDescription>Total gasto por cada deputado</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
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
                                        <Bar
                                            dataKey="total"
                                            fill="#3B82F6"
                                            radius={[8, 8, 0, 0]}
                                            name="Gasto Total"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
