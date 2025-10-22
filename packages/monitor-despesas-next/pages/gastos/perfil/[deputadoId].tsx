import Head from 'next/head'
import { useRouter } from 'next/router'

import PerfilDeputado from '@/client/pages/PerfilDeputado'

export default function PerfilDeputadoPage() {
  const router = useRouter()
  const rawId = router.query.deputadoId
  const deputadoId = Array.isArray(rawId) ? rawId[0] : rawId
  const title = deputadoId ? `Perfil do Deputado • ${deputadoId}` : 'Perfil do Deputado'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <PerfilDeputado />
    </>
  )
}
