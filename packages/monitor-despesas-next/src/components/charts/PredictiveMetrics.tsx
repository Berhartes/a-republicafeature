import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlobalData } from '@/contexts/GlobalDataContext';

export function PredictiveMetrics() {
  const { state } = useGlobalData();

  const gastosUltimosMeses = state.deputados.reduce((acc: number[], deputado) => {
    const meses: Record<string, number> = {};
    deputado.gastos.forEach(gasto => {
      const mes = new Date(gasto.data).toISOString().substring(0, 7);
      meses[mes] = (meses[mes] || 0) + gasto.valor;
    });
    
    const valores = Object.values(meses);
    return acc.concat(valores);
  }, []);

  const mediaGastosMensal = gastosUltimosMeses.length > 0 
    ? gastosUltimosMeses.reduce((a, b) => a + b, 0) / gastosUltimosMeses.length 
    : 0;

  const tendencia = gastosUltimosMeses.length >= 2 
    ? gastosUltimosMeses[gastosUltimosMeses.length - 1] - gastosUltimosMeses[gastosUltimosMeses.length - 2]
    : 0;

  const projecaoAnual = mediaGastosMensal * 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas Preditivas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              R$ {mediaGastosMensal.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">Média Mensal</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className={`text-lg font-bold ${tendencia >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {tendencia >= 0 ? '+' : ''}R$ {tendencia.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">Tendência</div>
          </div>
          
          <div className="text-center p-4 bg-indigo-50 rounded-lg">
            <div className="text-lg font-bold text-indigo-600">
              R$ {projecaoAnual.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">Projeção Anual</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}