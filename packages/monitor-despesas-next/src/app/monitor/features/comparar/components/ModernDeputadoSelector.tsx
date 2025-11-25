'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface DeputadoResumo {
    id: string
    nomeEleitoral: string
    siglaPartido: string
    siglaUf: string
    urlFoto?: string
}

interface ModernDeputadoSelectorProps {
    todosDeputados: DeputadoResumo[]
    selectedIds: string[]
    onSelect: (id: string) => void
    onRemove: (id: string) => void
    maxSelections?: number
}

export default function ModernDeputadoSelector({
    todosDeputados,
    selectedIds,
    onSelect,
    onRemove,
    maxSelections = 4
}: ModernDeputadoSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState("")

    const selectedDeputados = React.useMemo(() => {
        return selectedIds.map(id => todosDeputados.find(d => d.id.toString() === id)).filter(Boolean) as DeputadoResumo[]
    }, [selectedIds, todosDeputados])

    const availableDeputados = React.useMemo(() => {
        const selectedSet = new Set(selectedIds)
        return todosDeputados.filter(d => !selectedSet.has(d.id.toString()))
    }, [todosDeputados, selectedIds])

    const filteredDeputados = React.useMemo(() => {
        if (!search) return availableDeputados
        const lower = search.toLowerCase()
        return availableDeputados.filter(d =>
            d.nomeEleitoral.toLowerCase().includes(lower) ||
            d.siglaPartido.toLowerCase().includes(lower) ||
            d.siglaUf.toLowerCase().includes(lower)
        )
    }, [availableDeputados, search])

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {selectedDeputados.map((dep) => (
                    <div
                        key={dep.id}
                        className="flex items-center gap-3 p-2 pr-3 bg-card border rounded-full shadow-sm animate-in fade-in zoom-in duration-200"
                    >
                        <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={dep.urlFoto} alt={dep.nomeEleitoral} />
                            <AvatarFallback>{dep.nomeEleitoral.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none">{dep.nomeEleitoral}</span>
                            <span className="text-[10px] text-muted-foreground">{dep.siglaPartido}-{dep.siglaUf}</span>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-full ml-1 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => onRemove(dep.id.toString())}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}

                {selectedIds.length < maxSelections && (
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className="h-[58px] rounded-full px-6 border-dashed border-2 hover:border-primary hover:bg-primary/5"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Adicionar Deputado
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[300px]" align="start">
                            <Command>
                                <CommandInput
                                    placeholder="Buscar deputado..."
                                    value={search}
                                    onChange={(e: any) => setSearch(e.target.value)}
                                />
                                <CommandList>
                                    {filteredDeputados.length === 0 && <CommandEmpty>Nenhum deputado encontrado.</CommandEmpty>}
                                    <CommandGroup>
                                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sugestões</div>
                                        {filteredDeputados.slice(0, 50).map((dep) => (
                                            <div
                                                key={dep.id}
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                onClick={() => {
                                                    onSelect(dep.id.toString())
                                                    setOpen(false)
                                                    setSearch("")
                                                }}
                                            >
                                                <Avatar className="h-6 w-6 mr-2">
                                                    <AvatarImage src={dep.urlFoto} />
                                                    <AvatarFallback>{dep.nomeEleitoral[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{dep.nomeEleitoral}</span>
                                                    <span className="text-[10px] text-muted-foreground">{dep.siglaPartido}-{dep.siglaUf}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {selectedIds.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Plus className="h-8 w-8 opacity-50" />
                        <p>Selecione até {maxSelections} deputados para iniciar a comparação</p>
                    </div>
                </div>
            )}
        </div>
    )
}



