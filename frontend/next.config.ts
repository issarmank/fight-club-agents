import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack(config) {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: `${process.env.BACKEND_URL ?? "http://localhost:8000"}/:path*`,
      },
    ];
  },
};

export default nextConfig;
