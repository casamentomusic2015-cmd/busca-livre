import type { Metadata, Viewport } from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  display: 'swap',
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Busca Livre — Ofertas no Mercado Livre com IA',
  description:
    'Busca inteligente no Mercado Livre com voz, comparação de preços e ranking de custo-benefício.',
  applicationName: 'Busca Livre',
  metadataBase: new URL(appUrl),
  openGraph: {
    title: 'Busca Livre',
    description: 'Encontre as melhores ofertas no Mercado Livre',
    type: 'website',
    url: appUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Busca Livre',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  themeColor: '#FFE600',
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sora.variable} dark`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Busca Livre" />
      </head>
      <body className="min-h-screen bg-fundo text-texto antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
