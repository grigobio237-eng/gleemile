import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: [
    'jose', 'jwks-rsa', 'nodemailer', 'cheerio'
  ],
  transpilePackages: [
    'livekit-client', '@livekit/components-react', '@livekit/components-styles',
    '@tosspayments/payment-widget-sdk', 'jspdf', 'html2canvas',
    'qrcode.react', 'signature_pad', 'react-quill-new',
    'canvas-confetti', 'html5-qrcode', 'firebase', 'recharts', 'lucide-react', 'framer-motion'
  ],
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
    optimizePackageImports: ['date-fns'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'jspdf': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'html2canvas': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'recharts': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'qrcode.react': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'signature_pad': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'livekit-client': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        '@livekit/components-react': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        '@livekit/components-styles': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        '@tosspayments/payment-widget-sdk': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'lucide-react': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'react-quill-new': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'canvas-confetti': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'html5-qrcode': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/app': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/auth': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/firestore': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/storage': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/messaging': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/analytics': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase/database': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
        'firebase': require('path').resolve(__dirname, 'src/lib/empty-mock.js'),
      };
    }
    return config;
  },
};

export default nextConfig;

