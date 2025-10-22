
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Award, AlertTriangle, Target } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.js';
import type { DeputadoData } from '../types.js';

interface ComparativoTabProps {
  deputadoData: DeputadoData | null;
  totalGasto: number;
  numeroTransacoes: number;
  categorias: string[];
  despesasDetalhadas: any[];
  mediaDeputados: Record<string, number>;
  maxDeputados: Record<string, number>;
  recordistasDeputados: Record<string, { nome: string; valor: number; partido?: string; uf?: string }>;
}

export function ComparativoTab({
  deputadoData,
  totalGasto,
  numeroTransacoes,
  categorias,
  despesasDetalhadas,
  mediaDeputados,
  maxDeputados,
  recordistasDeputados
}: ComparativoTabProps) {
  if (!deputadoData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Dados do deputado não disponíveis para comparação
          </div>
        </CardContent>
      </Card>
    );
  }

  const mediaTotal = mediaDeputados.total || 0;
  const maxTotal = maxDeputados.total || 0;
  const percentualVsMedia = mediaTotal > 0 ? ((totalGasto - mediaTotal) / mediaTotal) * 100 : 0;
  const percentualVsMax = maxTotal > 0 ? (totalGasto / maxTotal) * 100 : 0;

  const dadosCategorias = categorias.map(categoria => {
    const gastosCategoria = despesasDetalhadas
      .filter(d => d.tipoDespesa === categoria)
      .reduce((sum, d) => sum + parseFloat(d.valorLiquido || 0), 0);
    
    const mediaCategoria = mediaDeputados[categoria] || 0;
    const maxCategoria = maxDeputados[categoria] || 0;
    const recordista = recordistasDeputados[categoria];

    return {
      categoria: categoria.length > 20 ? categoria.substring(0, 20) + '...' : categoria,
      categoriaCompleta: categoria,
      valor: gastosCategoria,
      media: mediaCategoria,
      maximo: maxCategoria,
      percentualVsMedia: mediaCategoria > 0 ? ((gastosCategoria - mediaCategoria) / mediaCategoria) * 100 : 0,
      recordista: recordista?.nomeEleitoral || 'N/A'
    };
  }).sort((a, b) => b.valor - a.valor);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  const pieData = dadosCategorias.slice(0, 6).map(item => ({
    name: item.categoria,
    value: item.valor,
    percentage: totalGasto > 0 ? (item.valor / totalGasto) * 100 : 0
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{data.categoriaCompleta || label}</p>
          <p style={{ color: payload[0].color }}>
            Deputado: {formatCurrency(data.valor)}
          </p>
          {data.media !== undefined && (
            <p className="text-gray-600">
              Média: {formatCurrency(data.media)}
            </p>
          )}
          {data.percentualVsMedia !== undefined && (
            <p className={data.percentualVsMedia > 0 ? 'text-red-600' : 'text-green-600'}>
              {data.percentualVsMedia > 0 ? '+' : ''}{data.percentualVsMedia.toFixed(1)}% vs média
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overall Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Comparativo com o Partido {deputadoData.siglaPartido}
          </CardTitle>
          <CardDescription>
            Compare os gastos por categoria com a média dos deputados do partido
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalGasto)}
                  </div>
                  <p className="text-sm text-gray-600">Gasto Total</p>
                  <Badge variant={percentualVsMedia > 10 ? 'destructive' : percentualVsMedia < -10 ? 'default' : 'secondary'} className="mt-2">
                    {percentualVsMedia > 0 ? '+' : ''}{percentualVsMedia.toFixed(1)}% vs média
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(mediaTotal)}
                  </div>
                  <p className="text-sm text-gray-600">Média do Partido</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Base: {deputadoData.siglaPartido}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {formatNumber(numeroTransacoes)}
                  </div>
                  <p className="text-sm text-gray-600">Transações</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Volume total usado no período selecionado
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {percentualVsMax.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">vs Maior Gasto</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Máximo: {formatCurrency(maxTotal)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ranking Position */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Posição no Ranking</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span>Menor Gasto</span>
                  <span>Maior Gasto</span>
                </div>
                <Progress 
                  value={percentualVsMax} 
                  className="h-3"
                />
              </div>
              <div className="text-right">
                <Badge variant={percentualVsMax > 75 ? 'destructive' : percentualVsMax > 50 ? 'default' : 'secondary'}>
                  {percentualVsMax > 75 ? 'Alto' : percentualVsMax > 50 ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Comparação por Categoria
          </CardTitle>
          <CardDescription>
            Gastos por categoria vs média dos deputados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosCategorias} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="categoria" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="valor" fill="#2563eb" name="Deputado" />
                <Bar dataKey="media" fill="#64748b" name="Média do Partido" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Distribuição dos Gastos
          </CardTitle>
          <CardDescription>
            Proporção de gastos por categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {dadosCategorias.slice(0, 6).map((categoria, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <span className="text-sm font-medium">{categoria.categoria}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{formatCurrency(categoria.valor)}</div>
                    <div className={`text-xs ${categoria.percentualVsMedia > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {categoria.percentualVsMedia > 0 ? '+' : ''}{categoria.percentualVsMedia.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Holders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Recordistas por Categoria
          </CardTitle>
          <CardDescription>
            Deputados com maiores gastos em cada categoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dadosCategorias.slice(0, 8).map((categoria, index) => {
              const recordista = recordistasDeputados[categoria.categoriaCompleta];
              const isRecord = recordista && deputadoData.nomeEleitoral === recordista.nomeEleitoral;
              
              return (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  isRecord ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{categoria.categoriaCompleta}</h4>
                    {isRecord && <Award className="h-4 w-4 text-yellow-600" />}
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p><strong>Recordista:</strong> {recordista?.nomeEleitoral || 'N/A'}</p>
                    {recordista && (
                      <>
                        <p><strong>Valor:</strong> {formatCurrency(recordista.valor)}</p>
                        <p><strong>Partido:</strong> {recordista.siglaPartido} • <strong>UF:</strong> {recordista.siglaUf}</p>
                      </>
                    )}
                    <div className="pt-2 border-t">
                      <p><strong>Seu gasto:</strong> {formatCurrency(categoria.valor)}</p>
                      <p className={categoria.percentualVsMedia > 0 ? 'text-red-600' : 'text-green-600'}>
                        {categoria.percentualVsMedia > 0 ? '+' : ''}{categoria.percentualVsMedia.toFixed(1)}% vs média
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Insights Comparativos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* High spending categories */}
          {dadosCategorias.filter(c => c.percentualVsMedia > 50).length > 0 && (
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Categorias com Gastos Elevados</h4>
              <p className="text-sm text-red-800 mb-2">
                As seguintes categorias apresentam gastos significativamente acima da média do partido:
              </p>
              <div className="space-y-1">
                {dadosCategorias
                  .filter(c => c.percentualVsMedia > 50)
                  .map((categoria, index) => (
                    <div key={index} className="text-sm text-red-700">
                      • <strong>{categoria.categoriaCompleta}:</strong> {categoria.percentualVsMedia.toFixed(1)}% acima da média
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Efficiency indicators */}
          {dadosCategorias.filter(c => c.percentualVsMedia < -20).length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Eficiência de Gastos</h4>
              <p className="text-sm text-green-800 mb-2">
                Categorias com gastos abaixo da média demonstram eficiência:
              </p>
              <div className="space-y-1">
                {dadosCategorias
                  .filter(c => c.percentualVsMedia < -20)
                  .slice(0, 3)
                  .map((categoria, index) => (
                    <div key={index} className="text-sm text-green-700">
                      • <strong>{categoria.categoriaCompleta}:</strong> {Math.abs(categoria.percentualVsMedia).toFixed(1)}% abaixo da média
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Overall assessment */}
          <div className={`p-4 rounded-lg ${
            percentualVsMedia > 25 ? 'bg-red-50' : 
            percentualVsMedia < -15 ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              percentualVsMedia > 25 ? 'text-red-900' : 
              percentualVsMedia < -15 ? 'text-green-900' : 'text-blue-900'
            }`}>
              Avaliação Geral
            </h4>
            <p className={`text-sm ${
              percentualVsMedia > 25 ? 'text-red-800' : 
              percentualVsMedia < -15 ? 'text-green-800' : 'text-blue-800'
            }`}>
              {percentualVsMedia > 25 ? 
                `O deputado apresenta gastos ${percentualVsMedia.toFixed(1)}% acima da média do partido, indicando possível necessidade de revisão dos gastos.` :
                percentualVsMedia < -15 ?
                `O deputado mantém gastos ${Math.abs(percentualVsMedia).toFixed(1)}% abaixo da média do partido, demonstrando eficiência no uso dos recursos públicos.` :
                `O deputado mantém gastos próximos à média do partido (${percentualVsMedia.toFixed(1)}%), indicando padrão regular de despesas.`
              }
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
