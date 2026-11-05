import React from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { Star, Clock, Calendar, Film, Users, Building, Globe, CheckCircle } from 'lucide-react';
import VideoPlayer from '@/components/media/VideoPlayer';
import MediaCarousel from '@/components/media/MediaCarousel';
import AdBanner from '@/components/ads/AdBanner';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import TenantWatchSeoBlock from '@/components/seo/TenantWatchSeoBlock';
import { getMovieDetails } from '@/lib/tmdb';
import { getTMDBImageUrl, formatYear, formatRating, formatRuntime } from '@/lib/utils';
import {
  getSiteUrl,
  generateTenantWatchMetadata,
  generateTenantSeoFaqs,
  buildWatchPageGraphSchema,
} from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  try {
    const movie = await getMovieDetails(id);
    const year = formatYear(movie.release_date);
    const topCast = movie.credits?.cast.slice(0, 3).map((c) => c.name) || [];
    const director = movie.credits?.crew.find((c) => c.job === 'Director')?.name || null;
    const backdropUrl = movie.backdrop_path
      ? getTMDBImageUrl(movie.backdrop_path, 'original')
      : movie.poster_path
      ? getTMDBImageUrl(movie.poster_path, 'original')
      : undefined;

    let requestHost: string | null = null;
    try {
      const headerList = await headers();
      requestHost = headerList.get('x-forwarded-host') || headerList.get('host');
    } catch {}

    return generateTenantWatchMetadata({
      id,
      mediaType: 'movie',
      title: movie.title,
      year,
      overview: movie.overview,
      backdropUrl,
      director,
      cast: topCast,
      genres: movie.genres?.map((g) => g.name),
      requestHost,
    });
  } catch {
    return {
      title: {
        absolute: `Watch Movie Online Full HD | ${SITE_CONFIG.SITE_NAME}`,
      },
      description: `Stream trending full HD movies online on ${SITE_CONFIG.SITE_NAME} with fast servers and subtitles.`,
    };
  }
}

export default async function MovieWatchPage({ params }: PageProps) {
  const { id } = await params;
  let movie;
  try {
    movie = await getMovieDetails(id);
  } catch {
    notFound();
  }

  const siteUrl = getSiteUrl();
  const year = formatYear(movie.release_date);
  const runtime = formatRuntime(movie.runtime);
  const director = movie.credits?.crew.find((c) => c.job === 'Director')?.name;
  const topCast = movie.credits?.cast.slice(0, 8) || [];
  const recommendations = movie.recommendations?.results.length
    ? movie.recommendations.results
    : movie.similar?.results || [];

  const backdropUrl = movie.backdrop_path
    ? getTMDBImageUrl(movie.backdrop_path, 'original')
    : movie.poster_path
    ? getTMDBImageUrl(movie.poster_path, 'original')
    : `${siteUrl}/og-default.jpg`;

  const breadcrumbItems = [
    { name: 'Movies', url: '/movies' },
    { name: movie.title, url: `/watch/movie/${movie.id}` },
  ];

  let requestHost: string | null = null;
  try {
    const headerList = await headers();
    requestHost = headerList.get('x-forwarded-host') || headerList.get('host');
  } catch {}

  // Dynamic FAQs & Full Multi-Graph Schema
  const faqs = generateTenantSeoFaqs({
    id: movie.id,
    mediaType: 'movie',
    title: movie.title,
    year,
    overview: movie.overview,
    director,
    cast: topCast.map((c) => c.name),
    genres: movie.genres?.map((g) => g.name),
    requestHost,
  });

  const fullSchema = buildWatchPageGraphSchema({
    id: movie.id,
    mediaType: 'movie',
    title: movie.title,
    year,
    overview: movie.overview,
    backdropUrl,
    embedUrl: `${siteUrl}/watch/movie/${movie.id}`,
    faqs,
    runtimeMinutes: movie.runtime || 110,
    director,
    cast: topCast.map((c) => c.name),
    rating: movie.vote_average || 7.5,
    ratingCount: movie.vote_count || 1000,
    genres: movie.genres?.map((g) => g.name),
    requestHost,
  });

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16">
      {/* Rich Snippets (Movie, VideoObject, Breadcrumbs, FAQPage) */}
      <JsonLd data={fullSchema} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Semantic Visible Breadcrumb Navigation */}
        <Breadcrumbs items={breadcrumbItems} />

        {/* Video Player & Server Switcher Section */}
        <section className="mb-8" aria-label={`Video Player for ${movie.title}`}>
          <VideoPlayer
            tmdbId={movie.id}
            type="movie"
            title={movie.title}
            backdropPath={movie.backdrop_path}
          />
        </section>

        {/* Ad Placement below Video Player */}
        <AdBanner zone="player-bottom" />

        {/* SEO-Rich Movie Metadata & Content Depth Section */}
        <article className="bg-[#0e0e13] border border-white/5 rounded-2xl p-6 sm:p-8 mt-6">
          <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
            {/* Poster Thumbnail */}
            <div className="relative w-36 sm:w-48 aspect-[2/3] rounded-xl overflow-hidden bg-[#161620] shrink-0 border border-white/10 shadow-xl self-start">
              <Image
                src={getTMDBImageUrl(movie.poster_path, 'w342')}
                alt={`${movie.title} (${year}) official movie poster`}
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
                    Movie
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-white">
                    Full HD 1080p
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-400 border border-amber-400/20">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{formatRating(movie.vote_average)}</span>
                    <span className="text-slate-400 font-normal">({movie.vote_count.toLocaleString()} votes)</span>
                  </div>
                </div>

                {/* Primary Single <h1> for Target SEO Keyword */}
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                  Watch {movie.title} ({year}) Online Full HD
                </h1>

                {movie.tagline && (
                  <p className="text-sm italic mt-1" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>{movie.tagline}</p>
                )}
              </div>

              {/* Meta stats */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 border-y border-white/5 py-3">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Release: <strong className="text-white font-medium">{movie.release_date || year}</strong>
                </span>
                {runtime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Duration: <strong className="text-white font-medium">{runtime}</strong>
                  </span>
                )}
                {director && (
                  <span>
                    Director: <strong className="text-white font-medium">{director}</strong>
                  </span>
                )}
              </div>

              {/* Genres */}
              {movie.genres && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {movie.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="text-xs px-3 py-1 rounded-full bg-[#181824] text-slate-300 border border-white/5"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              {movie.overview && (
                <div className="space-y-1.5 pt-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Overview</h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{movie.overview}</p>
                </div>
              )}

              {/* Cast */}
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

        {/* Tenant-Specific Anti-Duplicate SSR Specs & SEO FAQ Section */}
        <TenantWatchSeoBlock
          mediaType="movie"
          requestHost={requestHost}
          id={movie.id}
          title={movie.title}
          year={year}
          runtimeMinutes={movie.runtime}
          director={director}
          cast={topCast.map((c) => c.name)}
          genres={movie.genres?.map((g) => g.name)}
          overview={movie.overview}
          rating={movie.vote_average}
          ratingCount={movie.vote_count}
          faqs={faqs}
        />

        {/* Dense Internal Linking Web: Recommendations / Similar Movies */}
        {recommendations.length > 0 && (
          <div className="mt-12">
            <MediaCarousel
              title="You May Also Like"
              items={recommendations.map((m) => ({ ...m, media_type: 'movie' }))}
              viewAllHref="/movies"
              icon={<Film className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />}
            />
          </div>
        )}
      </div>
    </div>
  );
}
