import React from 'react';
import type { Metadata } from 'next';
import HeroBanner from '@/components/media/HeroBanner';
import AnimeHeroBanner from '@/components/anime/AnimeHeroBanner';
import KDramaHeroBanner from '@/components/kdrama/KDramaHeroBanner';
import MediaCarousel from '@/components/media/MediaCarousel';
import ContinueWatching from '@/components/media/ContinueWatching';
import AdBanner from '@/components/ads/AdBanner';
import JsonLd from '@/components/seo/JsonLd';
import {
  getTrendingAll,
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getTopRatedMovies,
} from '@/lib/tmdb';
import {
  getTopAiringAnime,
  getMostPopularAnime,
  getTopAnimeMovies,
  FALLBACK_ANIME_LIST,
  JikanAnime,
} from '@/lib/anime';
import {
  getTrendingKDramas,
  getRomanceKDramas,
  getTopRatedKDramas,
  FALLBACK_KDRAMA_LIST,
} from '@/lib/kdrama';
import { getSiteUrl, buildWebSiteSearchSchema } from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/siteConfig';
import { Flame, Star, Film, Tv, Sparkles, Heart } from 'lucide-react';

export const revalidate = 3600; // 1 hour ISR revalidation

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const siteName = SITE_CONFIG.SITE_NAME;
  const niche = SITE_CONFIG.PRIMARY_NICHE;

  const title =
    niche === 'anime'
      ? `${siteName} — Watch Anime Online Free in HD (English Sub & Dub)`
      : niche === 'kdrama'
      ? `${siteName} — Watch K-Dramas & Asian Series Online Free in Full HD`
      : `${siteName} — Stream Movies & TV Series Online Free in Full HD`;

  const description =
    niche === 'anime'
      ? `Stream thousands of popular anime series, simulcasts, and movies online in 1080p HD with English Subtitles and Dubs on ${siteName}. Fast multi-server redundancy.`
      : niche === 'kdrama'
      ? `Watch trending Korean dramas, C-dramas, romance, and thrillers online in 1080p HD with English subtitles on ${siteName}. Fast streaming, no subscription needed.`
      : `Watch trending movies, popular blockbusters, and top-rated TV series online in HD on ${siteName}. Free streaming across fast redundant servers with zero buffering.`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: siteUrl,
    },
    openGraph: {
      title,
      description,
      url: siteUrl,
      siteName,
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

export default async function HomePage() {
  const niche = SITE_CONFIG.PRIMARY_NICHE;

  // Parallel data fetching optimized per niche
  const [
    trendingAll,
    trendingMovies,
    trendingTV,
    topRatedMovies,
    trendingKDramas,
    romanceKDramas,
    topRatedKDramas,
    airingAnime,
    popularAnime,
    movieAnime,
  ] = await Promise.all([
    getTrendingAll('week').catch(() => []),
    getTrendingMovies('day').catch(() => []),
    getTrendingTV('day').catch(() => []),
    getTopRatedMovies(1).catch(() => []),
    getTrendingKDramas(1).catch(() => FALLBACK_KDRAMA_LIST),
    niche === 'kdrama' ? getRomanceKDramas(1).catch(() => FALLBACK_KDRAMA_LIST) : Promise.resolve([]),
    niche === 'kdrama' ? getTopRatedKDramas(1).catch(() => FALLBACK_KDRAMA_LIST) : Promise.resolve([]),
    getTopAiringAnime(16).catch(() => FALLBACK_ANIME_LIST.slice(0, 16)),
    niche === 'anime' ? getMostPopularAnime(16).catch(() => FALLBACK_ANIME_LIST.slice(0, 16)) : Promise.resolve([]),
    niche === 'anime' ? getTopAnimeMovies(16).catch(() => FALLBACK_ANIME_LIST.slice(0, 16)) : Promise.resolve([]),
  ]);

  const websiteSearchSchema = buildWebSiteSearchSchema(siteUrl);

  const airingAnimeItems = airingAnime.map(animeToMediaItem);
  const popularAnimeItems = popularAnime.map(animeToMediaItem);
  const movieAnimeItems = movieAnime.map(animeToMediaItem);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sitelinks Search Box Structured Data */}
      <JsonLd data={websiteSearchSchema} />

      {/* Adaptive Hero Banner by Niche */}
      {niche === 'anime' ? (
        <AnimeHeroBanner anime={airingAnime[0] || popularAnime[0] || FALLBACK_ANIME_LIST[0]} />
      ) : niche === 'kdrama' ? (
        <KDramaHeroBanner drama={trendingKDramas[0] || FALLBACK_KDRAMA_LIST[0]} />
      ) : (
        <HeroBanner items={trendingAll} />
      )}

      {/* User's Continue Watching rail */}
      <ContinueWatching />

      {/* Content Carousels - Niche-Adaptive Hierarchy */}
      <div className="space-y-2 -mt-6 sm:-mt-10 relative z-20">
        {niche === 'anime' ? (
          <>
            <MediaCarousel
              title="Simulcast / Currently Airing"
              items={airingAnimeItems as any}
              viewAllHref="/anime"
              icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
            />
            <MediaCarousel
              title="Popular Anime of All Time"
              items={popularAnimeItems as any}
              viewAllHref="/anime"
              icon={<Flame className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
            <AdBanner zone="in-feed" />
            <MediaCarousel
              title="Top Rated Anime Movies"
              items={movieAnimeItems as any}
              viewAllHref="/anime"
              icon={<Film className="w-5 h-5 text-indigo-400" />}
            />
            <MediaCarousel
              title="Trending K-Dramas & Asian Series"
              items={trendingKDramas}
              viewAllHref="/kdramas"
              icon={<Flame className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
            <MediaCarousel
              title="Trending Global Movies"
              items={trendingMovies}
              viewAllHref="/movies"
              icon={<Star className="w-5 h-5 text-amber-400" />}
            />
          </>
        ) : niche === 'kdrama' ? (
          <>
            <MediaCarousel
              title="Trending & Airing K-Dramas"
              items={trendingKDramas}
              viewAllHref="/kdramas"
              icon={<Flame className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
            <MediaCarousel
              title="Korean Romance & Melodrama"
              items={romanceKDramas}
              viewAllHref="/kdramas"
              icon={<Heart className="w-5 h-5 text-pink-500 fill-pink-500" />}
            />
            <AdBanner zone="in-feed" />
            <MediaCarousel
              title="All-Time Highest Rated K-Dramas"
              items={topRatedKDramas}
              viewAllHref="/kdramas"
              icon={<Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            />
            <MediaCarousel
              title="Top Simulcast Anime"
              items={airingAnimeItems as any}
              viewAllHref="/anime"
              icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
            />
            <MediaCarousel
              title="Trending Global Movies"
              items={trendingMovies}
              viewAllHref="/movies"
              icon={<Film className="w-5 h-5 text-rose-400" />}
            />
          </>
        ) : (
          <>
            <MediaCarousel
              title="Trending Movies"
              items={trendingMovies}
              viewAllHref="/movies"
              icon={<Flame className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
            <MediaCarousel
              title="Trending TV Series"
              items={trendingTV}
              viewAllHref="/tv"
              icon={<Tv className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
            <AdBanner zone="in-feed" />
            <MediaCarousel
              title="Trending K-Dramas"
              items={trendingKDramas}
              viewAllHref="/kdramas"
              icon={<Flame className="w-5 h-5 text-pink-500" />}
            />
            <MediaCarousel
              title="Top Airing Anime"
              items={airingAnimeItems as any}
              viewAllHref="/anime"
              icon={<Sparkles className="w-5 h-5 text-cyan-400" />}
            />
            <MediaCarousel
              title="Top Rated Movies"
              items={topRatedMovies}
              viewAllHref="/movies?sort=vote_average.desc"
              icon={<Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
            />
          </>
        )}
      </div>
    </div>
  );
}
