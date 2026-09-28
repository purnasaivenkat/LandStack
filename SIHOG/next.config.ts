import type { NextConfig } from "next";

const backendApiUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: `${backendApiUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
