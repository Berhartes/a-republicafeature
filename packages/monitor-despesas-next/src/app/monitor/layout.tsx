import type { Metadata, Viewport } from 'next'


import { AppProviders } from './providers'

export const metadata: Metadata = {
  title: 'Monitor de Gastos • A República',
  description: 'Transparência e análise inteligente dos gastos parlamentares brasileiros.',
  keywords: ['gastos parlamentares', 'transparência', 'deputados', 'fornecedores', 'Brasil'],
  openGraph: {
    title: 'Monitor de Gastos • A República',
    description: 'Transparência e análise inteligente dos gastos parlamentares brasileiros.',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'A República',
    type: 'website',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Monitor de Gastos • A República',
    description: 'Transparência e análise inteligente dos gastos parlamentares brasileiros.',
  },
}

export const viewport: Viewport = {
  themeColor: '#111827',
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProviders>{children}</AppProviders>
  )
}



