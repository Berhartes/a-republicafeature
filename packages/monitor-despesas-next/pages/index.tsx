import Head from 'next/head'

import { Dashboard } from '@/client/pages/Dashboard'

export default function HomePage() {
  return (
    <>
      <Head>
        <title>Monitor de Gastos Parlamentares</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <Dashboard />
        </main>
      </div>
    </>
  )
}
