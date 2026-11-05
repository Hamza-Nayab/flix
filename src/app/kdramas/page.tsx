import React from 'react';
import type { Metadata } from 'next';
import KDramaHeroBanner from '@/components/kdrama/KDramaHeroBanner';
import MediaCarousel from '@/components/media/MediaCarousel';
import AdBanner from '@/components/ads/AdBanner';
import {
  getTrendingKDramas,
  getRomanceKDramas,
  getThrillerKDramas,
  getTopRatedKDramas,
  getAsianDramas,
  FALLBACK_KDRAMA_LIST,
} from '@/lib/kdrama';
import { SITE_CONFIG } from '@/lib/siteConfig';

export const revalidate = 3600; // 1 hour ISR revalidation

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = SITE_CONFIG.SITE_URL;
  const siteName = SITE_CONFIG.SITE_NAME;
  const title = `Watch Korean Dramas (K-Drama) Online Free with English Subtitles in HD — ${siteName}`;
  const description =
    `Stream trending Korean dramas (K-Dramas), C-Dramas, and Asian television series online in full 1080p HD with English subtitles. Free high-speed streaming on ${siteName}.`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: `${siteUrl}/kdramas`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/kdramas`,
      siteName,
      type: 'website',
      images: [
        {
          url: '/og-default.jpg',
          width: 1200,
          height: 630,
          alt: `Watch K-Dramas Online Free in HD — ${siteName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function KDramasPage() {
  const [trending, romance, thriller, topRated, asian] = await Promise.all([
    getTrendingKDramas(1).catch(() => FALLBACK_KDRAMA_LIST),
    getRomanceKDramas(1).catch(() => FALLBACK_KDRAMA_LIST),
    getThrillerKDramas(1).catch(() => FALLBACK_KDRAMA_LIST),
    getTopRatedKDramas(1).catch(() => FALLBACK_KDRAMA_LIST),
    getAsianDramas(1).catch(() => FALLBACK_KDRAMA_LIST),
  ]);

  const heroDrama = trending[0] || FALLBACK_KDRAMA_LIST[0];

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner: #1 Trending K-Drama */}
      {heroDrama && <KDramaHeroBanner drama={heroDrama} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Row 1: Trending & Airing */}
        <MediaCarousel
          title="🌸 Trending & Airing K-Dramas"
          items={trending as any}
        />

        {/* Row 2: Romance & Melodrama */}
        <MediaCarousel
          title="💕 Korean Romance & Melodrama"
          items={romance as any}
        />

        {/* In-Feed Advertisement */}
        <AdBanner zone="in-feed" />

        {/* Row 3: Crime, Thriller & Action */}
        <MediaCarousel
          title="🔥 Korean Crime, Thriller & Action"
          items={thriller as any}
        />

        {/* Row 4: All-Time Highest Rated */}
        <MediaCarousel
          title="👑 All-Time Highest Rated K-Dramas"
          items={topRated as any}
        />

        {/* Row 5: Popular C-Dramas & Asian Series */}
        <MediaCarousel
          title="🌏 Popular C-Dramas & Asian Series"
          items={asian as any}
        />
      </div>
    </div>
  );
}

