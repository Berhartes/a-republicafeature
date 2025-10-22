import Head from 'next/head'

import SystemV4Demo from '@/client/pages/SystemV4Demo'

export default function PremiacoesAlternativas() {
  return (
    <>
      <Head>
        <title>Premiações 2 • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <SystemV4Demo />
        </main>
      </div>
    </>
  )
}
