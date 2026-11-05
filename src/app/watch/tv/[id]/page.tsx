import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Star, Calendar, Tv, Users, Building, Globe, Layers } from 'lucide-react';
import TVPlayerSection from '@/components/media/TVPlayerSection';
import MediaCarousel from '@/components/media/MediaCarousel';
import AdBanner from '@/components/ads/AdBanner';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { getTVDetails } from '@/lib/tmdb';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';
import {
  getSiteUrl,
  cleanMetaDescription,
  buildTVSeriesSchema,
  buildVideoObjectSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ s?: string; e?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const sParams = await searchParams;
  const s = sParams.s || '1';
  const e = sParams.e || '1';
  const siteUrl = getSiteUrl();

  try {
    const show = await getTVDetails(id);
    const year = formatYear(show.first_air_date);
    const topCast = show.credits?.cast.slice(0, 3).map((c) => c.name).join(', ') || '';
    const description = cleanMetaDescription(
      show.overview
        ? `${show.overview} Season ${s} Episode ${e}. Starring ${topCast}.`
        : undefined,
      `Stream ${show.name} in full 1080p HD online on RoseFlix.`
    );

    const title = `Watch ${show.name} Season ${s} Episode ${e} (${year}) Online | RoseFlix`;
    const canonicalUrl = `${siteUrl}/watch/tv/${id}`;
    const backdropUrl = show.backdrop_path
      ? getTMDBImageUrl(show.backdrop_path, 'original')
      : show.poster_path
      ? getTMDBImageUrl(show.poster_path, 'original')
      : `${siteUrl}/og-default.jpg`;

    return {
      title: {
        absolute: title,
      },
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: 'video.tv_show',
        url: canonicalUrl,
        title,
        description,
        siteName: 'RoseFlix',
        images: [
          {
            url: backdropUrl,
            width: 1280,
            height: 720,
            alt: `Watch ${show.name} Season ${s} Episode ${e} on RoseFlix`,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
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
      title: 'Watch TV Series Online Full HD | RoseFlix',
      description: 'Stream trending full HD TV shows online on RoseFlix with fast servers and subtitles.',
    };
  }
}

export default async function TVWatchPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sParams = await searchParams;

  const currentSeason = parseInt(sParams.s || '1', 10);
  const currentEpisode = parseInt(sParams.e || '1', 10);

  let show;
  try {
    show = await getTVDetails(id);
  } catch {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const year = formatYear(show.first_air_date);
  const topCast = show.credits?.cast.slice(0, 8) || [];
  const primaryGenre = show.genres?.[0];
  const recommendations = show.recommendations?.results || show.similar?.results || [];

  // Breadcrumbs items
  const breadcrumbItems = [
    { name: 'TV Series', url: '/tv' },
    ...(primaryGenre
      ? [{ name: primaryGenre.name, url: `/tv?genre=${primaryGenre.id}` }]
      : []),
    { name: `${show.name} S${currentSeason} E${currentEpisode}`, url: `${siteUrl}/watch/tv/${show.id}` },
  ];

  // Schema.org Structured Data
  const tvSchema = buildTVSeriesSchema(show, siteUrl);
  const videoSchema = buildVideoObjectSchema({
    name: `Watch ${show.name} Season ${currentSeason} Episode ${currentEpisode} (${year}) Online`,
    description: show.overview || `Stream ${show.name} in HD online on RoseFlix.`,
    thumbnailUrl: show.backdrop_path
      ? getTMDBImageUrl(show.backdrop_path, 'original')
      : show.poster_path
      ? getTMDBImageUrl(show.poster_path, 'original')
      : `${siteUrl}/og-default.jpg`,
    uploadDate: show.first_air_date,
    embedUrl: `${siteUrl}/watch/tv/${show.id}`,
  });
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16">
      {/* Rich Snippets (TVSeries, VideoObject, Breadcrumbs) */}
      <JsonLd data={[tvSchema, videoSchema, breadcrumbSchema]} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Semantic Visible Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* TV Video Player + Episode Selector */}
        <section className="mb-8" aria-label={`TV Player for ${show.name}`}>
          <TVPlayerSection
            tvId={show.id}
            showTitle={show.name}
            backdropPath={show.backdrop_path}
            seasons={show.seasons || []}
            initialSeason={currentSeason}
            initialEpisode={currentEpisode}
          />
        </section>

        {/* Ad Banner below Player */}
        <AdBanner zone="player-bottom" />

        {/* SEO-Rich Show Metadata & Content Depth Section */}
        <article className="bg-[#0e0e13] border border-white/5 rounded-2xl p-6 sm:p-8 mt-6">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Poster Thumbnail */}
            <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#161620] shrink-0 border border-white/10 shadow-xl self-start">
              <Image
                src={getTMDBImageUrl(show.poster_path, 'w342')}
                alt={`${show.name} (${year}) official series poster`}
                fill
                priority={false}
                loading="lazy"
                decoding="async"
                className="object-cover"
                sizes="(max-width: 640px) 144px, 192px"
              />
            </div>

            {/* Details Content */}
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span
                    className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                      color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                    }}
                  >
                    TV Series
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white">
                    Full HD 1080p
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{formatRating(show.vote_average)}</span>
                    <span className="text-slate-400 font-normal">({show.vote_count.toLocaleString()} votes)</span>
                  </div>
                </div>

                {/* Primary Single <h1> for Target SEO Keyword */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Watch {show.name} Season {currentSeason} Episode {currentEpisode} ({year}) Online
                </h1>

                {show.tagline && (
                  <p className="text-sm italic mt-1" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>{show.tagline}</p>
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
                    <Layers className="w-4 h-4 text-slate-500" />
                    Seasons: <strong className="text-white font-medium">{show.number_of_seasons}</strong>
                  </span>
                )}
                {show.number_of_episodes && (
                  <span>
                    Total Episodes: <strong className="text-white font-medium">{show.number_of_episodes}</strong>
                  </span>
                )}
                {show.original_language && (
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-slate-500" />
                    Original Language: <strong className="text-white font-medium uppercase">{show.original_language}</strong>
                  </span>
                )}
              </div>

              {/* Internal Linking: Genre Tags */}
              {show.genres && show.genres.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 font-medium">Genres:</span>
                  {show.genres.map((g) => (
                    <Link
                      key={g.id}
                      href={`/tv?genre=${g.id}`}
                      title={`Browse ${g.name} Series`}
                      className="text-xs px-3 py-1 rounded-full bg-[#161620] text-slate-300 hover:text-white border border-white/10 hover:border-[var(--primary-color)] transition-colors"
                    >
                      {g.name}
                    </Link>
                  ))}
                </div>
              )}

              {/* Synopsis & Content Depth */}
              <div className="space-y-1.5">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Series Overview & Synopsis
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {show.overview || `Watch ${show.name} (${year}) online in full HD with multiple fast streaming servers, episode selector, and English subtitles on ${SITE_CONFIG.NAME}.`}
                </p>
              </div>

              {/* Production Companies */}
              {show.production_companies && show.production_companies.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                    Networks & Studios
                  </h3>
                  <p className="text-xs text-slate-300">
                    {show.production_companies.map((c) => c.name).join(' • ')}
                  </p>
                </div>
              )}

              {/* Featured Cast List */}
              {topCast.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                    Featured Cast
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {topCast.map((cast) => (
                      <div
                        key={cast.id}
                        className="flex items-center gap-2 p-1.5 pr-3 rounded-full bg-[#161620] border border-white/5"
                      >
                        <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-800 shrink-0">
                          {cast.profile_path ? (
                            <Image
                              src={getTMDBImageUrl(cast.profile_path, 'w300')}
                              alt={cast.name}
                              fill
                              sizes="24px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-[10px] text-white">
                              {cast.name[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-xs text-slate-200 font-medium">{cast.name}</span>
                        {cast.character && (
                          <span className="text-[11px] text-slate-500">as {cast.character}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </article>

        {/* Dense Internal Linking Web: Recommendations / Similar Shows */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <MediaCarousel
              title="More Shows You Might Enjoy"
              items={recommendations.map((t) => ({ ...t, media_type: 'tv' }))}
              viewAllHref="/tv"
              icon={<Tv className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
