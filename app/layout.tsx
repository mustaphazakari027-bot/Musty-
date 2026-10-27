import type { Metadata, Viewport } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MobileTabBar } from '@/components/MobileTabBar';
import { getCartView } from '@/lib/cart';
import { getStoreInfo } from '@/lib/settings';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['600', '700', '800'],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Zakson — Premium Running & Sports Shoes in Jos, Nigeria',
    template: '%s | Zakson',
  },
  description:
    'Shop premium running shoes, training shoes, trail shoes and lifestyle sneakers at Zakson. Fitted in Jos North, Plateau State and delivered across Nigeria. Pay in Naira.',
  keywords: [
    'running shoes Jos',
    'sports shoes Plateau State',
    'buy sneakers online Nigeria',
    'running shoes Nigeria',
    'Zakson shoes',
    'trail shoes Nigeria',
    'men shoes Jos',
    'women running shoes Nigeria',
  ],
  authors: [{ name: 'Zakson' }],
  creator: 'Zakson',
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    siteName: 'Zakson',
    title: 'Zakson — Premium Running & Sports Shoes',
    description:
      'Premium running, training and lifestyle footwear. Delivered from Jos North, Plateau State to every state in Nigeria.',
    images: [{ url: '/images/products/ultra-run-pro-1.webp', width: 1200, height: 675, alt: 'Zakson running shoes' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Zakson — Premium Running & Sports Shoes',
    description: 'Premium running, training and lifestyle footwear, delivered across Nigeria.',
    images: ['/images/products/ultra-run-pro-1.webp'],
  },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  category: 'shopping',
};

export const viewport: Viewport = {
  themeColor: '#064E3B',
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cart = await getCartView();
  const store = getStoreInfo();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SportingGoodsStore',
    name: 'Zakson',
    founder: store.owner,
    url: siteUrl,
    email: store.email,
    telephone: `+234${store.phone.replace(/^0/, '')}`,
    priceRange: '₦₦',
    currenciesAccepted: 'NGN',
    paymentAccepted: 'Card, Bank transfer, USSD',
    address: {
      '@type': 'PostalAddress',
      addressLocality: store.city,
      addressRegion: store.state,
      addressCountry: 'NG',
    },
    areaServed: 'Nigeria',
    description:
      'Zakson retails premium running shoes, training shoes, trail shoes and lifestyle sneakers in Jos North, Plateau State, with delivery across Nigeria.',
  };

  return (
    <html lang="en-NG" className={`${inter.variable} ${manrope.variable}`}>
      <body className="flex min-h-dvh flex-col bg-mint-50 font-sans antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-forest focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to content
        </a>
        <Header />
        <main id="main" className="flex-1 pb-24 lg:pb-0">
          {children}
        </main>
        <Footer />
        <MobileTabBar cartCount={cart.totals.itemCount} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </body>
    </html>
  );
}
