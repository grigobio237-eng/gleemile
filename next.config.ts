import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['jose', 'jwks-rsa'],
  /* config options here */
};

export default nextConfig;
