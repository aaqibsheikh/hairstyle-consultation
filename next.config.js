/** @type {import('next').NextConfig} */
const nextConfig = {
  // App directory is now stable in Next.js 14, no need for experimental flag
  
  // Note: Cache-bust parameters are part of Next.js 14's development mode
  // and cannot be easily disabled without breaking functionality
  
  // Ensure static assets are properly served
  trailingSlash: false,
  
  // Configure image optimization
  images: {
    unoptimized: true,
    domains: [],
  },
  
  // Ensure public folder is properly served
  async headers() {
    return [
      {
        source: '/:path*',
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

module.exports = nextConfig
