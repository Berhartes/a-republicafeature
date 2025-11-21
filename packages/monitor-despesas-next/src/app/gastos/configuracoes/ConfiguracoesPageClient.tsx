"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'

export default function ConfiguracoesPageClient() {
  const { configuracoes, salvarConfiguracoes, resetConfiguracoes } = useConfiguracoes()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-4xl font-bold mb-8">Configurações</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              className="px-4 py-2 rounded-md border"
              onClick={() => salvarConfiguracoes({ temaEscuro: !configuracoes.temaEscuro })}
            >
              {configuracoes.temaEscuro ? 'Desativar tema escuro' : 'Ativar tema escuro'}
            </button>
            <button className="px-4 py-2 rounded-md border" onClick={resetConfiguracoes}>
              Restaurar padrão
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}