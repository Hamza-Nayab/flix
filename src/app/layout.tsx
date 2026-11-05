import type { Metadata } from 'next';
import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import PopUnderManager from '@/components/ads/PopUnderManager';
import { SITE_CONFIG } from '@/lib/siteConfig';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = SITE_CONFIG.SITE_URL;
const siteName = SITE_CONFIG.SITE_NAME;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  title: {
    default: `${siteName} - Stream Movies, TV Shows, Anime & K-Dramas in 1080p HD`,
    template: `%s | ${siteName}`,
  },
  description:
    `Stream thousands of movies, global TV series, simulcast anime, and Korean dramas online in crisp full HD. High-speed playback, redundant servers, English subtitles, and zero buffer streaming on ${siteName}.`,
  keywords: [
    'movies online',
    'stream free hd',
    'watch series online',
    'watch anime free',
    'watch kdrama eng sub',
    siteName.toLowerCase(),
    'stream movies',
    'free streaming',
    'watch movies online free',
    'watch tv online full hd',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: siteName,
    title: `${siteName} - Stream Movies, TV Series, Anime & K-Dramas in 1080p HD`,
    description:
      `Stream thousands of movies, TV series, anime, and K-Dramas online in crisp full HD. Multi-server redundancy, English subtitles, and zero buffering on ${siteName}.`,
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: `${siteName} - Stream Movies, Series & Dramas Online Free in HD`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteName} - Stream Movies & TV Series in 1080p HD`,
    description: `Stream movies, series, anime, and K-Dramas in 1080p HD online with fast multi-server playback on ${siteName}.`,
    images: ['/og-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${outfit.variable} ${inter.variable} dark antialiased`}
      style={{
        '--brand-color': SITE_CONFIG.PRIMARY_COLOR,
        '--primary-color': SITE_CONFIG.PRIMARY_COLOR,
        '--primary-rgb': SITE_CONFIG.PRIMARY_RGB,
        '--primary-contrast-text': SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
        '--primary-gradient-to': SITE_CONFIG.PRIMARY_GRADIENT_TO,
      } as React.CSSProperties}
    >
      <body
        className="min-h-screen bg-[#070709] text-[#F8F9FA] flex flex-col font-sans"
        style={{
          '--brand-color': SITE_CONFIG.PRIMARY_COLOR,
          '--primary-color': SITE_CONFIG.PRIMARY_COLOR,
          '--primary-rgb': SITE_CONFIG.PRIMARY_RGB,
          '--primary-contrast-text': SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
          '--primary-gradient-to': SITE_CONFIG.PRIMARY_GRADIENT_TO,
        } as React.CSSProperties}
      >
        <PopUnderManager />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
