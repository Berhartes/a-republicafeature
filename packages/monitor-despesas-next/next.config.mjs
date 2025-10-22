const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false
  },
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts'],
      '.cjs': ['.cjs', '.cts'],
      '.jsx': ['.jsx', '.tsx']
    }
    return config
  }
}

export default nextConfig
