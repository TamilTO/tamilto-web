// Allow photos from this site's own Supabase address too (covers a custom domain or a local test copy).
const supa = (() => {
  try {
    const u = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '')
    return [{ protocol: u.protocol.replace(':', ''), hostname: u.hostname, port: u.port, pathname: '/storage/v1/object/public/**' }]
  } catch {
    return []
  }
})()

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    // Photos come from Supabase Storage (step 15).
    remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co', pathname: '/storage/v1/object/public/**' }, ...supa],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ]
  },
}

export default nextConfig
