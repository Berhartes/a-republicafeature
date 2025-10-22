import Head from 'next/head'
import { useRouter } from 'next/router'

import { PerfilDeputadoModular } from '@/client/pages/PerfilDeputadoModular'

export default function PerfilDeputadoModularPage() {
  const router = useRouter()
  const rawId = router.query.deputadoId
  const deputadoId = Array.isArray(rawId) ? rawId[0] : rawId
  const title = deputadoId ? `Perfil Modular • ${deputadoId}` : 'Perfil Modular do Deputado'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <PerfilDeputadoModular />
    </>
  )
}
