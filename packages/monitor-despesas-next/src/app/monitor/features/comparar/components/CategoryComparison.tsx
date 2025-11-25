'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts'
import { formatCurrencyBRL } from '@/lib/formatters'

interface CategoryComparisonProps {
    deputados: any[]
}

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899']

export default function CategoryComparison({ deputados }: CategoryComparisonProps) {
    if (!deputados.length) return null

    // Agregar categorias de todos os deputados
    const categoriasMap = new Map<string, { total: number; deputados: Map<string, number> }>()

    deputados.forEach(dep => {
        if (dep.gastosPorCategoria && Array.isArray(dep.gastosPorCategoria)) {
            dep.gastosPorCategoria.forEach((cat: any) => {
                if (!categoriasMap.has(cat.categoria)) {
                    categoriasMap.set(cat.categoria, { total: 0, deputados: new Map() })
                }
                const catData = categoriasMap.get(cat.categoria)!
                catData.total += cat.total
                catData.deputados.set(dep.nome, cat.total)
            })
        }
    })

    // Pegar top 8 categorias
    const topCategorias = Array.from(categoriasMap.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 8)

    // Dados para gráfico de barras agrupadas
    const barChartData = topCategorias.map(([categoria, data]) => {
        const entry: any = { categoria: categoria.substring(0, 20) }
        deputados.forEach(dep => {
            entry[dep.nome] = data.deputados.get(dep.nome) || 0
        })
        return entry
    })

    // Dados para gráficos de pizza individuais
    const pieChartsData = deputados.map(dep => {
        const categorias = dep.gastosPorCategoria || []
        const topCats = categorias
            .sort((a: any, b: any) => b.total - a.total)
            .slice(0, 5)

        return {
            deputado: dep.nome,
            categorias: topCats.map((cat: any) => ({
                name: cat.categoria.substring(0, 15),
                value: cat.total
            }))
        }
    })

    return (
        <div className="space-y-6">
            {/* Comparação por Categoria */}
            <Card>
                <CardHeader>
                    <CardTitle>Gastos por Categoria</CardTitle>
                    <CardDescription>Comparação das principais categorias de despesas</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="categoria"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={120}
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
                                    <Bar
                                        key={dep.id}
                                        dataKey={dep.nome}
                                        fill={COLORS[index % COLORS.length]}
                                        radius={[4, 4, 0, 0]}
                                    />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Distribuição Individual por Categoria */}
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição de Gastos por Deputado</CardTitle>
                    <CardDescription>Top 5 categorias de cada deputado</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {pieChartsData.map((data, index) => (
                            <div key={data.deputado} className="space-y-2">
                                <h4 className="text-sm font-semibold text-center">{data.deputado}</h4>
                                <div className="h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={data.categorias}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {data.categorias.map((entry, idx) => (
                                                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value: number) => formatCurrencyBRL(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
