import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Download, Share2, RefreshCw, AlertTriangle } from 'lucide-react'
import { getCategoriaIcon } from '@/components/premiacoes/utils/categoria-icons'

const limparTituloCategoria = (categoria: string): string => {
  if (!categoria) return 'Categoria'
  
  try {
    let decoded = decodeURIComponent(categoria)
    
    decoded = decoded
      .replace(/%C3%87/g, 'Ç')
      .replace(/%C3%83/g, 'Ã')
      .replace(/%C3%8D/g, 'Í')
      .replace(/%C3%95/g, 'Õ')
      .replace(/%C3%9A/g, 'Ú')
      .replace(/%C3%A7/g, 'ç')
      .replace(/%C3%A3/g, 'ã')
      .replace(/%C3%AD/g, 'í')
      .replace(/%C3%B5/g, 'õ')
      .replace(/%C3%BA/g, 'ú')
      .replace(/%20/g, ' ')
      .replace(/\+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return decoded
  } catch (error) {
    console.warn('Erro ao limpar título da categoria:', error)
    return categoria
  }
}

interface CategoriaHeaderProps {
  categoria: string
  categoriaSlug: string
  estatisticasCategoria: any
  loading: boolean
  erro: string | null
  onRefresh: () => void
  onExport: () => void
  onShare: () => void
}

export function CategoriaHeader({
  categoria,
  categoriaSlug,
  estatisticasCategoria,
  loading,
  erro,
  onRefresh,
  onExport,
  onShare
}: CategoriaHeaderProps) {
  const tituloLimpo = limparTituloCategoria(categoria)
  const IconeCategoria = getCategoriaIcon(categoria)
  
  

  return (
    <div className="space-y-6">
      {/* Título e Controles */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <IconeCategoria className="h-8 w-8 text-blue-600" />
            {tituloLimpo}
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise detalhada de gastos por categoria
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              Slug: {categoriaSlug}
            </Badge>
            {estatisticasCategoria?.ranking && (
              <Badge variant="secondary">
                #{estatisticasCategoria.ranking} no ranking
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onShare}
            className="flex items-center gap-2"
          >
            <Share2 className="h-4 w-4" />
            Compartilhar
          </Button>
          
          <Button
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            onClick={onExport}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>


      {/* Alertas */}
      {erro && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <div className="font-medium text-red-800">Erro ao carregar dados</div>
                <div className="text-sm text-red-700">{erro}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <div>
                <div className="font-medium text-blue-800">Carregando dados da categoria...</div>
                <div className="text-sm text-blue-700">
                  Aguarde enquanto coletamos as informações mais atualizadas.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}