import React from 'react';
import type { Metadata } from 'next';
import AnimeHeroBanner from '@/components/anime/AnimeHeroBanner';
import MediaCarousel from '@/components/media/MediaCarousel';
import AdBanner from '@/components/ads/AdBanner';
import {
  getTopAiringAnime,
  getMostPopularAnime,
  getTopAnimeMovies,
  getUpcomingAnime,
  FALLBACK_ANIME_LIST,
  JikanAnime,
} from '@/lib/anime';
import { getSiteUrl } from '@/lib/seo';

export const revalidate = 3600; // Cache page for 1 hour

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const title = 'Watch Anime Online Free in HD (English Sub & Dub) — RoseFlix';
  const description =
    'Stream thousands of popular anime series, simulcasts, and movies online in 1080p HD with English Subtitles and Dubs on RoseFlix. Fast streaming with multi-server redundancy.';

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: `${siteUrl}/anime`,
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/anime`,
      siteName: 'RoseFlix',
      type: 'website',
      images: [
        {
          url: '/og-default.jpg',
          width: 1200,
          height: 630,
          alt: 'Watch Anime Online Free in HD — RoseFlix',
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

function animeToMediaItem(anime: JikanAnime) {
  return {
    id: anime.id || anime.mal_id,
    mal_id: anime.id || anime.mal_id,
    title: anime.title || anime.name,
    name: anime.name || anime.title,
    poster_path: anime.poster_path,
    backdrop_path: anime.backdrop_path,
    release_date: anime.first_air_date || anime.release_date || '',
    first_air_date: anime.first_air_date || anime.release_date || '',
    vote_average: anime.vote_average || 0,
    vote_count: anime.vote_count || 0,
    popularity: anime.popularity || 0,
    media_type: 'anime' as const,
    anime_media_type: anime.anime_media_type || 'tv',
    overview: anime.overview || '',
  };
}

export default async function AnimeHubPage() {
  const [airingList, popularList, moviesList, upcomingList] = await Promise.all([
    getTopAiringAnime(20).catch(() => FALLBACK_ANIME_LIST),
    getMostPopularAnime(20).catch(() => FALLBACK_ANIME_LIST),
    getTopAnimeMovies(20).catch(() => FALLBACK_ANIME_LIST),
    getUpcomingAnime(20).catch(() => FALLBACK_ANIME_LIST),
  ]);

  const heroAnime = airingList[0] || popularList[0] || FALLBACK_ANIME_LIST[0];

  const airingItems = (airingList.length > 0 ? airingList : FALLBACK_ANIME_LIST).map(animeToMediaItem);
  const popularItems = (popularList.length > 0 ? popularList : FALLBACK_ANIME_LIST).map(animeToMediaItem);
  const movieItems = (moviesList.length > 0 ? moviesList : FALLBACK_ANIME_LIST).map(animeToMediaItem);
  const upcomingItems = (upcomingList.length > 0 ? upcomingList : FALLBACK_ANIME_LIST).map(animeToMediaItem);

  return (
    <div className="min-h-screen pb-16">
      {/* Hero Banner: #1 Airing Simulcast */}
      {heroAnime && <AnimeHeroBanner anime={heroAnime} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Row 1: Simulcast / Currently Airing */}
        <MediaCarousel
          title="🔥 Simulcast / Currently Airing"
          items={airingItems as any}
        />

        {/* In-Feed Advertisement */}
        <AdBanner zone="in-feed" />

        {/* Row 2: Most Popular All-Time Anime */}
        <MediaCarousel
          title="⚡ Most Popular All-Time Anime"
          items={popularItems as any}
        />

        {/* Row 3: Top Rated Anime Movies */}
        <MediaCarousel
          title="🎬 Top Rated Anime Movies"
          items={movieItems as any}
        />

        {/* Row 4: Upcoming Next Season */}
        <MediaCarousel
          title="🚀 Upcoming Next Season"
          items={upcomingItems as any}
        />
      </div>
    </div>
  );
}
