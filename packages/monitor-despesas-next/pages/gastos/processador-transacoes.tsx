import Head from 'next/head'

import ProcessadorTransacoes from '@/client/pages/ProcessadorTransacoes'

export default function ProcessadorTransacoesPage() {
  return (
    <>
      <Head>
        <title>Processador de Transações • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <ProcessadorTransacoes />
        </main>
      </div>
    </>
  )
}
