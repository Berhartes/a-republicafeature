import Head from 'next/head'
import { useRouter } from 'next/router'

import PerfilFornecedor from '@/client/pages/PerfilFornecedor'

export default function PerfilFornecedorPage() {
  const router = useRouter()
  const rawCnpj = router.query.cnpj
  const cnpj = Array.isArray(rawCnpj) ? rawCnpj[0] : rawCnpj
  const title = cnpj ? `Perfil do Fornecedor • ${cnpj}` : 'Perfil do Fornecedor'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <PerfilFornecedor />
    </>
  )
}
