/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Load images directly from the source CDN instead of through Vercel's
    // image optimizer. CJ's image hosts frequently fail server-side fetches
    // (hotlink protection) and the optimizer quota can run out on the free
    // plan — both cause broken product images. Unoptimized = reliable display.
    unoptimized: true,
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
      { protocol: 'https', hostname: '**.aliyuncs.com' },
      // Catch-all: CJ product images come from many changing CDN hosts.
      // Allowing any HTTPS host prevents next/image from crashing a product
      // page when an image lives on an unlisted domain.
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
