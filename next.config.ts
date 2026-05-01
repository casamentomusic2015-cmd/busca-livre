import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Imagens reais do Mercado Livre
      { protocol: 'https', hostname: '**.mlstatic.com', pathname: '/**' },
      { protocol: 'http', hostname: '**.mlstatic.com', pathname: '/**' },
      // Imagens de placeholder usadas nos dados de mock (desenvolvimento)
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
    ],
  },
};

export default nextConfig;
