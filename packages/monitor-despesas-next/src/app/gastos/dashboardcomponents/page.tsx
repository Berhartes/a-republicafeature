import type { Metadata } from 'next'

import { DashboardComponentsPageClient } from './DashboardComponentsPageClient'

export const metadata: Metadata = {
  title: 'Showcase de Componentes • Monitor de Gastos',
  description: 'Visualize e teste todos os componentes do design system do Monitor de Gastos.',
}

// Force dynamic rendering (avoid static generation issues)
export const dynamic = 'force-dynamic'

export default function DashboardComponentsPage() {
  return <DashboardComponentsPageClient />
}
