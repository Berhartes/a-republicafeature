
import React, { useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { RefreshCw, Eye, Building2, Filter, X, Zap } from 'lucide-react'
import { getCategoriaColor } from '@/lib/categoria-colors'
import { createCategoryUrl } from '@/lib/category-slugs'
import { useUnifiedRankingData, useUnifiedCache } from '@/contexts/UnifiedCacheProvider'
import { type FornecedorStats } from '@/services/fornecedores-service'

export interface FornecedorRanking {
  nome: string
  cnpj?: string
  valor: number
  numeroTransacoes: number
  categoriaPrincipal: string
  categorias: string[]
  deputadosAtendidos?: string[] | number
}

interface Top5FornecedoresRankingOptimizedProps {
  context: 'fornecedores-page' | 'perfil-deputado'
  
  totalReferencia?: number // Se não fornecido, usa do cache
  labelPercentual?: string // "do total" ou "do deputado"
  
  categorias?: string[]
  categoriaSelecionada?: string
  onCategoriaChange?: (categoria: string) => void
  
  categorySelectMode?: 'button' | 'dropdown' | 'none'
  
  title?: string
  description?: string
  
  showDeputadosCount?: boolean
  monetaryFormat?: 'with-cents' | 'without-cents'
  emptyMessage?: string
  
  anoSelecionado?: number | 'todos'
  mesSelecionado?: string
}

export default function Top5FornecedoresRankingOptimized({
  context,
  totalReferencia,
  labelPercentual = 'do total',
  categorias,
  categoriaSelecionada = 'todas',
  onCategoriaChange,
  categorySelectMode = 'dropdown',
  title,
  description,
  showDeputadosCount = true,
  monetaryFormat = 'without-cents',
  emptyMessage,
  anoSelecionado,
  mesSelecionado
}: Top5FornecedoresRankingOptimizedProps) {
  
  const [categoriaSelecionadaLocal, setCategoriaSelecionadaLocal] = useState(categoriaSelecionada)
  
  const {
    fornecedores: fornecedoresRaw,
    hasValidData,
    cacheStatus,
    isLoading
  } = useUnifiedRankingData()
  
  const {
    getCategorias,
    shouldShowCacheIndicator,
    getCacheStatusMessage,
    reprocessarFornecedores
  } = useUnifiedCache()
  
  const categoriasDisponiveis = useMemo(() => {
    return categorias || getCategorias()
  }, [categorias, getCategorias])
  
  const { fornecedoresFiltrados, volumeTotalFiltrado } = useMemo(() => {
    if (!fornecedoresRaw || fornecedoresRaw.length === 0) {
      return { fornecedoresFiltrados: [], volumeTotalFiltrado: 0 }
    }
    
    const fornecedoresConvertidos: FornecedorRanking[] = fornecedoresRaw.map(f => ({
      nome: f.nome || 'Nome não informado',
      cnpj: f.cnpj,
      valor: f.totalRecebido || f.totalTransacionado || 0,
      numeroTransacoes: f.numeroTransacoes || f.transacoes || 0,
      categoriaPrincipal: f.categoriaPrincipal || f.categorias?.[0] || 'Sem categoria',
      categorias: f.categorias || [],
      deputadosAtendidos: f.deputadosAtendidos?.length || 0
    }))
    
    let filtrados = fornecedoresConvertidos
    if (categoriaSelecionadaLocal !== 'todas' && categoriaSelecionadaLocal) {
      filtrados = fornecedoresConvertidos.filter(f => 
        f.categorias.includes(categoriaSelecionadaLocal) ||
        f.categoriaPrincipal === categoriaSelecionadaLocal
      )
    }
    
    const top5 = filtrados
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5)
    
    const volumeTotal = filtrados.reduce((sum, f) => sum + f.valor, 0)
    
    return {
      fornecedoresFiltrados: top5,
      volumeTotalFiltrado: volumeTotal
    }
  }, [fornecedoresRaw, categoriaSelecionadaLocal])
  
  const totalRef = totalReferencia || volumeTotalFiltrado
  
  const handleCategoriaChange = (novaCategoria: string) => {
    setCategoriaSelecionadaLocal(novaCategoria)
    onCategoriaChange?.(novaCategoria)
  }
  
  const handleReprocessar = async () => {
    try {
      await reprocessarFornecedores({
        ano: anoSelecionado || 'todos',
        mes: mesSelecionado || 'todos',
        forceRefresh: true
      })
    } catch (error) {
      console.error('Erro ao reprocessar fornecedores:', error)
    }
  }
  
  const formatarValor = (valor: number) => {
    if (monetaryFormat === 'with-cents') {
      return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }
    return `R$ ${Math.round(valor).toLocaleString('pt-BR')}`
  }
  
  const tituloFinal = title || `Top 5 Fornecedores${categoriaSelecionadaLocal !== 'todas' ? ` - ${categoriaSelecionadaLocal}` : ''}`
  const descricaoFinal = description || `Ranking dos maiores fornecedores${hasValidData ? ' (dados em cache otimizado)' : ''}`
  
  return (
    <div className="space-y-4">
      {/* Header com indicador de cache */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold">{tituloFinal}</CardTitle>
            <CardDescription>{descricaoFinal}</CardDescription>
            
            {/* Indicador de cache */}
            {shouldShowCacheIndicator() && (
              <div className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md inline-block mt-2">
                {getCacheStatusMessage()}
              </div>
            )}
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-2">
            {!hasValidData && (
              <Button 
                onClick={handleReprocessar}
                disabled={isLoading}
                variant="outline"
                size="sm"
              >
                <Zap className="h-4 w-4 mr-2" />
                {isLoading ? 'Processando...' : 'Carregar Dados'}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {/* Seletor de categoria */}
      {categorySelectMode === 'dropdown' && categoriasDisponiveis.length > 0 && (
        <div className="px-6">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Categoria:</span>
            </div>
            
            <Select value={categoriaSelecionadaLocal} onValueChange={handleCategoriaChange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Selecione categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categoriasDisponiveis.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {categoriaSelecionadaLocal !== 'todas' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCategoriaChange('todas')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
      
      {/* Lista de fornecedores */}
      <div className="px-6 pb-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                  <div className="space-y-1">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                    <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : fornecedoresFiltrados.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {emptyMessage || `Nenhum fornecedor encontrado${categoriaSelecionadaLocal !== 'todas' ? ` para a categoria "${categoriaSelecionadaLocal}"` : ''}`}
            </p>
            {!hasValidData && (
              <Button 
                onClick={handleReprocessar}
                className="mt-4"
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Carregar Fornecedores
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {fornecedoresFiltrados.map((fornecedor, index) => {
              const percentual = totalRef > 0 ? (fornecedor.valor / totalRef) * 100 : 0
              const corCategoria = getCategoriaColor(fornecedor.categoriaPrincipal)
              
              return (
                <div 
                  key={`${fornecedor.cnpj || fornecedor.nome}-${index}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {/* Posição */}
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: corCategoria }}
                    >
                      {index + 1}
                    </div>
                    
                    <div className="space-y-1">
                      {/* Nome do fornecedor */}
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 truncate max-w-[200px]">
                          {fornecedor.nome}
                        </span>
                        
                        {fornecedor.cnpj && (
                          <Link 
                            to="/gastos/fornecedor/$cnpj"
                            params={{ cnpj: fornecedor.cnpj }}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                      
                      {/* Metadados */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{fornecedor.categoriaPrincipal}</span>
                        <span>{fornecedor.numeroTransacoes} transações</span>
                        {showDeputadosCount && (
                          <span>{fornecedor.deputadosAtendidos} deputados</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Valor e percentual */}
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatarValor(fornecedor.valor)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentual.toFixed(1)}% {labelPercentual}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}