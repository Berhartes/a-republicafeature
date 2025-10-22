import Head from 'next/head'

import { DebugPage } from '@/client/pages/DebugPage'

export default function Debug() {
  return (
    <>
      <Head>
        <title>Debug • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6 space-y-6">
          <DebugPage />
        </main>
      </div>
    </>
  )
}
