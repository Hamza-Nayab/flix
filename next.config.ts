import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compress: false,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.70.232",
    "192.168.70.232:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "cdn.myanimelist.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    agentUpgrade: "security",
  },
};

export default nextConfig;
