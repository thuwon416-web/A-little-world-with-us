const withSerwist = require('@serwist/next').default({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
})

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 2000],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      { source: '/locations', destination: '/location', permanent: true },
      { source: '/stats', destination: '/dashboard', permanent: true },
      { source: '/cycle', destination: '/care', permanent: true },
      { source: '/plans', destination: '/planning', permanent: true },
      { source: '/couple-status', destination: '/couple-linking', permanent: true },
      { source: '/love-calculator', destination: '/games', permanent: true },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=self, microphone=self, geolocation=self',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*\\.(?:js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff|woff2))',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

const { withSentryConfig } = require('@sentry/nextjs')

// Only apply Sentry configuration if DSN is provided
const sentryOptions = {
  org: process.env.SENTRY_ORG || 'your-org-name',
  project: process.env.SENTRY_PROJECT || 'your-project-name',
  silent: true,
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
}

// Apply Sentry wrapper only if DSN is available
const withSentry =
  process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN
    ? withSentryConfig(withSerwist(nextConfig), sentryOptions)
    : withSerwist(nextConfig)

// Apply bundle analyzer
module.exports = withBundleAnalyzer(withSentry)
