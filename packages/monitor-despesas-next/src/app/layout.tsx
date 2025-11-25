import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: 'A República • Catálogo de Features',
    description: 'Biblioteca de features e ferramentas do projeto A República.',
}

export const viewport: Viewport = {
    themeColor: '#111827',
    colorScheme: 'light',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body className="min-h-screen bg-background text-foreground antialiased">
                {children}
            </body>
        </html>
    )
}
