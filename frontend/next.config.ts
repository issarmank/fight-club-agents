import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://localhost:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
