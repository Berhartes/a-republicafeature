import { NextResponse } from 'next/server'
import { getTopDeputadosPorCategoria } from '@/app/gastos/actions/data-actions'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const categoria = searchParams.get('categoria') || ''
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.max(1, Math.min(parseInt(limitParam, 10) || 10, 50)) : 10

  try {
    const { ranking } = await getTopDeputadosPorCategoria(categoria, limit)
    return NextResponse.json({ ranking })
  } catch (err) {
    return NextResponse.json({ ranking: [], error: 'failed' }, { status: 500 })
  }
}