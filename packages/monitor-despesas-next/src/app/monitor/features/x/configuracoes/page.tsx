'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ConfiguracoesPage() {
  const [configuracoes, setConfiguracoes] = useState({ temaEscuro: false })
  const salvarConfiguracoes = (novo: any) => setConfiguracoes((c) => ({ ...c, ...novo }))
  const resetConfiguracoes = () => setConfiguracoes({ temaEscuro: false })

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


