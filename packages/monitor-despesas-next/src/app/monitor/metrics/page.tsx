export const revalidate = 3600

import { getCacheStats } from '@/app/gastos/actions/cache-actions'

export default async function MetricsPage() {
  const stats = await getCacheStats()
  const entries = Array.isArray(stats) ? stats : []

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Métricas de Cache</h1>
      <div className="mt-4 space-y-3">
        {entries.length === 0 && (
          <p className="text-sm text-muted-foreground">Sem métricas registradas</p>
        )}
        {entries.map(({ key, stats }) => (
          <div key={key} className="border rounded p-3">
            <div className="text-sm font-medium">{key}</div>
            {stats ? (
              <ul className="text-sm mt-2">
                <li>Hits: {stats.hits}</li>
                <li>Misses: {stats.misses}</li>
                <li>Hit Rate: {stats.hitRate.toFixed(1)}%</li>
                <li>Última Fonte: {stats.lastSource ?? 'N/A'}</li>
                <li>Latência (ms): {stats.lastLatencyMs ?? 'N/A'}</li>
                <li>Tamanho (bytes): {stats.lastSizeBytes ?? 'N/A'}</li>
              </ul>
            ) : (
              <div className="text-sm">Sem dados</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
