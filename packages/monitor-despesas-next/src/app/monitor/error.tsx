'use client'

import { useEffect } from 'react'
import { createLogger } from '@/lib/logger'

const log = createLogger('app:error')

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    log.error('App Error Boundary', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-6 text-destructive">
        <h2 className="mb-2 text-lg font-semibold">Algo deu errado</h2>
        <p className="mb-4 text-sm">Tente novamente ou volte mais tarde.</p>
        <button
          className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          onClick={() => reset()}
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}


