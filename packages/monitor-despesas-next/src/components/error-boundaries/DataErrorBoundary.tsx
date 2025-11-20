"use client"

import { Suspense, type ReactNode } from 'react'
import { DataErrorBoundaryClient } from './DataErrorBoundaryClient'

function DataErrorBoundaryFallback() {
  return (
    <div className="rounded-md border border-muted/50 bg-muted/20 p-4 text-sm text-muted-foreground">
      Carregando dados...
    </div>
  )
}

export function DataErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<DataErrorBoundaryFallback />}>
      <DataErrorBoundaryClient metadata={null}>{children}</DataErrorBoundaryClient>
    </Suspense>
  )
}

export default DataErrorBoundary
