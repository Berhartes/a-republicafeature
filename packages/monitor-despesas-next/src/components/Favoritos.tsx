import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Star, StarOff, TrendingUp, AlertTriangle, Eye, Download, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { ExportDialog } from '@/components/export/ExportDialog'

interface DeputadoFavorito {
  nomeEleitoral: string
  siglaPartido: string
  siglaUf: string
  totalGasto: number
  scoreSuspeicao: number
  numAlertas: number
  dataAdicionado: string
}

interface FavoritosProps {
  onSelectDeputado: (deputado: any) => void
}

export function Favoritos({ onSelectDeputado }: FavoritosProps) {
  const [favoritos, setFavoritos] = useState<DeputadoFavorito[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const favoritosSalvos = localStorage.getItem('deputados-favoritos')
    if (favoritosSalvos) {
      setFavoritos(JSON.parse(favoritosSalvos))
    }
  }, [])

  const removerFavorito = (nome: string) => {
    const novosFavoritos = favoritos.filter(f => f.nomeEleitoral !== nome)
    setFavoritos(novosFavoritos)
    localStorage.setItem('deputados-favoritos', JSON.stringify(novosFavoritos))
    
    toast({
      title: "Removido dos favoritos",
      description: `${nome} foi removido da lista de favoritos.`,
    })
  }

  const adicionarFavorito = (deputado: DeputadoFavorito) => {
    if (favoritos.find(f => f.nomeEleitoral === deputado.nomeEleitoral)) {
      toast({
        title: "Já está nos favoritos",
        description: `${deputado.nomeEleitoral} já está na sua lista de favoritos.`,
        variant: "destructive"
      })
      return
    }

    const novoFavorito = {
      ...deputado,
      dataAdicionado: new Date().toISOString()
    }

    const novosFavoritos = [...favoritos, novoFavorito]
    setFavoritos(novosFavoritos)
    localStorage.setItem('deputados-favoritos', JSON.stringify(novosFavoritos))

    toast({
      title: "Adicionado aos favoritos",
      description: `${deputado.nomeEleitoral} foi adicionado à lista de favoritos.`,
    })
  }

  if (typeof window !== 'undefined') {
    (window as any).adicionarFavorito = adicionarFavorito
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (favoritos.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Deputados Favoritos
          </CardTitle>
          <CardDescription>
            Acompanhe de perto os deputados de seu interesse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <StarOff className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum deputado favorito ainda.</p>
            <p className="text-sm mt-2">
              Clique na estrela nos cards de deputados para adicionar aos favoritos.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Deputados Favoritos ({favoritos.length})
            </CardTitle>
            <CardDescription>
              Acompanhe de perto os deputados de seu interesse
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <ExportDialog 
              data={{ favoritos }} 
              title="Exportar Favoritos"
            >
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </ExportDialog>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {favoritos.map((deputado, index) => (
            <div 
              key={index}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{deputado.nomeEleitoral}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {deputado.siglaPartido}-{deputado.siglaUf}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      R$ {(deputado.totalGasto / 1000).toFixed(1)}k
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {deputado.numAlertas} alertas
                    </span>
                    <span className={`font-medium ${getScoreColor(deputado.scoreSuspeicao)}`}>
                      Score: {deputado.scoreSuspeicao}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicionado em {new Date(deputado.dataAdicionado).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSelectDeputado(deputado)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver Perfil
                  </Button>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removerFavorito(deputado.nomeEleitoral)}
                    title="Remover dos favoritos"
                    aria-label="Remover dos favoritos"
                  >
                    <StarOff className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
