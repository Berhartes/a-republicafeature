import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function FornecedoresCategoriasRedirect() {
  const router = useRouter()
  const categoria = typeof router.query.categoria === 'string' ? router.query.categoria : ''

  useEffect(() => {
    if (!router.isReady) return
    if (!categoria) return

    router.replace(`/gastos/categorias/${categoria}`)
  }, [categoria, router])

  return <span className="sr-only">Redirecionando...</span>
}
