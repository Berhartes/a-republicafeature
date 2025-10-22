import Head from 'next/head'

import { ConfiguracoesPage } from '@/client/pages/ConfiguracoesPage'

export default function Configuracoes() {
  return (
    <>
      <Head>
        <title>Configurações • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6 space-y-6">
          <ConfiguracoesPage />
        </main>
      </div>
    </>
  )
}
