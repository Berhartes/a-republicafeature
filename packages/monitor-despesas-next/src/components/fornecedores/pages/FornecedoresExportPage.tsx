import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Download, FileText, Database, BarChart3, Settings, CheckCircle } from 'lucide-react'
import type { FornecedorStats } from '@/services/fornecedores-service'

interface FornecedoresExportPageProps {
  fornecedores: FornecedorStats[]
  loading: boolean
}

export function FornecedoresExportPage({
  fornecedores,
  loading
}: FornecedoresExportPageProps) {
  const [formatoExport, setFormatoExport] = useState('json')
  const [camposExport, setCamposExport] = useState({
    nome: true,
    cnpj: true,
    totalTransacionado: true,
    totalTransacoes: true,
    scoreSuspeicao: true,
    categorias: true,
    deputadosAtendidos: true,
    estatisticas: false,
    detalhes: false
  })
  const [filtroExport, setFiltroExport] = useState('todos')
  const [exportando, setExportando] = useState(false)
  const [progressoExport, setProgressoExport] = useState(0)

  const formatosDisponiveis = [
    { valor: 'json', nome: 'JSON', icone: '📄', descricao: 'Formato estruturado para análise' },
    { valor: 'csv', nome: 'CSV', icone: '📊', descricao: 'Para planilhas (Excel, Sheets)' },
    { valor: 'txt', nome: 'TXT', icone: '📝', descricao: 'Texto simples' },
    { valor: 'relatorio', nome: 'Relatório', icone: '📋', descricao: 'Relatório formatado' }
  ]

  const filtrosExport = [
    { valor: 'todos', nome: 'Todos os Fornecedores' },
    { valor: 'suspeitos', nome: 'Apenas Suspeitos (Score ≥ 30)' },
    { valor: 'alto-risco', nome: 'Alto Risco (Score ≥ 70)' },
    { valor: 'top-100', nome: 'Top 100 por Valor' },
    { valor: 'top-10', nome: 'Top 10 por Score' }
  ]

  const handleCampoChange = (campo: keyof typeof camposExport, checked: boolean) => {
    setCamposExport(prev => ({
      ...prev,
      [campo]: checked
    }))
  }

  const filtrarFornecedores = () => {
    let resultado = [...fornecedores]

    switch (filtroExport) {
      case 'suspeitos':
        resultado = resultado.filter(f => f.scoreSuspeicao >= 30)
        break
      case 'alto-risco':
        resultado = resultado.filter(f => f.scoreSuspeicao >= 70)
        break
      case 'top-100':
        resultado = resultado
          .sort((a, b) => b.totalTransacionado - a.totalTransacionado)
          .slice(0, 100)
        break
      case 'top-10':
        resultado = resultado
          .sort((a, b) => b.scoreSuspeicao - a.scoreSuspeicao)
          .slice(0, 10)
        break
    }

    return resultado
  }

  const gerarExport = async () => {
    setExportando(true)
    setProgressoExport(0)

    try {
      const fornecedoresFiltrados = filtrarFornecedores()
      
      const intervals = [20, 40, 60, 80, 100]
      for (let i = 0; i < intervals.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200))
        setProgressoExport(intervals[i])
      }

  const dadosExport: any = fornecedoresFiltrados.map(f => {
        const objeto: any = {}
        
        if (camposExport.nome) objeto.nome = f.nome
        if (camposExport.cnpj) objeto.cnpj = f.cnpj
        if (camposExport.totalTransacionado) objeto.totalTransacionado = f.totalTransacionado
        if (camposExport.totalTransacoes) objeto.totalTransacoes = f.totalTransacoes
        if (camposExport.scoreSuspeicao) objeto.scoreSuspeicao = f.scoreSuspeicao
        if (camposExport.categorias) objeto.categorias = f.categorias
        if (camposExport.deputadosAtendidos) objeto.deputadosAtendidos = f.deputadosAtendidos
        
        if (camposExport.estatisticas) {
          objeto.estatisticas = {
            mediaTransacao: f.totalTransacoes > 0 ? f.totalTransacionado / f.totalTransacoes : 0,
            numeroDeputados: f.deputadosAtendidos.length,
            numeroCategorias: f.categorias.length
          }
        }

        return objeto
      })

      let conteudo = ''
      let nomeArquivo = `fornecedores-export-${new Date().toISOString().split('T')[0]}`

      switch (formatoExport) {
        case 'json':
          conteudo = JSON.stringify({
            metadata: {
              dataExport: new Date().toISOString(),
              totalFornecedores: dadosExport.length,
              filtroAplicado: filtroExport,
              camposIncluidos: Object.keys(camposExport).filter(k => camposExport[k as keyof typeof camposExport])
            },
            fornecedores: dadosExport
          }, null, 2)
          nomeArquivo += '.json'
          break

        case 'csv':
          if (dadosExport.length > 0) {
            const headers = Object.keys(dadosExport[0]).join(',')
            const rows = dadosExport.map(item => 
              Object.values(item).map(valor => 
                Array.isArray(valor) ? `"${valor.join('; ')}"` : `"${valor}"`
              ).join(',')
            )
            conteudo = [headers, ...rows].join('\n')
          }
          nomeArquivo += '.csv'
          break

        case 'txt':
          conteudo = dadosExport.map((f, index) => {
            let texto = `${index + 1}. ${f.nome}\n`
            if (f.cnpj) texto += `   CNPJ: ${f.cnpj}\n`
            if (f.totalTransacionado) texto += `   Valor Total: R$ ${f.totalTransacionado.toLocaleString('pt-BR')}\n`
            if (f.scoreSuspeicao) texto += `   Score: ${f.scoreSuspeicao.toFixed(1)}\n`
            return texto + '\n'
          }).join('')
          nomeArquivo += '.txt'
          break

        case 'relatorio':
          const totalValor = dadosExport.reduce((acc: number, f: any) => acc + f.totalTransacionado, 0)
          const mediaScore = dadosExport.reduce((acc: number, f: any) => acc + f.scoreSuspeicao, 0) / dadosExport.length
          
          conteudo = `RELATÓRIO DE FORNECEDORES
Data: ${new Date().toLocaleDateString('pt-BR')}
Filtro: ${filtrosExport.find(f => f.valor === filtroExport)?.nome}
Total de Fornecedores: ${dadosExport.length}
Valor Total: R$ ${totalValor.toLocaleString('pt-BR')}
Score Médio: ${mediaScore.toFixed(2)}

FORNECEDORES:
${dadosExport.map((f: any, index: number) => `
${index + 1}. ${f.nome}
   CNPJ: ${f.cnpj || 'Não informado'}
   Valor: R$ ${f.totalTransacionado.toLocaleString('pt-BR')}
   Transações: ${f.totalTransacoes}
   Score: ${f.scoreSuspeicao.toFixed(1)}
   Categorias: ${f.categorias?.join(', ') || 'Nenhuma'}
`).join('')}`
          nomeArquivo += '.txt'
          break
      }

      const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = nomeArquivo
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log(`✅ Export realizado: ${nomeArquivo} (${dadosExport.length} fornecedores)`)

    } catch (error) {
      console.error('❌ Erro no export:', error)
    } finally {
      setExportando(false)
      setTimeout(() => setProgressoExport(0), 2000)
    }
  }

  const fornecedoresFiltrados = filtrarFornecedores()
  const camposSelecionados = Object.values(camposExport).filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Configurações de Export */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formato de Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Formato de Export
            </CardTitle>
            <CardDescription>
              Escolha o formato para exportação dos dados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {formatosDisponiveis.map(formato => (
                <div
                  key={formato.valor}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    formatoExport === formato.valor 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setFormatoExport(formato.valor)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{formato.icone}</span>
                    <div>
                      <div className="font-medium">{formato.nome}</div>
                      <div className="text-xs text-muted-foreground">{formato.descricao}</div>
                    </div>
                    {formatoExport === formato.valor && (
                      <CheckCircle className="h-4 w-4 text-blue-600 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Filtros de Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Filtros de Export
            </CardTitle>
            <CardDescription>
              Configure quais fornecedores incluir no export
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Incluir:</label>
              <Select value={filtroExport} onValueChange={setFiltroExport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filtrosExport.map(filtro => (
                    <SelectItem key={filtro.valor} value={filtro.valor}>
                      {filtro.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-1">Prévia do Export:</div>
              <div className="text-xs text-muted-foreground">
                {fornecedoresFiltrados.length} fornecedores serão exportados
              </div>
              <div className="text-xs text-muted-foreground">
                Valor total: R$ {fornecedoresFiltrados.reduce((acc, f) => acc + f.totalTransacionado, 0).toLocaleString('pt-BR')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campos a Incluir */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Campos a Incluir
            <Badge variant="secondary">{camposSelecionados} selecionados</Badge>
          </CardTitle>
          <CardDescription>
            Selecione quais informações incluir no export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(camposExport).map(([campo, selecionado]) => (
              <div key={campo} className="flex items-center space-x-2">
                <Checkbox
                  id={campo}
                  checked={selecionado}
                  onCheckedChange={(checked) => handleCampoChange(campo as keyof typeof camposExport, checked as boolean)}
                />
                <label
                  htmlFor={campo}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {campo === 'nome' && 'Nome do Fornecedor'}
                  {campo === 'cnpj' && 'CNPJ'}
                  {campo === 'totalTransacionado' && 'Valor Total'}
                  {campo === 'totalTransacoes' && 'Número de Transações'}
                  {campo === 'scoreSuspeicao' && 'Score de Suspeição'}
                  {campo === 'categorias' && 'Categorias'}
                  {campo === 'deputadosAtendidos' && 'Deputados Atendidos'}
                  {campo === 'estatisticas' && 'Estatísticas Calculadas'}
                  {campo === 'detalhes' && 'Detalhes Adicionais'}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Botão de Export */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Pronto para Exportar</h3>
              <p className="text-sm text-muted-foreground">
                {fornecedoresFiltrados.length} fornecedores • {camposSelecionados} campos • Formato {formatosDisponiveis.find(f => f.valor === formatoExport)?.nome}
              </p>
            </div>
            
            <Button
              onClick={gerarExport}
              disabled={exportando || loading || camposSelecionados === 0}
              className="flex items-center gap-2"
              size="lg"
            >
              <Download className="h-4 w-4" />
              {exportando ? 'Exportando...' : 'Exportar Dados'}
            </Button>
          </div>

          {/* Barra de Progresso */}
          {exportando && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Gerando export...</span>
                <span className="text-xs text-muted-foreground">{progressoExport}%</span>
              </div>
              <Progress value={progressoExport} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}