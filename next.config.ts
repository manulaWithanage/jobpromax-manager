import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    BASE_BACKEND_URL: process.env.BASE_BACKEND_URL,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8000/:path*',
      },
    ];
  },
};

export default nextConfig;
