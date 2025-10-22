import Head from 'next/head'

import { FornecedoresPageModular } from '@/client/pages/FornecedoresPageModular'

export default function FornecedoresModularPage() {
  return (
    <>
      <Head>
        <title>Fornecedores Modular • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <FornecedoresPageModular />
        </main>
      </div>
    </>
  )
}
