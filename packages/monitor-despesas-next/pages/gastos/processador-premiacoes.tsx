import Head from 'next/head'

import ProcessadorPremiacoes from '@/client/pages/ProcessadorPremiacoes'

export default function ProcessadorPremiacoesPage() {
  return (
    <>
      <Head>
        <title>Processador de Premiações • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <ProcessadorPremiacoes />
        </main>
      </div>
    </>
  )
}
