import Head from 'next/head'

import { ListaDeputados } from '@/client/pages/ListaDeputados'

export default function Deputados() {
  return (
    <>
      <Head>
        <title>Deputados • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <ListaDeputados />
        </main>
      </div>
    </>
  )
}
