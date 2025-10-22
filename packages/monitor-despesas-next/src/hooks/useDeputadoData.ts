import { useState, useEffect } from 'react'
import { GastoParlamentar } from '@/types/gastos'

interface UseDeputadoDataProps {
  deputadoId?: string
  deputadoNome?: string
}

export function useDeputadoData({ deputadoId, deputadoNome }: UseDeputadoDataProps) {
  const [deputadoData, setDeputadoData] = useState<any>(null)

  useEffect(() => {
    const analiseStr = localStorage.getItem('ultima-analise')
    if (!analiseStr) return

    const { analise } = JSON.parse(analiseStr)
    
    const deputado = analise.deputadosAnalise.find((d: any) => 
      d.nome === deputadoNome || d.nome.toLowerCase().includes(deputadoId?.toLowerCase() || '')
    )

    if (deputado) {
      const todosGastos = analise.estatisticas.gastosOriginais || []
      const gastosDeputado = todosGastos.filter((g: GastoParlamentar) => 
        g.txNomeParlamentar === deputado.nome
      )

      const dadosProcessados = processarDadosDeputado(deputado, gastosDeputado)
      setDeputadoData(dadosProcessados)
    }
  }, [deputadoId, deputadoNome])

  return deputadoData
}

function processarDadosDeputado(deputado: any, gastos: GastoParlamentar[]) {
  const gastosPorMes = gastos.reduce((acc: any, gasto) => {
    const chave = `${gasto.numMes}/${gasto.numAno}`
    if (!acc[chave]) {
      acc[chave] = {
        mes: gasto.numMes,
        ano: gasto.numAno,
        total: 0,
        transacoes: []
      }
    }
    acc[chave].total += gasto.vlrLiquido
    acc[chave].transacoes.push(gasto)
    return acc
  }, {})

  const gastosPorFornecedor = gastos.reduce((acc: any, gasto) => {
    const chave = gasto.cnpjCpfFornecedor || 'SEM_CNPJ'
    if (!acc[chave]) {
      acc[chave] = {
        nome: gasto.nomeFornecedor,
        cnpj: gasto.cnpjCpfFornecedor,
        total: 0,
        transacoes: 0,
        categorias: new Set()
      }
    }
    acc[chave].total += gasto.vlrLiquido
    acc[chave].transacoes += 1
    acc[chave].categorias.add(gasto.txtDescricao)
    return acc
  }, {})

  const gastosPorCategoria = gastos.reduce((acc: any, gasto) => {
    const categoria = gasto.txtDescricao
    if (!acc[categoria]) {
      acc[categoria] = {
        nome: categoria,
        total: 0,
        transacoes: 0
      }
    }
    acc[categoria].total += gasto.vlrLiquido
    acc[categoria].transacoes += 1
    return acc
  }, {})

  const totalGasto = gastos.reduce((sum, g) => sum + g.vlrLiquido, 0)
  const mediaGasto = totalGasto / (gastos.length || 1)
  const maiorGasto = Math.max(...gastos.map(g => g.vlrLiquido))
  const menorGasto = Math.min(...gastos.map(g => g.vlrLiquido))

  const evolucaoMensal = Object.values(gastosPorMes)
    .sort((a: any, b: any) => {
      if (a.ano !== b.ano) return a.ano - b.ano
      return a.mes - b.mes
    })
    .map((item: any) => ({
      periodo: `${item.mes}/${item.ano}`,
      valor: item.total,
      limite: 45000
    }))

  const topFornecedores = Object.values(gastosPorFornecedor)
    .sort((a: any, b: any) => b.total - a.total)
    .slice(0, 10)
    .map((f: any) => ({
      nome: f.nome,
      cnpj: f.cnpj,
      valor: f.total,
      transacoes: f.transacoes,
      categorias: Array.from(f.categorias)
    }))

  const distribuicaoCategoria = Object.values(gastosPorCategoria)
    .sort((a: any, b: any) => b.total - a.total)
    .map((c: any) => ({
      categoria: c.nome,
      valor: c.total,
      percentual: (c.total / totalGasto * 100).toFixed(1)
    }))

  return {
    ...deputado,
    estatisticas: {
      totalGasto,
      mediaGasto,
      maiorGasto,
      menorGasto,
      numTransacoes: gastos.length,
      numFornecedores: Object.keys(gastosPorFornecedor).length,
      numCategorias: Object.keys(gastosPorCategoria).length
    },
    evolucaoMensal,
    topFornecedores,
    distribuicaoCategoria,
    gastosRecentes: gastos
      .sort((a, b) => new Date(b.datEmissao).getTime() - new Date(a.datEmissao).getTime())
      .slice(0, 10)
  }
}
