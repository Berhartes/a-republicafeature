'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[fornecedores:error]', error)
  }, [error])

  return (
    <div className="flex h-64 items-center justify-center">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-destructive">
        <p className="text-sm">Falha ao carregar fornecedores.</p>
        <button
          className="mt-2 rounded bg-primary px-3 py-1 text-primary-foreground hover:bg-primary/90"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
