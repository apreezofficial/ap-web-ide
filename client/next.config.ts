import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost/ap%20ai%20ide/server/api/:path*',
      },
    ];
  },
};

export default nextConfig;
