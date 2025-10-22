import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGlobalData } from '@/contexts/GlobalDataContext';

export function InteractiveCharts() {
  const { state } = useGlobalData();

  const gastoPorMes = state.deputados.reduce((acc: Record<string, number>, deputado) => {
    deputado.gastos.forEach(gasto => {
      const mes = new Date(gasto.data).toISOString().substring(0, 7);
      acc[mes] = (acc[mes] || 0) + parseFloat(gasto.valor);
    });
    return acc;
  }, {});

  const gastoPorCategoria = state.deputados.reduce((acc: Record<string, number>, deputado) => {
    deputado.gastos.forEach(gasto => {
      acc[gasto.categoria] = (acc[gasto.categoria] || 0) + parseFloat(gasto.valor);
    });
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Gastos por Mês</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(gastoPorMes).slice(-6).map(([mes, valor]) => (
              <div key={mes} className="flex justify-between items-center">
                <span className="text-sm">{mes}</span>
                <span className="font-medium">R$ {valor.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gastos por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(gastoPorCategoria)
              .sort(([,a], [,b]) => (Number(b) || 0) - (Number(a) || 0))
              .slice(0, 5)
              .map(([categoria, valor]) => (
                <div key={categoria} className="flex justify-between items-center">
                  <span className="text-sm truncate">{categoria}</span>
                  <span className="font-medium">R$ {valor.toLocaleString()}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}