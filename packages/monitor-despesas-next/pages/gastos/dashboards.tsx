import Head from 'next/head'
import { useRouter } from 'next/router'

import { Dashboard } from '@/client/pages/Dashboard'

export default function DashboardsPage() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Dashboard • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <Dashboard onViewProfile={(deputadoId) => router.push(`/gastos/perfil/${deputadoId ?? 'geral'}`)} />
        </main>
      </div>
    </>
  )
}
