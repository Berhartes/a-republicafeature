
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertTriangle } from 'lucide-react'

interface AlertasCategoriaPageProps {
  categoriaData: {
    scoreSuspeicao: number;
    alertas: string[];
  };
  estatisticasCategoria: {
    totalFornecedores: number;
    totalDeputados: number;
    deputadosArray: any[];
    totalTransacionado: number;
    totalTransacoes: number;
  };
  anosDisponiveis: any[];
  fornecedorInflacionado: any;
  percentualInflacao: number;
  mediasCategoria: Record<string, number>;
}

export const AlertasCategoriaPage = ({
  categoriaData,
  estatisticasCategoria,
  anosDisponiveis,
  fornecedorInflacionado,
  percentualInflacao,
  mediasCategoria
}: AlertasCategoriaPageProps) => {
  return (
    <>
      {/* Score de suspeição */}
      <Card>
        <CardHeader>
          <CardTitle>Score de Suspeição da Categoria</CardTitle>
          <CardDescription>Análise baseada em padrões investigativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${
                categoriaData.scoreSuspeicao >= 70 ? 'text-red-600' :
                categoriaData.scoreSuspeicao >= 40 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {categoriaData.scoreSuspeicao}
              </div>
              <div className="flex-1">
                <Progress 
                  value={categoriaData.scoreSuspeicao} 
                  className="h-3"
                />
                <p className="text-sm text-gray-600 mt-1">
                  {categoriaData.scoreSuspeicao >= 70 ? 'Alto risco investigativo' : 
                   categoriaData.scoreSuspeicao >= 40 ? 'Risco médio' : 'Baixo risco'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas da Categoria</CardTitle>
          <CardDescription>Situações que merecem investigação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoriaData.alertas?.map((alerta: string, index: number) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-800">{alerta}</span>
              </div>
            ))}
            {(!categoriaData.alertas || categoriaData.alertas.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                Nenhum alerta identificado para esta categoria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Análises investigativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Análise de Concentração</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Concentração de Fornecedores</h4>
                <p className="text-sm text-blue-800">
                  {estatisticasCategoria?.totalFornecedores || 0} fornecedores atendem {estatisticasCategoria.totalDeputados} deputados
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  {estatisticasCategoria.totalFornecedores < 5 ? 'ALTA concentração - Investigar possível cartel' : 'Concentração normal'}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Concentração de Deputados</h4>
                <p className="text-sm text-green-800">
                  Top 3 deputados concentram {
                    estatisticasCategoria.deputadosArray && estatisticasCategoria.deputadosArray.length >= 3
                      ? ((estatisticasCategoria.deputadosArray.slice(0, 3).reduce((sum: number, d: any) => sum + (d.totalGasto || d.totalValor || 0), 0) / estatisticasCategoria.totalTransacionado) * 100).toFixed(1)
                      : '0'
                  }% do volume
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Análise Temporal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">Padrão de Gastos</h4>
                <p className="text-sm text-purple-800">
                  {estatisticasCategoria?.totalTransacoes || 0} transações em {anosDisponiveis.length} anos
                </p>
                <p className="text-xs text-purple-700 mt-1">
                  Média: {Number(estatisticasCategoria.totalTransacoes / anosDisponiveis.length).toFixed(0)} transações/ano
                </p>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">Variação de Preços</h4>
                <p className="text-sm text-orange-800">
                  {fornecedorInflacionado ? `Preços ${percentualInflacao.toFixed(1)}% acima da média` : 'Preços dentro da normalidade'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparação com médias de mercado */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação com Médias de Mercado</CardTitle>
          <CardDescription>Análise comparativa por categoria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(mediasCategoria).map(([categoria, media]) => (
              <div key={categoria} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="text-sm font-medium">{categoria}</span>
                <span className="text-sm text-green-600">Média: R$ {media.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações de investigação */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Investigação</CardTitle>
          <CardDescription>Sugestões baseadas na análise</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoriaData.scoreSuspeicao >= 70 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-900 mb-2">🚨 Investigação Prioritária</h4>
                <p className="text-sm text-red-800">
                  Score alto sugere necessidade de investigação aprofundada dos padrões de gastos
                </p>
              </div>
            )}
            
            {estatisticasCategoria.totalFornecedores < 5 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Verificar Concentração</h4>
                <p className="text-sm text-yellow-800">
                  Poucos fornecedores podem indicar falta de competição ou acordo entre empresas
                </p>
              </div>
            )}
            
            {fornecedorInflacionado && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">💸 Analisar Precificação</h4>
                <p className="text-sm text-orange-800">
                  Preços consistentemente acima da média merecem investigação detalhada
                </p>
              </div>
            )}
            
            {categoriaData.scoreSuspeicao < 40 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">✅ Categoria Normal</h4>
                <p className="text-sm text-green-800">
                  Não foram identificados padrões suspeitos significativos
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}