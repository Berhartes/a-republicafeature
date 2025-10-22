import Head from 'next/head'

import { AnaliseAvancadaPage } from '@/client/pages/AnaliseAvancadaPage'

export default function AnaliseAvancada() {
  return (
    <>
      <Head>
        <title>Análise Avançada • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <AnaliseAvancadaPage />
        </main>
      </div>
    </>
  )
}
