import Head from 'next/head'
import { useRouter } from 'next/router'

import { AlertasPage } from '@/client/pages/AlertasPage'

export default function Alertas() {
  const router = useRouter()

  return (
    <>
      <Head>
        <title>Alertas • Monitor de Gastos</title>
      </Head>
      <div className="min-h-screen bg-background">
        <main className="container mx-auto py-6">
          <AlertasPage onViewProfile={(deputadoId) => router.push(`/gastos/perfil/${deputadoId ?? 'geral'}`)} />
        </main>
      </div>
    </>
  )
}
