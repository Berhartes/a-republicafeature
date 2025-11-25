'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { DeputadoResumo } from '@a-republica/shared'

interface DeputadoSelectorProps {
  todosDeputados: DeputadoResumo[]
  deputadoIds: string[]
  onSelectChange: (index: number, deputadoId: string) => void
}

export default function DeputadoSelector({
  todosDeputados,
  deputadoIds,
  onSelectChange,
}: DeputadoSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[0, 1, 2, 3].slice(0, Math.max(2, deputadoIds.length)).map((index) => (
        <Select
          key={index}
          value={deputadoIds[index] || ''}
          onValueChange={(id) => onSelectChange(index, id)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Selecionar Deputado ${index + 1}...`} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="remover">Remover Comparação</SelectItem>
            {todosDeputados.map((dep) => (
              <SelectItem key={dep.id} value={dep.id.toString()}>
                {dep.nomeEleitoral} ({dep.siglaPartido}-{dep.siglaUf})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}
    </div>
  )
}



