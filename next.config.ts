import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Backend proxy removed - authentication now handled directly in Next.js
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
