import Head from 'next/head'

import PremiacoesPageModular from '@/client/pages/PremiacoesPageModular'

export default function Premiacoes() {
  return (
    <>
      <Head>
        <title>Premiações • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <PremiacoesPageModular />
        </main>
      </div>
    </>
  )
}
