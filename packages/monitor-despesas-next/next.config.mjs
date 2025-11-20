import bundleAnalyzer from '@next/bundle-analyzer'
import path from 'path'
import { fileURLToPath } from 'url'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode is enabled to detect potential problems in the application.
  reactStrictMode: true,

  // We don't ignore TypeScript errors during the build anymore.
  typescript: {
    ignoreBuildErrors: false,
  },

  // Explicit Turbopack acknowledgement (Next.js 16 default)
  turbopack: {},

  // Experimental features are left at their default values.
  experimental: {},

  // Images optimization
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Headers for better caching
  async headers() {
    return [
      {
        source: '/cache/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },

  async redirects() {
    return [
      {
        source: '/gastos/deputados',
        destination: '/monitor/deputados',
        permanent: true,
      },
    ]
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'production' ? 'true' : 'false',
  },

  // Powering the app with better performance in production
  poweredByHeader: false,

  outputFileTracingRoot: path.join(__dirname, '../../'),
  outputFileTracingIncludes: {
    '/*': [
      '../bancoDados/monitordespesas/congressoNacional/cache/deputados-cache.json',
      '../bancoDados/monitordespesas/congressoNacional/cache/analise-cache.json',
      '../bancoDados/monitordespesas/congressoNacional/cache/suppliers-cache.json',
      '../bancoDados/monitordespesas/congressoNacional/cache/premiacoes-cache.json',
    ],
  },
}

export default withBundleAnalyzer(nextConfig)
