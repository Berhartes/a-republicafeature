import Head from 'next/head'
import { useRouter } from 'next/router'

import { PerfilDeputadoModularV2 } from '@/client/pages/PerfilDeputadoModularV2'

export default function PerfilDeputadoModularV2Page() {
  const router = useRouter()
  const rawId = router.query.deputadoId
  const deputadoId = Array.isArray(rawId) ? rawId[0] : rawId
  const title = deputadoId ? `Perfil V2 • ${deputadoId}` : 'Perfil V2 do Deputado'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <PerfilDeputadoModularV2 />
    </>
  )
}
