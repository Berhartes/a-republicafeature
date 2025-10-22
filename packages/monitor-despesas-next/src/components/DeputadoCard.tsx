import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@tanstack/react-router'
import { User, MapPin, Eye, Star } from 'lucide-react'
import { useToast } from '@/hooks/useToast'
import { TooltipProvider } from '@/components/ui/tooltip'
import BadgesPremiacaoDeputado from '@/components/premiacoes/BadgesPremiacaoDeputado'
import { useState, useEffect, useCallback } from 'react'

interface DeputadoCardProps {
  id: string | number;
  nome: string;
  partido: string;
  uf?: string;
  foto?: string;
  totalGasto: number;
  ranking?: number;
  compact?: boolean;
  maxBadges?: number;
}

export function DeputadoCard({
  id,
  nome,
  partido,
  uf,
  foto,
  totalGasto,
  ranking,
  compact = false,
  maxBadges,
}: DeputadoCardProps) {
  const { toast } = useToast()
  const [isFavorited, setIsFavorited] = useState(false)

  useEffect(() => {
    const verificarFavorito = () => {
      try {
        const favoritosSalvos = localStorage.getItem('deputados-favoritos')
        if (favoritosSalvos) {
          const favoritos = JSON.parse(favoritosSalvos)
          const estaFavoritado = favoritos.some((f: any) => f.nomeEleitoral === nome)
          setIsFavorited(estaFavoritado)
        }
      } catch (error) {
        console.error('Erro ao verificar favoritos:', error)
      }
    }

    verificarFavorito()
  }, [nome])

  const formatarCategoria = (categoria: string) => {
    let categoriaFormatada = categoria.replace(/\.$/, '')
    const siglas = ['RPA', 'SIGEPA', 'GPS', 'TV', 'DVD', 'CD', 'USB', 'WIFI', 'VIP']
    
    categoriaFormatada = categoriaFormatada
      .toLowerCase()
      .split(' ')
      .map(palavra => {
        if (siglas.includes(palavra.toUpperCase())) {
          return palavra.toUpperCase()
        }
        const preposicoes = ['de', 'do', 'da', 'dos', 'das', 'e', 'ou', 'à', 'ao', 'em', 'no', 'na', 'por', 'para', 'com', 'sem', 'sob', 'sobre']
        if (preposicoes.includes(palavra.toLowerCase())) {
          return palavra.toLowerCase()
        }
        return palavra.charAt(0).toUpperCase() + palavra.slice(1)
      })
      .join(' ')
    
    if (categoriaFormatada.length > 0) {
      categoriaFormatada = categoriaFormatada.charAt(0).toUpperCase() + categoriaFormatada.slice(1)
    }
    
    return categoriaFormatada
      .replace(/\bRpa\b/g, 'RPA')
      .replace(/\bSigepa\b/g, 'SIGEPA')
      .replace(/\bTáxi\b/g, 'Táxi')
      .replace(/\bPedágio\b/g, 'Pedágio')
  }
  
  if (process.env.NODE_ENV === 'development' && totalGasto === undefined) {
    console.warn(`DeputadoCard: totalGasto is undefined for ${nome}`)
  }
  
  const toggleFavorito = useCallback(() => {
    const deputado = {
      nome,
      partido,
      uf,
      totalGasto,
    }

    try {
      const favoritosSalvos = localStorage.getItem('deputados-favoritos')
      const favoritos = favoritosSalvos ? JSON.parse(favoritosSalvos) : []

      const jaEstaFavoritado = favoritos.find((f: any) => f.nomeEleitoral === nome)

      if (!jaEstaFavoritado) {
        favoritos.push({
          ...deputado,
          dataAdicionado: new Date().toISOString()
        })
        localStorage.setItem('deputados-favoritos', JSON.stringify(favoritos))
        setIsFavorited(true)

        window.dispatchEvent(new StorageEvent('storage', {
          key: 'deputados-favoritos',
          newValue: JSON.stringify(favoritos)
        }))

        toast({
          title: "Adicionado aos favoritos",
          description: `${nome} foi adicionado à lista de favoritos.`,
        })

        if (typeof window !== 'undefined' && (window as any).adicionarFavorito) {
          (window as any).adicionarFavorito(deputado)
        }
      } else {
        const novosFavoritos = favoritos.filter((f: any) => f.nomeEleitoral !== nome)
        localStorage.setItem('deputados-favoritos', JSON.stringify(novosFavoritos))
        setIsFavorited(false)

        window.dispatchEvent(new StorageEvent('storage', {
          key: 'deputados-favoritos',
          newValue: JSON.stringify(novosFavoritos)
        }))

        toast({
          title: "Removido dos favoritos",
          description: `${nome} foi removido da lista de favoritos.`,
        })
      }
    } catch (error) {
      console.error('Erro ao gerenciar favoritos:', error)
      toast({
        title: "Erro",
        description: "Erro ao gerenciar favoritos. Tente novamente.",
        variant: "destructive"
      })
    }
  }, [nome, partido, uf, totalGasto, toast])

  if (compact) {
    return (
      <Link to={`/gastos/perfil/${String(id)}`} className="block">
        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-all hover:shadow-md">
          <div className="flex items-center gap-3">
            {foto ? (
              <img 
                src={foto} 
                alt={nome}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <div>
              <p className="font-medium">{nome}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{partido}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {uf}
                </span>
              </div>
              {/* Badges de Premiação - Sistema Unificado */}
              <div className="mt-1">
                <BadgesPremiacaoDeputado 
                  deputadoId={String(id)}
                  deputadoNome={nome}
                  size="sm"
                  maxBadges={maxBadges || 4}
                  showCounter={true}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Ver perfil de ${nome}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <TooltipProvider>
      <Card 
        className={`relative overflow-hidden transition-all hover:shadow-lg cursor-pointer ${
          ranking === 1 ? 'ring-2 ring-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' :
          ranking === 2 ? 'ring-2 ring-gray-400 bg-gradient-to-r from-gray-50 to-slate-50' :
          ranking === 3 ? 'ring-2 ring-amber-600 bg-gradient-to-r from-amber-50 to-yellow-50' :
          'hover:bg-gray-50'
        }`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Foto do deputado */}
              {foto ? (
                <img 
                  src={foto} 
                  alt={nome}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center border-2 border-white shadow-md">
                  <User className="h-8 w-8 text-gray-500" />
                </div>
              )}
              
              {/* Informações do deputado */}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-lg text-gray-900">{nome}</h3>
                    {/* Ranking badge se disponível */}
                    {ranking && ranking <= 3 && (
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-sm ${
                        ranking === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                        ranking === 2 ? 'bg-gradient-to-r from-gray-400 to-slate-500' :
                        'bg-gradient-to-r from-amber-600 to-yellow-600'
                      }`}>
                        {ranking === 1 ? '🥇' : ranking === 2 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <span className="font-medium">{partido}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {uf}
                  </span>
                  {ranking && (
                    <>
                      <span>•</span>
                      <span>#{ranking}</span>
                    </>
                  )}
                </div>
                
                {/* Badges de Premiação alinhadas com as informações */}
                <div className="flex items-center mt-2">
                  <BadgesPremiacaoDeputado 
                    deputadoId={String(id)}
                    deputadoNome={nome}
                    size="md"
                    maxBadges={maxBadges || 4}
                    showCounter={true}
                  />
                </div>
              </div>
            </div>
            
            {/* Botões e ações */}
            <div className="text-right flex flex-col justify-between h-full">
              {/* Estrela de favoritar no topo */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFavorito}
                  aria-label={isFavorited ? `Remover ${nome} dos favoritos` : `Adicionar ${nome} aos favoritos`}
                  className="p-2"
                >
                  <Star
                    className={`h-4 w-4 ${isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`}
                    aria-hidden="true"
                  />
                </Button>
              </div>
              
              {/* Ver Perfil bem na parte inferior */}
              <div className="mt-auto pt-4">
                <Link to={`/gastos/perfil/${String(id)}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                    aria-label={`Ver perfil de ${nome}`}
                  >
                    <Eye className="h-4 w-4 mr-2" aria-hidden="true" />
                    Ver Perfil
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Barra de progresso visual */}
          {(ranking && ranking <= 10) && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    ranking === 1 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                    ranking === 2 ? 'bg-gradient-to-r from-gray-400 to-slate-500' :
                    ranking === 3 ? 'bg-gradient-to-r from-amber-600 to-yellow-600' :
                    'bg-gradient-to-r from-blue-500 to-indigo-600'
                  }`}
                  style={{ width: `${Math.max(100 - (ranking - 1) * 10, 10)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </TooltipProvider>
  )
}
