import Head from 'next/head'

import ProcessadorFornecedores from '@/client/pages/ProcessadorFornecedores'

export default function ProcessadorFornecedoresPage() {
  return (
    <>
      <Head>
        <title>Processador de Fornecedores • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <ProcessadorFornecedores />
        </main>
      </div>
    </>
  )
}
