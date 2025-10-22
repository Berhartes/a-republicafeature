import Head from 'next/head'

import FornecedoresPage from '@/client/pages/FornecedoresPage'

export default function Fornecedores() {
  return (
    <>
      <Head>
        <title>Fornecedores • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <FornecedoresPage />
        </main>
      </div>
    </>
  )
}
