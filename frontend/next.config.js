/** @type {import('next').NextConfig} */

// BUILD_TARGET=android produces a fully static export in `out/` that Capacitor
// packages into the Android app. Static export cannot use headers(), so those
// are only applied to the normal (Vercel / `next start`) build.
const isStaticExport = process.env.BUILD_TARGET === 'android'

const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,

  ...(isStaticExport && {
    output: 'export',
    // Each route becomes <route>/index.html, which the Android WebView can load directly.
    trailingSlash: true,
  }),

  // Remove console.log in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Optimize large package imports for smaller bundle
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'recharts', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
  },

  images: {
    unoptimized: isStaticExport,
    remotePatterns: [
      { protocol: 'https', hostname: 'ui-avatars.com' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  ...(!isStaticExport && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            { key: 'X-Frame-Options', value: 'DENY' },
            { key: 'X-Content-Type-Options', value: 'nosniff' },
            { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          ],
        },
      ]
    },
  }),
}

module.exports = nextConfig
