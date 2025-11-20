import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { randomUUID as nodeRandomUUID } from 'node:crypto'

export function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers)

  if (!requestHeaders.get('x-request-id')) {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      nodeRandomUUID?.() ??
      `${Date.now()}-${Math.random()}`
    requestHeaders.set('x-request-id', id)
  }

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}