import { useEffect, useState } from 'react';
import { useDeputados, useGlobalData } from '@/contexts/GlobalDataContext';

export function DebugPage() {
  const { deputados, loading, error } = useDeputados();
  const { data, isLoading, error: globalError } = useGlobalData();
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingDirect, setIsTestingDirect] = useState(false);

  const testDirectService = async () => {
    setIsTestingDirect(true);
    try {
      console.log('🧪 Testing fallback service...');
      const result = { message: ' services removed', count: 0 };
      setTestResult(result);
    } catch (error) {
      console.error('🧪 Error in test:', error);
      setTestResult({ error: error instanceof Error ? error.message : String(error) });
    } finally {
      setIsTestingDirect(false);
    }
  };

  useEffect(() => {
    testDirectService();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">🔍 Página de Debug</h1>
      
      {/* Debug Específico da Categoria LOCAÇÃO OU FRETAMENTO DE VEÍCULOS AUTOMOTORES */}
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Debug de Locação de Veículos</h3>
        <p className="text-gray-600">Componente removido temporariamente</p>
      </div>
      
      {/* Status do useDeputados */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">useDeputados() Hook</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Loading:</strong> {loading.toString()}
          </div>
          <div>
            <strong>Error:</strong> {error || 'nenhum'}
          </div>
          <div>
            <strong>Deputados Count:</strong> {deputados.length}
          </div>
          <div>
            <strong>Primeiro Deputado:</strong> {deputados[0]?.nomeEleitoral || 'N/A'}
          </div>
        </div>
        
        {deputados.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">Primeiros 3 deputados:</h3>
            <ul className="list-disc list-inside">
              {deputados.slice(0, 3).map(dep => (
                <li key={dep.id}>
                  {dep.nomeEleitoral} ({dep.siglaPartido}/{dep.siglaUf}) - R$ {dep.totalGasto?.toLocaleString('pt-BR')}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Status do useGlobalData */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">useGlobalData() Hook</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Loading:</strong> {isLoading.toString()}
          </div>
          <div>
            <strong>Error:</strong> {globalError || 'nenhum'}
          </div>
          <div>
            <strong>Has Data:</strong> {data ? 'sim' : 'não'}
          </div>
          <div>
            <strong>Data Type:</strong> {data ? typeof data : 'N/A'}
          </div>
        </div>
        
        {data && (
          <div className="mt-4">
            <h3 className="font-semibold">Estrutura dos dados:</h3>
            <ul className="list-disc list-inside">
              <li>data.deputados: {data.deputados?.length || 0}</li>
              <li>data.analise: {data.analise ? 'presente' : 'ausente'}</li>
              <li>data.analise.deputadosAnalise: {data.analise?.deputadosAnalise?.length || 0}</li>
            </ul>
          </div>
        )}
      </div>

      {/* Teste direto do serviço */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Service Test (Deprecated)</h2>
        
        <button 
          onClick={testDirectService} 
          disabled={isTestingDirect}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {isTestingDirect ? 'Testando...' : 'Testar Serviço'}
        </button>
        
        {testResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <h3 className="font-semibold">Resultado do teste direto:</h3>
            {testResult.error ? (
              <p className="text-red-600">Erro: {testResult.error}</p>
            ) : Array.isArray(testResult) ? (
              <div>
                <p>Deputados encontrados: {testResult.length}</p>
                {testResult.slice(0, 3).map((dep, index) => (
                  <p key={index} className="text-sm">
                    {dep.nomeEleitoral} ({dep.siglaPartido}/{dep.siglaUf})
                  </p>
                ))}
              </div>
            ) : (
              <pre className="text-xs overflow-auto">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Informações do ambiente */}
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-4">Informações do Ambiente</h2>
        <div className="text-sm space-y-1">
          <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
          <p><strong>EXECUTION MODE:</strong> {process.env.NODE_ENV}</p>
          <p><strong>DEBUG FLAG:</strong> {process.env.NEXT_PUBLIC_DEBUG ?? process.env.VITE_DEBUG ?? 'indisponível'}</p>
        </div>
      </div>
    </div>
  );
}