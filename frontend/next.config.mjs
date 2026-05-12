/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.rkcdn.ru' },
      { protocol: 'https', hostname: 'rkcdn.ru' },
      { protocol: 'https', hostname: 'assets.rkcdn.ru' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
