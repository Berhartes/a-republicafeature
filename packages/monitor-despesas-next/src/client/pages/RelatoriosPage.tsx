import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, FileText, Download, Printer, RefreshCw, Database } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useGlobalData } from '@/contexts/GlobalDataContext'
import { Badge } from '@/components/ui/badge'

export function RelatoriosPage() {
  const { data: Data, isLoading: loading, error, refetch } = useGlobalData();

  if (loading) {
    return <div className="p-4">Carregando dados locais...</div>;
  }

  if (error || !Data) {
    return (
      <div className="space-y-4">
        <div className="p-4 text-red-600">Erro ao carregar dados locais</div>
        {!Data && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma análise encontrada. Conecte-se ao  para gerar relatórios.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  const { analise } = Data
  const dataAnalise = (Data as any).data || null
  const arquivo = (Data as any).arquivo || null
  const fonte = (Data as any).fonte || 'cache'
  
  const estatisticas = analise?.estatisticas || {
    totalGasto: 0,
    totalRegistros: 0,
    numDeputados: 0,
    numFornecedores: 0,
    mediaGastoPorDeputado: 0,
    categoriasMaisGastos: []
  }
  const deputadosAnalise = analise?.deputadosAnalise || []
  const fornecedoresSuspeitos = analise?.fornecedoresSuspeitos || []
  const alertas = analise?.alertas || []

  const gerarRelatorioCompleto = () => {
    const relatorio = `
RELATÓRIO DE ANÁLISE - GASTOS PARLAMENTARES
===========================================

Data da Análise: ${dataAnalise ? format(new Date(dataAnalise), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Não disponível'}
Fonte dos Dados: ${fonte === '' ? ' (Tempo Real)' : 'Arquivo CSV'}
Arquivo/Período: ${arquivo}

RESUMO EXECUTIVO
----------------
Total de Registros: ${estatisticas.totalRegistros.toLocaleString('pt-BR')}
Total Gasto: R$ ${estatisticas.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Número de Deputados: ${estatisticas.numDeputados}
Número de Fornecedores: ${estatisticas.numFornecedores}
Média por Deputado: R$ ${estatisticas.mediaGastoPorDeputado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

ALERTAS GERADOS
---------------
Total de Alertas: ${alertas.length}
- Alta Gravidade: ${alertas.filter((a: any) => a.gravidade === 'ALTA').length}
- Média Gravidade: ${alertas.filter((a: any) => a.gravidade === 'MEDIA').length}
- Baixa Gravidade: ${alertas.filter((a: any) => a.gravidade === 'BAIXA').length}

Por Tipo:
${Object.entries(alertas.reduce((acc: any, a: any) => {
  acc[a.tipo] = (acc[a.tipo] || 0) + 1
  return acc
}, {})).map(([tipo, count]) => `- ${tipo}: ${count}`).join('\n')}

TOP 10 DEPUTADOS COM MAIORES GASTOS
------------------------------------
${deputadosAnalise.slice(0, 10).map((d: any, i: number) => 
  `${i + 1}. ${d.nomeEleitoral} (${d.siglaPartido}-${d.siglaUf})
   Total: R$ ${d.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
   Transações: ${d.numTransacoes}
   Alertas: ${d.alertas.length}
   Score de Suspeição: ${d.scoreSuspeicao}`
).join('\n\n')}

FORNECEDORES SUSPEITOS
----------------------
${fornecedoresSuspeitos.slice(0, 10).map((f: any, i: number) => 
  `${i + 1}. ${f.nomeEleitoral}
   CNPJ: ${f.cnpj}
   Total Recebido: R$ ${f.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
   Deputados Atendidos: ${f.deputadosAtendidos}
   Média por Transação: R$ ${f.mediaTransacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
   Índice de Suspeição: ${f.indiceSuspeicao}
   Alertas: ${f.alertas.join(', ')}`
).join('\n\n')}

PRINCIPAIS CATEGORIAS DE GASTOS
-------------------------------
${estatisticas.categoriasMaisGastos.map((c: any, i: number) => 
  `${i + 1}. ${c.categoria}
   Total: R$ ${c.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
   Transações: ${c.numTransacoes}`
).join('\n\n')}

RECOMENDAÇÕES
-------------
1. Investigar urgentemente todos os casos de superfaturamento em combustível
2. Auditar fornecedores que atendem menos de 5 deputados
3. Verificar gastos acima do limite mensal permitido
4. Cruzar dados de localização dos deputados com gastos realizados
5. Investigar vínculos entre fornecedores suspeitos e parlamentares

===========================================
Relatório gerado automaticamente pelo Sistema de Monitoramento de Gastos Parlamentares
`

    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_gastos_${new Date().toISOString().split('T')[0]}.txt`
    link.click()
  }

  const gerarRelatorioHTML = () => {
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Gastos Parlamentares</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #333; }
        .header { border-bottom: 3px solid #333; margin-bottom: 20px; }
        .section { margin: 20px 0; }
        .alert-high { color: #dc2626; font-weight: bold; }
        .alert-medium { color: #f59e0b; }
        .table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .table th { background-color: #f3f4f6; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório de Análise - Gastos Parlamentares</h1>
        <p><strong>Data:</strong> ${dataAnalise ? format(new Date(dataAnalise), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) : 'Não disponível'}</p>
        <p><strong>Fonte:</strong> ${fonte === '' ? ' (Tempo Real)' : 'Arquivo CSV'}</p>
        <p><strong>Período:</strong> ${arquivo}</p>
    </div>

    <div class="section">
        <h2>Resumo Executivo</h2>
        <ul>
            <li>Total de Registros: ${estatisticas.totalRegistros.toLocaleString('pt-BR')}</li>
            <li>Total Gasto: <strong>R$ ${estatisticas.totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></li>
            <li>Número de Deputados: ${estatisticas.numDeputados}</li>
            <li>Média por Deputado: R$ ${estatisticas.mediaGastoPorDeputado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
        </ul>
    </div>

    <div class="section">
        <h2>Alertas Críticos</h2>
        <p class="alert-high">${alertas.filter((a: any) => a.gravidade === 'ALTA').length} alertas de alta gravidade detectados</p>
        <table class="table">
            <thead>
                <tr>
                    <th>Tipo</th>
                    <th>Deputado</th>
                    <th>Valor</th>
                    <th>Descrição</th>
                </tr>
            </thead>
            <tbody>
                ${alertas.filter((a: any) => a.gravidade === 'ALTA').slice(0, 10).map((a: any) => `
                    <tr>
                        <td>${a.tipo}</td>
                        <td>${a.deputado}</td>
                        <td>R$ ${a.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>${a.descricao}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema de Monitoramento de Gastos Parlamentares</p>
    </div>
</body>
</html>
`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `relatorio_gastos_${new Date().toISOString().split('T')[0]}.html`
    link.click()
  }

  const imprimirRelatorio = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Relatórios</h2>
          <p className="text-muted-foreground">
            Gere relatórios detalhados da análise realizada
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/*  status removed - using local data only */}
          <Button 
            onClick={refetch} 
            variant="outline" 
            size="sm"
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={gerarRelatorioCompleto} variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Relatório TXT
          </Button>
          <Button onClick={gerarRelatorioHTML} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Relatório HTML
          </Button>
          <Button onClick={imprimirRelatorio} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
        </div>
      </div>

      {/* Resumo da Análise */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo da Análise</CardTitle>
          <CardDescription>
            Análise realizada em {dataAnalise ? format(new Date(dataAnalise), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não disponível'}
          </CardDescription>
          <div className="mt-2">
            {fonte === '' && (
              <Badge variant="outline" className="text-xs">
                <Database className="h-3 w-3 mr-1" />
                Dados em tempo real
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Gasto</p>
              <p className="text-2xl font-bold">R$ {(estatisticas.totalGasto / 1000000).toFixed(2)}M</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Deputados</p>
              <p className="text-2xl font-bold">{estatisticas.numDeputados}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Alertas</p>
              <p className="text-2xl font-bold">{alertas.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fornecedores Suspeitos</p>
              <p className="text-2xl font-bold">{fornecedoresSuspeitos.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deputados com Maior Score de Suspeição */}
      <Card>
        <CardHeader>
          <CardTitle>Deputados com Maior Índice de Suspeição</CardTitle>
          <CardDescription>
            Baseado na combinação de alertas e padrões suspeitos detectados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deputadosAnalise
              .filter((d: any) => d.scoreSuspeicao > 50)
              .slice(0, 10)
              .map((deputado: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{deputado.nomeEleitoral}</p>
                    <p className="text-sm text-muted-foreground">
                      {deputado.siglaPartido}-{deputado.siglaUf} | {deputado.alertas.length} alertas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {deputado.scoreSuspeicao}
                    </div>
                    <p className="text-xs text-muted-foreground">Score de Suspeição</p>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Padrões Identificados */}
      <Card>
        <CardHeader>
          <CardTitle>Padrões Suspeitos Identificados</CardTitle>
          <CardDescription>
            Principais irregularidades encontradas na análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-900">Superfaturamento em Combustível</h4>
              <p className="text-sm text-red-700 mt-1">
                Detectados abastecimentos com valores até 20x acima do normal. 
                Casos críticos: valores de R$ 8.000+ por abastecimento.
              </p>
            </div>
            
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="font-semibold text-orange-900">Gastos Acima do Limite</h4>
              <p className="text-sm text-orange-700 mt-1">
                Múltiplos deputados com gastos mensais superiores a 200% do limite permitido.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-900">Fornecedores Concentrados</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Empresas faturando centenas de milhares atendendo apenas 2-4 deputados.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900">Concentração Regional</h4>
              <p className="text-sm text-blue-700 mt-1">
                Desproporcionalidade de gastos em estados específicos, notadamente Roraima.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle>Recomendações de Investigação</CardTitle>
          <CardDescription>
            Ações prioritárias baseadas nos achados da análise
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="text-sm">
              <strong>Auditoria Urgente:</strong> Todos os gastos com combustível acima de R$ 1.000 por transação
            </li>
            <li className="text-sm">
              <strong>Verificação de Notas Fiscais:</strong> Especialmente das empresas ON-Z, Diamond e Working
            </li>
            <li className="text-sm">
              <strong>Cruzamento de Dados:</strong> Verificar se os deputados estavam no local na data do gasto
            </li>
            <li className="text-sm">
              <strong>Investigação de Vínculos:</strong> Relação entre fornecedores e deputados, incluindo doações de campanha
            </li>
            <li className="text-sm">
              <strong>Análise de Mercado:</strong> Comparar preços pagos com valores de mercado para identificar superfaturamento
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
