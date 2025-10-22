import Head from 'next/head'

import { CompararDeputados } from '@/client/pages/CompararDeputados'

export default function Comparar() {
  return (
    <>
      <Head>
        <title>Comparar Deputados • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <CompararDeputados />
        </main>
      </div>
    </>
  )
}
