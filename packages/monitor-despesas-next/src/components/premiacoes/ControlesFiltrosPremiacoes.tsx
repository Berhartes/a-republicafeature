
import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Zap, Filter, Settings, Calculator, RotateCcw, TestTube, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface ControlesFiltrosPremiacoesProps {
  calculando: boolean
  loading: boolean
  temPremiacoes: boolean
  usandoCache: boolean
  
  anoSelecionado: string
  categoriaSelecionada: string
  categoriasDisponiveis: string[]
  
  onCalcularPremiacoes: () => void
  onAtualizarRankings: () => void
  onTestarCategorias: () => void
  onLimparCache: () => void
  onAnoChange: (ano: string) => void
  onCategoriaChange: (categoria: string) => void
}

export function ControlesFiltrosPremiacoes({
  calculando,
  loading,
  temPremiacoes,
  usandoCache,
  anoSelecionado,
  categoriaSelecionada,
  categoriasDisponiveis,
  onCalcularPremiacoes,
  onAtualizarRankings,
  onTestarCategorias,
  onLimparCache,
  onAnoChange,
  onCategoriaChange
}: ControlesFiltrosPremiacoesProps) {
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const { toast } = useToast()
  
  const anosDisponiveis = useMemo(() => {
    const anoAtual = new Date().getFullYear()
    return Array.from({ length: 11 }, (_, i) => anoAtual - i)
  }, [])

  const handleCalcularPremiacoes = useCallback(async () => {
    toast({
      title: "Calculando Premiações",
      description: "Recalculando premiações de todos os deputados...",
    })
    onCalcularPremiacoes()
  }, [toast, onCalcularPremiacoes])

  const handleAtualizarRankings = useCallback(() => {
    toast({
      title: "Atualizando Rankings",
      description: "Força atualização de rankings...",
    })
    onAtualizarRankings()
  }, [toast, onAtualizarRankings])

  const handleTestarCategorias = useCallback(() => {
    toast({
      title: "Testando Categorias",
      description: "Executando testes de categorias...",
    })
    onTestarCategorias()
  }, [toast, onTestarCategorias])

  const handleLimparCache = useCallback(() => {
    toast({
      title: "Limpando Cache",
      description: "Cache será limpo...",
    })
    onLimparCache()
  }, [toast, onLimparCache])

  return (
    <>
      {/* Cabeçalho com Controles Principais */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">🏆 Sistema de Premiações</h1>
          <p className="text-sm text-muted-foreground">
            Rankings, filtros e controle central de premiações dos deputados
          </p>
        </div>
        
        {/* Botão de Engrenagem */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdminPanel(!showAdminPanel)}
            className="hover:bg-gray-100"
          >
            <Settings className="w-4 h-4" />
          </Button>
          
          {/* Painel Admin */}
          {showAdminPanel && (
            <div className="absolute right-0 top-10 bg-white border rounded-lg shadow-lg p-2 z-50 min-w-52">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={handleCalcularPremiacoes}
                  disabled={calculando}
                >
                  <Calculator className="w-3 h-3 mr-2" />
                  {calculando ? 'Calculando...' : 'Calcular Premiações'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={handleAtualizarRankings}
                  disabled={loading}
                >
                  <RotateCcw className="w-3 h-3 mr-2" />
                  {loading ? 'Atualizando...' : 'Atualizar Rankings'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={handleTestarCategorias}
                >
                  <TestTube className="w-3 h-3 mr-2" />
                  Testar Categorias
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleLimparCache}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Limpar Cache
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card de Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Controles
          </CardTitle>
          <CardDescription>
            Selecione período e categoria para visualizar rankings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Ano:</label>
              <Select value={anoSelecionado} onValueChange={onAnoChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Categoria:</label>
              <Select value={categoriaSelecionada} onValueChange={onCategoriaChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas as categorias</SelectItem>
                  {categoriasDisponiveis.map(categoria => (
                    <SelectItem key={categoria} value={categoria}>
                      {categoria.length > 25 ? categoria.substring(0, 25) + '...' : categoria}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {usandoCache && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Usando cache
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}

export default ControlesFiltrosPremiacoes