import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlobalData } from '@/contexts/GlobalDataContext';

export function TemporalComparison() {
  const { state } = useGlobalData();

  const gastosAnoAtual = state.deputados.reduce((total, deputado) => {
    return total + deputado.gastos
      .filter(gasto => new Date(gasto.data).getFullYear() === 2025)
      .reduce((sum, gasto) => sum + gasto.valor, 0);
  }, 0);

  const gastosAnoAnterior = state.deputados.reduce((total, deputado) => {
    return total + deputado.gastos
      .filter(gasto => new Date(gasto.data).getFullYear() === 2024)
      .reduce((sum, gasto) => sum + gasto.valor, 0);
  }, 0);

  const variacao = gastosAnoAnterior > 0 
    ? ((gastosAnoAtual - gastosAnoAnterior) / gastosAnoAnterior) * 100 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação Temporal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              R$ {gastosAnoAtual.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">2025</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-gray-600">
              R$ {gastosAnoAnterior.toLocaleString('pt-BR')}
            </div>
            <div className="text-sm text-gray-600">2024</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className={`text-lg font-bold ${variacao >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Variação</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}