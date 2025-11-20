import type { Metadata } from 'next'
import ConfiguracoesPageClient from './ConfiguracoesPageClient'

export const metadata: Metadata = {
  title: 'Configurações • Monitor de Gastos',
  description: 'Preferências de exibição e análise.',
}

export default function ConfiguracoesPage() {
  return <ConfiguracoesPageClient />
}