import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Star, Calendar, Film, Tv, Sparkles, Building, Globe, CheckCircle2, Flame } from 'lucide-react';
import KDramaWatchSection from '@/components/kdrama/KDramaWatchSection';
import AdBanner from '@/components/ads/AdBanner';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import TenantWatchSeoBlock from '@/components/seo/TenantWatchSeoBlock';
import MediaCarousel from '@/components/media/MediaCarousel';
import { getTVDetails } from '@/lib/tmdb';
import { getTrendingKDramas, FALLBACK_KDRAMA_LIST, slugify } from '@/lib/kdrama';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';
import {
  getSiteUrl,
  generateTenantWatchMetadata,
  generateTenantSeoFaqs,
  buildWatchPageGraphSchema,
} from '@/lib/seo';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; ep?: string }>;
}

export async function generateMetadata({
  params,
  searchParams,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sParams = await searchParams;
  const s = parseInt(sParams.s || '1', 10);
  const ep = parseInt(sParams.ep || '1', 10);

  try {
    const show = await getTVDetails(id);
    const title = show.name;
    const year = formatYear(show.first_air_date);
    const backdropUrl = show.backdrop_path
      ? getTMDBImageUrl(show.backdrop_path, 'original')
      : show.poster_path
      ? getTMDBImageUrl(show.poster_path, 'original')
      : undefined;

    const network = show.networks?.[0]?.name || 'tvN / JTBC / SBS';
    const cast = show.credits?.cast?.slice(0, 3).map((c) => c.name) || [];

    let requestHost: string | null = null;
    try {
      const headerList = await headers();
      requestHost = headerList.get('x-forwarded-host') || headerList.get('host');
    } catch {}

    return generateTenantWatchMetadata({
      id,
      mediaType: 'kdrama',
      title,
      romajiTitle: show.original_name,
      season: s,
      episode: ep,
      year,
      overview: show.overview,
      backdropUrl,
      network,
      cast,
      genres: show.genres?.map((g) => g.name),
      requestHost,
    });
  } catch {
    return {
      title: {
        absolute: `Watch Korean Drama Online Free with English Subtitles — ${SITE_CONFIG.SITE_NAME}`,
      },
      description: `Stream popular Korean dramas and Asian series in HD with English subtitles on ${SITE_CONFIG.SITE_NAME}.`,
    };
  }
}

export default async function KDramaWatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = await searchParams;
  const initialSeason = parseInt(sParams.s || '1', 10);
  const initialEpisode = parseInt(sParams.ep || '1', 10);

  let show;
  try {
    show = await getTVDetails(id);
  } catch {
    const fallback = FALLBACK_KDRAMA_LIST.find((d) => String(d.id) === String(id));
    if (!fallback) {
      notFound();
    }
    show = {
      ...fallback,
      credits: { cast: [], crew: [] },
      recommendations: { results: [], page: 1, total_pages: 1, total_results: 0 },
      similar: { results: [], page: 1, total_pages: 1, total_results: 0 },
      seasons: [
        {
          id: 1,
          name: 'Season 1',
          overview: '',
          poster_path: fallback.poster_path,
          season_number: 1,
          episode_count: fallback.number_of_episodes || 16,
        },
      ],
    } as any;
  }

  const siteUrl = getSiteUrl();
  const year = formatYear(show.first_air_date);
  const seasons = (show.seasons || []).filter((s: any) => s.season_number > 0);
  const posterUrl = show.poster_path ? getTMDBImageUrl(show.poster_path, 'w342') : null;
  const backdropUrl = show.backdrop_path
    ? getTMDBImageUrl(show.backdrop_path, 'original')
    : posterUrl || `${siteUrl}/og-default.jpg`;

  const network = show.networks?.[0]?.name || 'tvN / JTBC / SBS';
  const cast = show.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [];

  const breadcrumbItems = [
    { name: 'K-Dramas', url: '/kdramas' },
    { name: show.name, url: `/watch/kdrama/${show.id}` },
    {
      name: `S${initialSeason} E${initialEpisode}`,
      url: `/watch/kdrama/${show.id}?s=${initialSeason}&ep=${initialEpisode}`,
    },
  ];

  let requestHost: string | null = null;
  try {
    const headerList = await headers();
    requestHost = headerList.get('x-forwarded-host') || headerList.get('host');
  } catch {}

  // Dynamic FAQs & Full Schema Graph
  const faqs = generateTenantSeoFaqs({
    id: show.id,
    mediaType: 'kdrama',
    title: show.name,
    romajiTitle: show.original_name,
    season: initialSeason,
    episode: initialEpisode,
    year,
    overview: show.overview,
    network,
    cast,
    genres: show.genres?.map((g: any) => g.name),
    requestHost,
  });

  const fullSchema = buildWatchPageGraphSchema({
    id: show.id,
    mediaType: 'kdrama',
    title: show.name,
    romajiTitle: show.original_name,
    season: initialSeason,
    episode: initialEpisode,
    year,
    overview: show.overview,
    backdropUrl,
    embedUrl: `${siteUrl}/watch/kdrama/${show.id}?s=${initialSeason}&ep=${initialEpisode}`,
    faqs,
    rating: show.vote_average || 8.0,
    ratingCount: show.vote_count || 300,
    genres: show.genres?.map((g: any) => g.name),
    network,
    cast,
    requestHost,
  });

  // Recommendations
  const moreDramas = await getTrendingKDramas(1).catch(() => FALLBACK_KDRAMA_LIST);
  const recItems = moreDramas.filter((d) => d.id !== show.id);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16">
      {/* Rich Snippets Multi-Graph */}
      <JsonLd data={fullSchema} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Semantic Visible Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Video Player & Season/Episode Section */}
        <section className="mb-8" aria-label={`K-Drama Player for ${show.name}`}>
          <KDramaWatchSection
            tvId={show.id}
            showTitle={show.name}
            imdbId={show.external_ids?.imdb_id || show.imdb_id || null}
            slug={show.slug || slugify(show.name)}
            backdropPath={show.backdrop_path}
            seasons={seasons.length > 0 ? seasons : [{ id: 1, name: 'Season 1', overview: '', poster_path: null, season_number: 1, episode_count: 16 }]}
            initialSeason={initialSeason}
            initialEpisode={initialEpisode}
          />
        </section>

        {/* Ad Placement below Player */}
        <AdBanner zone="player-bottom" />

        {/* K-Drama Metadata Presentation Card */}
        <article className="bg-[#0e0e13] border border-white/5 rounded-2xl p-6 sm:p-8 mt-6 shadow-2xl">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Poster Thumbnail */}
            {posterUrl && (
              <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#161620] shrink-0 border border-white/10 shadow-xl self-start">
                <Image
                  src={posterUrl}
                  alt={`${show.name} poster`}
                  fill
                  priority={false}
                  loading="lazy"
                  decoding="async"
                  className="object-cover"
                  sizes="(max-width: 640px) 144px, 192px"
                />
              </div>
            )}

            {/* Details Content */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md text-white"
                    style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }}
                  >
                    K-Drama Series
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white">
                    🇰🇷 Korean Audio • 🇺🇸 Eng Sub
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{formatRating(show.vote_average)}</span>
                    <span className="text-slate-400 font-normal">
                      ({show.vote_count ? show.vote_count.toLocaleString() : 0} votes)
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Watch {show.name} Season {initialSeason} Episode {initialEpisode} (Eng Sub)
                </h1>

                {show.original_name && show.original_name !== show.name && (
                  <p className="text-sm font-medium text-pink-300 mt-1">
                    {show.original_name}
                  </p>
                )}
              </div>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-y border-white/5 py-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  First Aired: <strong className="text-white font-medium">{show.first_air_date || year}</strong>
                </span>
                {show.number_of_seasons && (
                  <span className="flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-slate-500" />
                    Seasons: <strong className="text-white font-medium">{show.number_of_seasons}</strong>
                  </span>
                )}
                {show.number_of_episodes && (
                  <span className="flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-slate-500" />
                    Episodes: <strong className="text-white font-medium">{show.number_of_episodes}</strong>
                  </span>
                )}
                {network && (
                  <span className="flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-slate-500" />
                    Network: <strong className="text-white font-medium">{network}</strong>
                  </span>
                )}
              </div>

              {/* Genres */}
              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {show.genres.map((genre: any) => (
                    <span
                      key={genre.id}
                      className="text-xs px-3 py-1 rounded-full bg-[#181824] text-slate-300 border border-white/5"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Synopsis */}
              {show.overview && (
                <div className="space-y-1.5 pt-1">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Synopsis
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    {show.overview}
                  </p>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Tenant-Specific Anti-Duplicate SSR Specs & SEO FAQ Section */}
        <TenantWatchSeoBlock
          mediaType="kdrama"
          requestHost={requestHost}
          id={show.id}
          title={show.name}
          originalTitle={show.original_name}
          season={initialSeason}
          episode={initialEpisode}
          year={year}
          network={network}
          cast={cast}
          genres={show.genres?.map((g: any) => g.name)}
          overview={show.overview}
          rating={show.vote_average}
          ratingCount={show.vote_count}
          totalEpisodes={show.number_of_episodes}
          status={show.status}
          faqs={faqs}
        />

        {/* More K-Dramas Carousel */}
        {recItems.length > 0 && (
          <div className="mt-8">
            <MediaCarousel
              title="🔥 More Popular K-Dramas"
              items={recItems as any}
            />
          </div>
        )}
      </div>
    </div>
  );
}
