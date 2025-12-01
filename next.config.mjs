/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false

    // Handle pdfjs-dist on client side only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }

    return config
  },
  // Ensure pdfjs-dist is not bundled for SSR
  experimental: {
    serverComponentsExternalPackages: ['pdfjs-dist'],
  },
}

export default nextConfig
