/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // CJ Dropshipping CDN
      { protocol: 'https', hostname: '**.cjdropshipping.com' },
      { protocol: 'https', hostname: 'cbu01.alicdn.com' },
      { protocol: 'https', hostname: '**.alicdn.com' },
      { protocol: 'https', hostname: '**.aliexpress.com' },
      { protocol: 'https', hostname: 'ae01.alicdn.com' },
      // Generic CDN patterns
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
};

export default nextConfig;
