import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  env: {
    DATABASE_URL: process.env.DATABASE_URL ?? 'mysql://root:root@127.0.0.1:8889/aws?serverVersion=8.0',
  },
};

export default nextConfig;
