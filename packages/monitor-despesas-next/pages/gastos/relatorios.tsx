import Head from 'next/head'

import { RelatoriosPage } from '@/client/pages/RelatoriosPage'

export default function Relatorios() {
  return (
    <>
      <Head>
        <title>Relatórios • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <RelatoriosPage />
        </main>
      </div>
    </>
  )
}
