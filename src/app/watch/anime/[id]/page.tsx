import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, Film, Sparkles, Building, Tv } from 'lucide-react';
import AnimeWatchSection from '@/components/anime/AnimeWatchSection';
import AdBanner from '@/components/ads/AdBanner';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getAnimeById, getTopAiringAnime, FALLBACK_ANIME_LIST } from '@/lib/anime';
import MediaCarousel from '@/components/media/MediaCarousel';
import { getTMDBImageUrl } from '@/lib/utils';
import {
  getSiteUrl,
  cleanMetaDescription,
  buildAnimeSeriesSchema,
  buildVideoObjectSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; ep?: string; dub?: string; type?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sParams = await searchParams;
  const season = parseInt(sParams.s || '1', 10);
  const ep = parseInt(sParams.ep || '1', 10);
  const requestedType = sParams.type === 'movie' ? 'movie' : 'tv';
  const siteUrl = getSiteUrl();

  try {
    const anime =
      (await getAnimeById(id, requestedType)) ||
      FALLBACK_ANIME_LIST.find((a) => String(a.id) === String(id)) ||
      FALLBACK_ANIME_LIST[0];

    const title = anime.title || anime.name || 'Anime Stream';
    const isMovie = anime.anime_media_type === 'movie';
    const pageTitle = isMovie
      ? `Watch ${title} Full Movie Online (English Sub & Dub) in HD | ${SITE_CONFIG.SITE_NAME}`
      : `Watch ${title} Season ${season} Episode ${ep} (English Sub & Dub) in HD | ${SITE_CONFIG.SITE_NAME}`;
    
    const canonicalUrl = `${siteUrl}/watch/anime/${id}${isMovie ? '?type=movie' : `?s=${season}&ep=${ep}`}`;
    const backdropUrl = anime.backdrop_path
      ? getTMDBImageUrl(anime.backdrop_path, 'w1280')
      : `${siteUrl}/og-default.jpg`;

    const description = cleanMetaDescription(
      anime.overview,
      `Watch ${title} online in full HD with English Subtitles and Dubbing on ${SITE_CONFIG.SITE_NAME}. Multi-server playback with zero lag.`
    );

    return {
      title: {
        absolute: pageTitle,
      },
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: isMovie ? 'video.movie' : 'video.tv_show',
        url: canonicalUrl,
        title: pageTitle,
        description,
        siteName: SITE_CONFIG.SITE_NAME,
        images: [
          {
            url: backdropUrl,
            width: 1280,
            height: 720,
            alt: `Watch ${title} on ${SITE_CONFIG.SITE_NAME}`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description,
        images: [backdropUrl],
      },
      robots: {
        index: true,
        follow: true,
      },
    };
  } catch {
    return {
      title: `Watch Anime Online Free in HD (English Sub & Dub) | ${SITE_CONFIG.SITE_NAME}`,
      description: `Stream top anime episodes online in full HD with English Subtitles and Dubs on ${SITE_CONFIG.SITE_NAME}.`,
    };
  }
}

export default async function AnimeWatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const initialSeason = parseInt(sParams.s || '1', 10);
  const initialEpisode = parseInt(sParams.ep || '1', 10);
  const initialSubOrDub = sParams.dub === '1' || sParams.dub === 'true' || sParams.dub === 'dub' ? 'dub' : 'sub';
  const requestedType = sParams.type === 'movie' ? 'movie' : 'tv';

  const anime =
    (await getAnimeById(id, requestedType, initialSeason)) ||
    FALLBACK_ANIME_LIST.find((a) => String(a.id) === String(id) || String(a.mal_id) === String(id)) ||
    FALLBACK_ANIME_LIST[0];

  if (!anime) {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const title = anime.title || anime.name || 'Anime Stream';
  const isMovie = anime.anime_media_type === 'movie';
  const backdropUrl = anime.backdrop_path ? getTMDBImageUrl(anime.backdrop_path, 'w1280') : '/placeholder-backdrop.svg';
  const posterUrl = anime.poster_path ? getTMDBImageUrl(anime.poster_path, 'w342') : '/placeholder-poster.svg';

  // Breadcrumbs (Relative internal paths to prevent port mismatch navigation)
  const breadcrumbItems = [
    { name: 'Anime', url: '/anime' },
    { name: title, url: `/watch/anime/${anime.id}` },
    {
      name: isMovie ? 'Full Movie' : `S${initialSeason} E${initialEpisode}`,
      url: `/watch/anime/${anime.id}${isMovie ? '?type=movie' : `?s=${initialSeason}&ep=${initialEpisode}`}`,
    },
  ];

  // Schema.org structured data
  const animeSchema = buildAnimeSeriesSchema(anime, siteUrl, initialEpisode);
  const videoSchema = buildVideoObjectSchema({
    name: isMovie ? `Watch ${title} (Eng Sub & Dub) Online HD` : `Watch ${title} S${initialSeason} Ep ${initialEpisode} (Eng Sub & Dub) Online HD`,
    description: anime.overview || `Stream ${title} on ${SITE_CONFIG.SITE_NAME}.`,
    thumbnailUrl: backdropUrl,
    uploadDate: anime.first_air_date || anime.release_date || new Date().toISOString(),
    embedUrl: `${siteUrl}/watch/anime/${anime.id}${isMovie ? '?type=movie' : `?s=${initialSeason}&ep=${initialEpisode}`}`,
  });
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  // Recommendations / More Airing
  const recommendations = await getTopAiringAnime(12).catch(() => FALLBACK_ANIME_LIST);
  const recItems = (recommendations.length > 0 ? recommendations : FALLBACK_ANIME_LIST)
    .filter((a) => a.id !== anime.id)
    .map((a) => ({
      id: a.id,
      mal_id: a.id,
      title: a.title || a.name,
      name: a.name || a.title,
      poster_path: a.poster_path,
      backdrop_path: a.backdrop_path,
      release_date: a.first_air_date || a.release_date || '',
      vote_average: a.vote_average || 8.0,
      vote_count: a.vote_count || 0,
      popularity: a.vote_count || 0,
      media_type: 'anime' as const,
      anime_media_type: a.anime_media_type,
    }));

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16">
      {/* Rich Snippets */}
      <JsonLd data={[animeSchema, videoSchema, breadcrumbSchema]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Video Player & Chunked Episode Section */}
        <section className="mb-8" aria-label={`Anime Player for ${title}`}>
          <AnimeWatchSection
            malId={anime.id}
            anime={anime}
            initialSeason={initialSeason}
            initialEpisode={initialEpisode}
            initialSubOrDub={initialSubOrDub}
            initialBridgeData={{
              anilistId: anime.anilist_id || null,
              malId: anime.mal_id || null,
              slug: anime.slug || null,
            }}
          />
        </section>

        {/* Ad Placement below Player */}
        <AdBanner zone="player-bottom" />

        {/* Anime Metadata Card */}
        <article className="bg-[#0e0e13] border border-white/5 rounded-2xl p-6 sm:p-8 mt-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Poster Thumbnail */}
            <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#161620] shrink-0 border border-white/10 shadow-xl self-start">
              <Image
                src={posterUrl}
                alt={`${title} anime poster`}
                fill
                priority={false}
                loading="lazy"
                decoding="async"
                unoptimized={Boolean(posterUrl && (posterUrl.includes('myanimelist.net') || posterUrl.startsWith('/placeholder')))}
                className="object-cover"
                sizes="(max-width: 640px) 144px, 192px"
              />
            </div>

            {/* Details Content */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }}
                  >
                    {isMovie ? 'Anime Movie' : 'Anime Series'}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white">
                    🇯🇵 Japanese Audio • 🇺🇸 Eng Sub & Dub
                  </span>
                  {anime.vote_average > 0 && (
                    <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{anime.vote_average.toFixed(1)}</span>
                      {anime.vote_count ? (
                        <span className="text-slate-400 font-normal">
                          ({anime.vote_count.toLocaleString()} ratings)
                        </span>
                      ) : null}
                    </div>
                  )}
                  {anime.status && (
                    <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {anime.status}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {isMovie
                    ? `Watch ${title} Full HD (English Sub & Dub)`
                    : `Watch ${title} Season ${initialSeason} Episode ${initialEpisode} (English Sub & Dub)`}
                </h1>

                {anime.original_name && anime.original_name !== title && (
                  <p className="text-sm font-medium mt-1" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
                    {anime.original_name}
                  </p>
                )}
              </div>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-y border-white/5 py-3">
                {anime.first_air_date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    First Aired: <strong className="text-white font-medium">{anime.first_air_date}</strong>
                  </span>
                )}
                {anime.episodes ? (
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-slate-500" />
                    Total Episodes: <strong className="text-white font-medium">{anime.episodes}</strong>
                  </span>
                ) : null}
                {anime.number_of_seasons ? (
                  <span className="flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-slate-500" />
                    Seasons: <strong className="text-white font-medium">{anime.number_of_seasons}</strong>
                  </span>
                ) : null}
                {anime.studios && anime.studios.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-500" />
                    Studio: <strong className="text-white font-medium">{anime.studios.map((s) => s.name).join(', ')}</strong>
                  </span>
                )}
              </div>

              {/* Genres */}
              {anime.genres && anime.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {anime.genres.map((genre) => (
                    <span
                      key={genre.id || genre.mal_id || genre.name}
                      className="text-xs px-3 py-1 rounded-full bg-[#181824] text-slate-300 border border-white/5 hover:border-[var(--primary-color)] transition-colors"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {anime.overview && (
                <div className="space-y-1.5 pt-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Story Overview
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {anime.overview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* More Airing Anime Carousel */}
        {recItems.length > 0 && (
          <div className="mt-8">
            <MediaCarousel
              title="🔥 Trending Simulcast Anime"
              items={recItems as any}
            />
          </div>
        )}
      </div>
    </div>
  );
}
