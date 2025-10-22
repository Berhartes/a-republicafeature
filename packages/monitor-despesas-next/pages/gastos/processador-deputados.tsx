import Head from 'next/head'

import ProcessadorDeputados from '@/client/pages/ProcessadorDeputados'

export default function ProcessadorDeputadosPage() {
  return (
    <>
      <Head>
        <title>Processador de Deputados • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <ProcessadorDeputados />
        </main>
      </div>
    </>
  )
}
