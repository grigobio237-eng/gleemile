import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['jose', 'jwks-rsa', 'nodemailer', 'cheerio'],
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts', 'firebase', '@livekit/components-react'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'jspdf': false,
        'html2canvas': false,
        'recharts': false,
        'qrcode.react': false,
        'signature_pad': false,
        'livekit-client': false,
        '@livekit/components-react': false,
        '@livekit/components-styles': false,
        '@tosspayments/payment-widget-sdk': false,
      };
    }
    return config;
  },
};

export default nextConfig;

