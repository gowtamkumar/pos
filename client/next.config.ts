import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "setback-bottling-showgirl.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.app",
    "localhost:3001",
    "127.0.0.1:3001",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination:
          process.env.INTERNAL_API_URL || "http://server:3900/api/v1/:path*",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9100",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9100",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "minio",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "setback-bottling-showgirl.ngrok-free.dev",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/admin",
        destination: "/dashboard",
        permanent: false,
      },
      {
        source: "/admin/qa",
        destination: "/admin/courses",
        permanent: false,
      },
      {
        source: "/student/dashboard",
        destination: "/student",
        permanent: false,
      },
      {
        source: "/students/:path*",
        destination: "/student",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
