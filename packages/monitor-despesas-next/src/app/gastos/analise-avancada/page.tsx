import type { Metadata } from 'next'
import { DashboardComponentsPageClient } from '../dashboardcomponents/DashboardComponentsPageClient'

export const metadata: Metadata = {
  title: 'Análise Avançada • Monitor de Gastos',
  description: 'Componentes e ferramentas avançadas de análise.',
}

export default function AnaliseAvancadaPage() {
  return <DashboardComponentsPageClient />
}