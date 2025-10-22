import Head from 'next/head'
import { useRouter } from 'next/router'

import { PerfilFornecedorModular } from '@/client/pages/PerfilFornecedorModular'

export default function PerfilFornecedorModularPage() {
  const router = useRouter()
  const rawCnpj = router.query.cnpj
  const cnpj = Array.isArray(rawCnpj) ? rawCnpj[0] : rawCnpj
  const title = cnpj ? `Perfil Modular do Fornecedor • ${cnpj}` : 'Perfil Modular do Fornecedor'

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <PerfilFornecedorModular />
    </>
  )
}
