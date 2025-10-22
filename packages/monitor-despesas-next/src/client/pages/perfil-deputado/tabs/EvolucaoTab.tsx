
import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Calendar, Target } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters.js';

interface EvolucaoTabProps {
  despesasDetalhadas: any[];
  anoSelecionado: number | 'todos';
  loading: boolean;
}

export function EvolucaoTab({
  despesasDetalhadas,
  anoSelecionado,
  loading
}: EvolucaoTabProps) {
  const dadosMensais = useMemo(() => {
    if (despesasDetalhadas.length === 0) return [];

    const mesesMap: Record<string, { valor: number; transacoes: number; categorias: Set<string> }> = {};

    despesasDetalhadas.forEach(despesa => {
      const data = despesa.dataDocumento || despesa.data;
      if (!data || !data.seconds) return;

      const dataObj = new Date(data.seconds * 1000);
      const mesAno = `${dataObj.getMonth() + 1}/${dataObj.getFullYear()}`;
      const valor = parseFloat(despesa.valorLiquido || 0);

      if (!mesesMap[mesAno]) {
        mesesMap[mesAno] = {
          valor: 0,
          transacoes: 0,
          categorias: new Set()
        };
      }

      mesesMap[mesAno].valor += valor;
      mesesMap[mesAno].transacoes += 1;
      
      if (despesa.tipoDespesa) {
        mesesMap[mesAno].categorias.add(despesa.tipoDespesa);
      }
    });

    return Object.entries(mesesMap)
      .map(([mesAno, dados]) => ({
        mes: mesAno.split('/')[0],
        ano: mesAno.split('/')[1],
        mesAno,
        mesNome: new Date(parseInt(mesAno.split('/')[1]), parseInt(mesAno.split('/')[0]) - 1, 1)
          .toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        valor: dados.valor,
        transacoes: dados.transacoes,
        valorMedio: dados.transacoes > 0 ? dados.valor / dados.transacoes : 0,
        categorias: dados.categorias.size
      }))
      .sort((a, b) => {
        const dataA = new Date(parseInt(a.ano), parseInt(a.mes) - 1);
        const dataB = new Date(parseInt(b.ano), parseInt(b.mes) - 1);
        return dataA.getTime() - dataB.getTime();
      });
  }, [despesasDetalhadas]);

  const estatisticas = useMemo(() => {
    if (dadosMensais.length === 0) {
      return {
        tendencia: 'estavel',
        crescimentoMedio: 0,
        maiorGasto: 0,
        menorGasto: 0,
        mediaMensal: 0,
        variabilidade: 0
      };
    }

    const valores = dadosMensais.map(d => d.valor);
    const maiorGasto = Math.max(...valores);
    const menorGasto = Math.min(...valores);
    const mediaMensal = valores.reduce((sum, v) => sum + v, 0) / valores.length;

    let tendencia = 'estavel';
    let crescimentoMedio = 0;

    if (dadosMensais.length >= 2) {
      const primeiro = dadosMensais[0].valor;
      const ultimo = dadosMensais[dadosMensais.length - 1].valor;
      crescimentoMedio = ((ultimo - primeiro) / primeiro) * 100;

      if (crescimentoMedio > 10) tendencia = 'crescente';
      else if (crescimentoMedio < -10) tendencia = 'decrescente';
    }

    const desvio = Math.sqrt(
      valores.reduce((sum, v) => sum + Math.pow(v - mediaMensal, 2), 0) / valores.length
    );
    const variabilidade = mediaMensal > 0 ? (desvio / mediaMensal) * 100 : 0;

    return {
      tendencia,
      crescimentoMedio,
      maiorGasto,
      menorGasto,
      mediaMensal,
      variabilidade
    };
  }, [dadosMensais]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Carregando evolução temporal...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dadosMensais.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum dado disponível para análise temporal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium">{`${label}`}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey === 'valor' && `Valor: ${formatCurrency(entry.value)}`}
              {entry.dataKey === 'transacoes' && `Transações: ${entry.value}`}
              {entry.dataKey === 'valorMedio' && `Valor médio: ${formatCurrency(entry.value)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {estatisticas.tendencia === 'crescente' ? (
                <TrendingUp className="h-5 w-5 text-red-600" />
              ) : estatisticas.tendencia === 'decrescente' ? (
                <TrendingDown className="h-5 w-5 text-green-600" />
              ) : (
                <Activity className="h-5 w-5 text-blue-600" />
              )}
              <div>
                <p className="text-sm text-gray-600">Tendência</p>
                <Badge variant={
                  estatisticas.tendencia === 'crescente' ? 'destructive' :
                  estatisticas.tendencia === 'decrescente' ? 'default' : 'secondary'
                }>
                  {estatisticas.tendencia}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Média Mensal</p>
                <p className="text-lg font-bold">{formatCurrency(estatisticas.mediaMensal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Maior/Menor</p>
              <div className="space-y-1">
                <p className="text-sm font-bold text-red-600">
                  Max: {formatCurrency(estatisticas.maiorGasto)}
                </p>
                <p className="text-sm font-bold text-green-600">
                  Min: {formatCurrency(estatisticas.menorGasto)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-gray-600">Variabilidade</p>
              <p className="text-lg font-bold">
                {estatisticas.variabilidade.toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500">
                {estatisticas.variabilidade > 50 ? 'Alta' : 
                 estatisticas.variabilidade > 25 ? 'Média' : 'Baixa'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spending Evolution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução Mensal de Gastos
                {anoSelecionado !== 'todos' && (
                  <Badge variant="outline">{anoSelecionado}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Análise temporal dos gastos mensais
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mesNome" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="#2563eb" 
                  strokeWidth={3}
                  name="Valor Mensal"
                  dot={{ fill: '#2563eb', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Volume Evolution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Volume de Transações
          </CardTitle>
          <CardDescription>
            Número de transações por mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mesNome"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="transacoes" 
                  fill="#10b981"
                  name="Nº Transações"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Average Transaction Value */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Valor Médio por Transação
          </CardTitle>
          <CardDescription>
            Evolução do ticket médio das despesas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosMensais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="mesNome"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="valorMedio" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Valor Médio"
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Insights Temporais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trend Analysis */}
          <div className={`p-4 rounded-lg ${
            estatisticas.tendencia === 'crescente' ? 'bg-red-50' :
            estatisticas.tendencia === 'decrescente' ? 'bg-green-50' : 'bg-blue-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              estatisticas.tendencia === 'crescente' ? 'text-red-900' :
              estatisticas.tendencia === 'decrescente' ? 'text-green-900' : 'text-blue-900'
            }`}>
              Análise de Tendência
            </h4>
            <p className={`text-sm ${
              estatisticas.tendencia === 'crescente' ? 'text-red-800' :
              estatisticas.tendencia === 'decrescente' ? 'text-green-800' : 'text-blue-800'
            }`}>
              {estatisticas.tendencia === 'crescente' && 
                `Os gastos apresentam tendência de crescimento de ${estatisticas.crescimentoMedio.toFixed(1)}% no período analisado.`
              }
              {estatisticas.tendencia === 'decrescente' && 
                `Os gastos apresentam tendência de redução de ${Math.abs(estatisticas.crescimentoMedio).toFixed(1)}% no período analisado.`
              }
              {estatisticas.tendencia === 'estavel' && 
                `Os gastos mantêm um padrão relativamente estável, com variação de ${Math.abs(estatisticas.crescimentoMedio).toFixed(1)}% no período.`
              }
            </p>
          </div>

          {/* Variability Analysis */}
          <div className={`p-4 rounded-lg ${
            estatisticas.variabilidade > 50 ? 'bg-yellow-50' : 'bg-gray-50'
          }`}>
            <h4 className={`font-semibold mb-2 ${
              estatisticas.variabilidade > 50 ? 'text-yellow-900' : 'text-gray-900'
            }`}>
              Padrão de Gastos
            </h4>
            <p className={`text-sm ${
              estatisticas.variabilidade > 50 ? 'text-yellow-800' : 'text-gray-800'
            }`}>
              {estatisticas.variabilidade > 50 ? 
                'Os gastos apresentam alta variabilidade entre os meses, indicando padrões irregulares de despesas.' :
                estatisticas.variabilidade > 25 ?
                'Os gastos apresentam variabilidade moderada, com alguns meses com gastos mais elevados.' :
                'Os gastos apresentam padrão consistente, com baixa variabilidade entre os meses.'
              }
            </p>
          </div>

          {/* Period Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Resumo do Período</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <p><strong>Período analisado:</strong> {dadosMensais.length} meses</p>
                <p><strong>Total de transações:</strong> {formatNumber(dadosMensais.reduce((sum, d) => sum + d.transacoes, 0))}</p>
              </div>
              <div>
                <p><strong>Valor total:</strong> {formatCurrency(dadosMensais.reduce((sum, d) => sum + d.valor, 0))}</p>
                <p><strong>Ticket médio:</strong> {formatCurrency(estatisticas.mediaMensal)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
