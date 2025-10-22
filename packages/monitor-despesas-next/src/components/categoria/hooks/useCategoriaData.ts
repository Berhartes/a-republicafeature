import { useState, useEffect, useMemo } from 'react'

interface CategoriaStats {
  nome: string
  totalTransacoes: number
  volumeTotal: number
  deputadosUnicos: number
  fornecedoresUnicos: number
  scoreRisco: number
  transacoesPorAno: { [ano: number]: any[] }
}

const categoriaDataCache = new Map<string, {
  data: CategoriaStats
  transactions: any[]
  timestamp: number
}>()

const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

export function useCategoriaData(categoriaNome: string, contextFornecedores?: any[]) {
  const [categoriaData, setCategoriaData] = useState<CategoriaStats | null>(null)
  const [todasTransacoes, setTodasTransacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false
    let debounceTimer: NodeJS.Timeout | null = null
    
    const carregarDadosCategoria = async () => {
      if (isCancelled) return
      if (!categoriaNome) {
        console.log('⚠️ [useCategoriaData] Nome da categoria vazio')
        return
      }

      if (debounceTimer) {
        console.log('⏱️ [useCategoriaData] Cancelando timer anterior (debounce)')
        clearTimeout(debounceTimer)
      }

      debounceTimer = setTimeout(async () => {
        if (isCancelled) return
        await executarCarregamento()
      }, 300)
    }

    const executarCarregamento = async () => {

      if (isCancelled) return
      
      if (contextFornecedores && contextFornecedores.length > 0) {
        console.log(`🎯 [Context Data] Usando dados do contexto (${contextFornecedores.length} fornecedores) para "${categoriaNome}"`)
        
        const categoriaNormalizada = categoriaNome.toUpperCase().trim()
        const fornecedoresDaCategoria = contextFornecedores.filter(fornecedor => {
          if (!fornecedor.categorias || fornecedor.categorias.length === 0) return false
          
          return fornecedor.categorias.some((categoria: string) => {
            const catNormalizada = categoria.toUpperCase().trim()
            return catNormalizada.includes(categoriaNormalizada) ||
                   categoriaNormalizada.includes(catNormalizada) ||
                   catNormalizada === categoriaNormalizada
          })
        })
        
        const stats: CategoriaStats = {
          nome: categoriaNome,
          totalTransacoes: fornecedoresDaCategoria.reduce((sum, f) => sum + (f.transacoes || 0), 0),
          volumeTotal: fornecedoresDaCategoria.reduce((sum, f) => sum + (f.totalTransacionado || 0), 0),
          deputadosUnicos: new Set(fornecedoresDaCategoria.flatMap(f => f.deputadosAtendidos || [])).size,
          fornecedoresUnicos: fornecedoresDaCategoria.length,
          scoreRisco: fornecedoresDaCategoria.length > 0 ? 
            fornecedoresDaCategoria.reduce((sum, f) => sum + (f.scoreSuspeicao || 0), 0) / fornecedoresDaCategoria.length : 0,
          transacoesPorAno: {}
        }
        
        console.log(`✅ [Context Data] Estatísticas geradas: ${stats.fornecedoresUnicos} fornecedores, R$ ${stats.volumeTotal.toLocaleString()}`)
        
        setCategoriaData(stats)
        setTodasTransacoes([]) // Pode ser populado depois se necessário
        setLoading(false)
        return
      }
      
      const cacheKey = categoriaNome.toLowerCase().trim()
      const cached = categoriaDataCache.get(cacheKey)
      
      if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`⚡ [CACHE HIT] Usando dados em cache para "${categoriaNome}"`)
        setCategoriaData(cached.data)
        setTodasTransacoes(cached.transactions)
        setLoading(false)
        return
      }
      
      setLoading(true)
      setErro(null)

      try {
        console.log(`🔍 [useCategoriaData] Carregando dados para: "${categoriaNome}"`)
        
        console.log(`📊 [useCategoriaData] Using local data processing...`)
        const todasTransacoesSemFiltro = [] // Local data processing required
        
        if (isCancelled) return
        
        console.log(`✅ [useCategoriaData] Total encontrado: ${todasTransacoesSemFiltro.length} transações`)
        
        if (todasTransacoesSemFiltro.length === 0) {
          console.warn(`⚠️ [useCategoriaData] NENHUMA TRANSAÇÃO ENCONTRADA PARA "${categoriaNome}"!`);
          console.warn(`💡 [INFO] Verifique se:`);
          console.warn(`   1. A categoria existe no `);
          console.warn(`   2. Os fornecedores têm esta categoria nas suas categoriasAtendidas`);
          console.warn(`   3. As transações estão estruturadas corretamente`);
        }
        
        todasTransacoesSemFiltro.forEach(transacao => {
          let anoTransacao: number | null = null;
          
          const campos = [
            transacao.ano,
            transacao.dataDocumento,
            transacao.dataEmissao, 
            transacao.data,
            transacao.timestamp,
            transacao.dtEmissao,
            transacao.dtCompetencia,
            transacao.datEmissao,
            transacao.datDocumento
          ];
          
          for (const campo of campos) {
            if (campo) {
              if (typeof campo === 'number' && campo > 2000 && campo < 2050) {
                anoTransacao = campo;
                break;
              } else if (typeof campo === 'string') {
                const yearMatch = campo.match(/(\d{4})/);
                if (yearMatch) {
                  anoTransacao = parseInt(yearMatch[1]);
                  break;
                }
              } else if (campo && typeof campo === 'object') {
                try {
                  if (campo.toDate) {
                    anoTransacao = campo.toDate().getFullYear();
                    break;
                  } else if (campo.seconds) {
                    anoTransacao = new Date(campo.seconds * 1000).getFullYear();
                    break;
                  }
                } catch (error) {
                  console.error('Erro ao interpretar data de transação na categorização', error)
                }
              }
            }
          }
          
          if (anoTransacao && anoTransacao >= 2015 && anoTransacao <= 2025) {
            if (!transacoesPorAno[anoTransacao]) {
              transacoesPorAno[anoTransacao] = [];
            }
            transacoesPorAno[anoTransacao].push(transacao);
            todasTransacoesCarregadas.push(transacao);
            
            console.debug(`✅ [useCategoriaData] Transação agrupada no ano ${anoTransacao}:`, {
              id: transacao.id,
              fonte: transacao.fonte,
              nomeFornecedor: transacao.nomeFornecedor
            });
          } else {
            console.debug(`⚠️ [useCategoriaData] Transação ano ${anoTransacao} fora do range 2015-2025:`, {
              id: transacao.id,
              ano: anoTransacao,
              campos: campos.filter(Boolean).slice(0, 3)
            });
          }
        });
        
        const anosEncontrados = Object.keys(transacoesPorAno).map(Number).sort((a, b) => b - a);
        console.log(`📈 [useCategoriaData] === RESULTADO DO AGRUPAMENTO ===`);
        console.log(`📈 [useCategoriaData] Anos encontrados: ${anosEncontrados.length > 0 ? anosEncontrados.join(', ') : 'NENHUM'}`);
        console.log(`📈 [useCategoriaData] Total transações agrupadas: ${todasTransacoesCarregadas.length}`);
        
        anosEncontrados.forEach(ano => {
          const transacoesDoAno = transacoesPorAno[ano];
          console.log(`✅ [useCategoriaData] Ano ${ano}: ${transacoesDoAno.length} transações`);
          
          if (transacoesDoAno.length > 0) {
            const exemplo = transacoesDoAno[0];
            console.log(`   📝 Exemplo: ${exemplo.nomeFornecedor || 'N/A'} - R$ ${exemplo.valorLiquido || exemplo.vlrLiquido || 0} (${exemplo.fonte})`);
          }
        });
        
        if (anosEncontrados.length === 0 && todasTransacoesSemFiltro.length > 0) {
          console.warn(`⚠️ [DEBUG] NENHUM ANO AGRUPADO mas ${todasTransacoesSemFiltro.length} transações encontradas!`);
          todasTransacoesSemFiltro.slice(0, 3).forEach((t, i) => {
            console.warn(`   [${i}] ID: ${t.id}, Fonte: ${t.fonte}, Ano: ${t.ano}, Data: ${t.dataDocumento || t.dataEmissao}`);
          });
        }

        const volumeTotal = todasTransacoesCarregadas.reduce((sum, t) => {
          const valor = parseFloat((t.valorLiquido || t.vlrLiquido || t.valorDocumento || t.vlrDocumento || 0).toString())
          return sum + (isNaN(valor) ? 0 : valor)
        }, 0)

        const deputadosUnicos = new Set(
          todasTransacoesCarregadas
            .map(t => t.nomeDeputado || t.txNomeParlamentar || t.deputadoNome)
            .filter(Boolean)
        ).size

        const fornecedoresUnicos = new Set(
          todasTransacoesCarregadas
            .map(t => t.cnpjCpfFornecedor || t.cnpjFornecedor)
            .filter(Boolean)
        ).size

        if (isCancelled) return

        const stats: CategoriaStats = {
          nome: categoriaNome,
          totalTransacoes: todasTransacoesCarregadas.length,
          volumeTotal,
          deputadosUnicos,
          fornecedoresUnicos,
          scoreRisco: fornecedoresUnicos > 0 ? Math.min(100, Math.round((deputadosUnicos / fornecedoresUnicos) * 10)) : 0,
          transacoesPorAno
        }

        if (!isCancelled) {
          setCategoriaData(stats)
          setTodasTransacoes(todasTransacoesCarregadas)
          
          const cacheKey = categoriaNome.toLowerCase().trim()
          categoriaDataCache.set(cacheKey, {
            data: stats,
            transactions: todasTransacoesCarregadas,
            timestamp: Date.now()
          })
          
          if (categoriaDataCache.size > 10) {
            const oldestKey = Array.from(categoriaDataCache.keys())[0]
            categoriaDataCache.delete(oldestKey)
          }
        }

        console.log(`✅ [useCategoriaData] Dados carregados: ${todasTransacoesCarregadas.length} transações`)
        console.log(`📊 [useCategoriaData] Anos disponíveis:`, Object.keys(transacoesPorAno).map(Number).sort((a, b) => b - a))
        console.log(`📊 [useCategoriaData] Distribuição por ano:`, Object.entries(transacoesPorAno).map(([ano, trans]) => `${ano}: ${trans.length}`).join(', '))

      } catch (error) {
        if (!isCancelled) {
          console.error('❌ [useCategoriaData] Erro ao carregar:', error)
          setErro('Erro ao carregar dados da categoria')
          setCategoriaData(null)
          setTodasTransacoes([])
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    carregarDadosCategoria()

    return () => {
      console.log('🧹 [useCategoriaData] Cancelando carregamento da categoria:', categoriaNome)
      isCancelled = true
      if (debounceTimer) {
        clearTimeout(debounceTimer)
        debounceTimer = null
      }
    }
  }, [categoriaNome, contextFornecedores])

  const anosDisponiveis = useMemo(() => {
    if (!categoriaData?.transacoesPorAno) return []
    
    return Object.keys(categoriaData.transacoesPorAno)
      .map(Number)
      .filter(ano => categoriaData.transacoesPorAno[ano].length > 0)
      .sort((a, b) => b - a)
  }, [categoriaData?.transacoesPorAno])

  const getTransacoesPorAno = (ano: number) => {
    if (!categoriaData?.transacoesPorAno) {
      console.log(`⚠️ [getTransacoesPorAno] Dados ainda não carregados`)
      return []
    }
    const transacoes = categoriaData.transacoesPorAno[ano] || []
    console.log(`🔍 [getTransacoesPorAno] Ano ${ano}: ${transacoes.length} transações encontradas`)
    return transacoes
  }

  const getTransacoesPorPeriodo = (anoInicio: number, anoFim: number) => {
    if (!categoriaData?.transacoesPorAno) return []
    
    const transacoesFiltradas: any[] = []
    for (let ano = anoInicio; ano <= anoFim; ano++) {
      const transacoesAno = categoriaData.transacoesPorAno[ano] || []
      transacoesFiltradas.push(...transacoesAno)
    }
    
    return transacoesFiltradas
  }

  return {
    categoriaData,
    todasTransacoes,
    loading,
    erro,
    anosDisponiveis,
    getTransacoesPorAno,
    getTransacoesPorPeriodo
  }
}