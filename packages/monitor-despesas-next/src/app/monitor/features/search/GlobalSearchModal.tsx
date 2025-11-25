import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, User, Building2, AlertTriangle, X, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrencyBRL } from '@/lib/formatters'
// import { categoryIcons } from './filters/category-icons' // Arquivo inexistente

interface SearchResult {
  tipo: 'deputado' | 'fornecedor' | 'alerta' | 'documento'
  titulo: string
  descricao: string
  valor?: number
  gravidade?: 'alta' | 'media' | 'baixa'
  onClick: () => void
}

interface BuscaGlobalProps {
  onSelectDeputado?: (deputado: any) => void
  onSelectFornecedor?: (fornecedor: any) => void
  onSelectAlerta?: (alerta: any) => void
}

export function GlobalSearchModal({
  onSelectDeputado,
  onSelectFornecedor,
  onSelectAlerta
}: BuscaGlobalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 100)
      }

      if (e.key === 'Escape') {
        setIsOpen(false)
      }

      if (isOpen && results.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % results.length)
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
        } else if (e.key === 'Enter') {
          e.preventDefault()
          results[selectedIndex]?.onClick()
          setIsOpen(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([])
      return
    }

    const mockResults: SearchResult[] = []

    const deputados = [
      { nomeEleitoral: 'General Pazuello', siglaPartido: 'PL', siglaUf: 'RJ', totalGasto: 49131.34 },
      { nomeEleitoral: 'Dilvanda Faro', siglaPartido: 'PT', siglaUf: 'PA', totalGasto: 85000.00 }
    ]

    deputados.forEach(dep => {
      if (dep.nomeEleitoral.toLowerCase().includes(searchTerm.toLowerCase())) {
        mockResults.push({
          tipo: 'deputado',
          titulo: dep.nomeEleitoral,
          descricao: `${dep.siglaPartido}-${dep.siglaUf}`,
          valor: dep.totalGasto,
          onClick: () => onSelectDeputado?.(dep)
        })
      }
    })

    if ('on-z'.includes(searchTerm.toLowerCase())) {
      mockResults.push({
        tipo: 'fornecedor',
        titulo: 'ON-Z IMPRESSÃO',
        descricao: 'CNPJ: 498.708.730/0014-4',
        valor: 272268.00,
        onClick: () => onSelectFornecedor?.({ nome: 'ON-Z IMPRESSÃO', categorias: ['DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR.'] })
      })
    }

    if ('superfaturamento'.includes(searchTerm.toLowerCase())) {
      mockResults.push({
        tipo: 'alerta',
        titulo: 'Superfaturamento em Combustível',
        descricao: 'Dilvanda Faro - R$ 8.500',
        gravidade: 'alta',
        onClick: () => onSelectAlerta?.({ tipo: 'SUPERFATURAMENTO' })
      })
    }

    setResults(mockResults.slice(0, 8))
    setSelectedIndex(0)
  }, [searchTerm, onSelectDeputado, onSelectFornecedor, onSelectAlerta])

  const getIcon = (result: SearchResult) => {
    if (result.tipo === 'fornecedor' && result.titulo) {
      const mainCategory = (result as any).categorias?.[0]
      // categoryIcons removido: arquivo não existe
    }
    switch (result.tipo) {
      case 'deputado': return User
      case 'fornecedor': return Building2
      case 'alerta': return AlertTriangle
      case 'documento': return FileText
      default: return Search
    }
  }

  return (
    <>
      {/* Botão de busca flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 p-3 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-all z-50"
        title="Busca Global (Ctrl+K)"
        aria-label="Abrir busca global (Ctrl+K)"
      >
        <Search className="h-5 w-5" />
      </button>

      {/* Modal de busca */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl p-4" ref={searchRef}>
            <Card className="overflow-hidden">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="busca-global"
                  name="busca-global"
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar deputados, fornecedores, alertas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-12 py-6 text-lg border-0 focus:ring-0"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  aria-label="Fechar busca"
                >
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {results.length > 0 && (
                <div className="border-t">
                  <CardContent className="p-0">
                    {results.map((result, index) => {
                      const Icon = getIcon(result)
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            result.onClick()
                            setIsOpen(false)
                            setSearchTerm('')
                          }}
                          className={cn(
                            "w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left",
                            selectedIndex === index && "bg-gray-100"
                          )}
                        >
                          <div className="p-2 bg-gray-100 rounded">
                            <Icon className="h-4 w-4 text-gray-600" />
                          </div>

                          <div className="flex-1">
                            <p className="font-medium">{result.titulo}</p>
                            <p className="text-sm text-muted-foreground">{result.descricao}</p>
                          </div>

                          {typeof result.valor === 'number' && (
                            <div className="text-right">
                              <p className="font-medium">
                                {formatCurrencyBRL(result.valor)}
                              </p>
                            </div>
                          )}

                          {result.gravidade && (
                            <Badge
                              variant={
                                result.gravidade === 'alta' ? 'destructive' :
                                  result.gravidade === 'media' ? 'warning' : 'secondary'
                              }
                            >
                              {result.gravidade}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </CardContent>
                </div>
              )}

              {searchTerm && results.length === 0 && (
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum resultado encontrado para "{searchTerm}"
                </CardContent>
              )}

              {!searchTerm && (
                <CardContent className="py-6">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓</kbd>
                        Navegar
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                        Selecionar
                      </span>
                      <span className="flex items-center gap-1">
                        <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                        Fechar
                      </span>
                    </div>
                    <span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl</kbd>
                      +
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">K</kbd>
                    </span>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  )
}



