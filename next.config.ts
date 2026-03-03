import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backend proxy removed - authentication now handled directly in Next.js
  // Add this headers block to fix the RSC caching issue on DO/Cloudflare
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Vary',
            value: 'RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Url',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jpm-public-storage.nyc3.cdn.digitaloceanspaces.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
