import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Tv, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { discoverTV, getTVGenres } from '@/lib/tmdb';
import { getSiteUrl, buildBreadcrumbSchema } from '@/lib/seo';

import { SITE_CONFIG } from '@/lib/siteConfig';

interface TVPageProps {
  searchParams: Promise<{ genre?: string; page?: string; sort?: string }>;
}

export async function generateMetadata({ searchParams }: TVPageProps): Promise<Metadata> {
  const sParams = await searchParams;
  const siteUrl = getSiteUrl();
  const selectedGenre = sParams.genre;
  const page = sParams.page ? parseInt(sParams.page, 10) : 1;

  let genreName = '';
  if (selectedGenre) {
    try {
      const genres = await getTVGenres();
      genreName = genres.find((g) => g.id.toString() === selectedGenre)?.name || '';
    } catch {}
  }

  const title = genreName
    ? `Watch ${genreName} TV Series Online Free in Full HD${page > 1 ? ` (Page ${page})` : ''} | ${SITE_CONFIG.SITE_NAME}`
    : `Watch TV Series Online Free in Full HD${page > 1 ? ` (Page ${page})` : ''} | ${SITE_CONFIG.SITE_NAME}`;

  const description = genreName
    ? `Binge the best ${genreName} TV series online in 1080p HD on ${SITE_CONFIG.SITE_NAME}. Instant multi-server streaming with English subtitles.`
    : `Binge full seasons and episodes of top-rated TV shows, anime, and dramas online in HD on ${SITE_CONFIG.SITE_NAME}. Free streaming across redundant servers.`;

  const canonicalUrl = `${siteUrl}/tv${selectedGenre ? `?genre=${selectedGenre}` : ''}`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: 'website',
      url: canonicalUrl,
      title,
      description,
      siteName: SITE_CONFIG.SITE_NAME,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function TVCatalogPage({ searchParams }: TVPageProps) {
  const sParams = await searchParams;
  const selectedGenre = sParams.genre;
  const currentPage = parseInt(sParams.page || '1', 10);
  const sortBy = sParams.sort || 'popularity.desc';
  const siteUrl = getSiteUrl();

  const [genres, tvData] = await Promise.all([
    getTVGenres(),
    discoverTV({
      genreId: selectedGenre,
      sortBy,
      page: currentPage,
    }),
  ]);

  const shows = (tvData?.results || []).map((t) => ({ ...t, media_type: 'tv' as const }));
  const totalPages = Math.min(tvData?.total_pages || 1, 500);

  const activeGenreName = genres.find((g) => g.id.toString() === selectedGenre)?.name;

  // Breadcrumbs items
  const breadcrumbItems = [
    { name: 'TV Series', url: `${siteUrl}/tv` },
    ...(activeGenreName
      ? [{ name: `${activeGenreName} Series`, url: `${siteUrl}/tv?genre=${selectedGenre}` }]
      : []),
  ];
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbItems);

  return (
    <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Schema.org Breadcrumb */}
      <JsonLd data={breadcrumbSchema} />

      {/* Semantic Visible Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* Page Title & Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <div
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1.5"
            style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
          >
            <Tv className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            Series Catalog
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {activeGenreName ? `${activeGenreName} TV Series` : 'All TV Shows in Full HD'}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Explore trending series, critically acclaimed seasons, and binge-worthy drama.
          </p>
        </div>

        {/* Page counter */}
        <div className="text-xs text-slate-400 bg-[#111116] px-3.5 py-1.5 rounded-full border border-white/5">
          Page <strong className="text-white">{currentPage}</strong> of {totalPages}
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
          <Filter className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          Filter by Genre
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tv"
            className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium ${
              !selectedGenre
                ? 'shadow-md font-semibold'
                : 'bg-[#111116] text-slate-300 hover:text-white hover:bg-[#1a1a24] border border-white/5'
            }`}
            style={
              !selectedGenre
                ? {
                    backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                    color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                    boxShadow: `0 0 12px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                  }
                : undefined
            }
          >
            All Genres
          </Link>

          {genres.map((g) => {
            const isSelected = selectedGenre === g.id.toString();
            return (
              <Link
                key={g.id}
                href={`/tv?genre=${g.id}`}
                className={`text-xs px-3.5 py-1.5 rounded-full transition-all font-medium ${
                  isSelected
                    ? 'shadow-md font-semibold'
                    : 'bg-[#111116] text-slate-300 hover:text-white hover:bg-[#1a1a24] border border-white/5'
                }`}
                style={
                  isSelected
                    ? {
                        backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                        color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                        boxShadow: `0 0 12px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                      }
                    : undefined
                }
              >
                {g.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Shows Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
        {shows.map((show, idx) => (
          <MediaCard key={show.id} item={show} priority={idx < 6} />
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-12 flex items-center justify-center gap-4">
        {currentPage > 1 && (
          <Link
            href={`/tv?${selectedGenre ? `genre=${selectedGenre}&` : ''}page=${currentPage - 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111116] border border-white/10 hover:border-[var(--primary-color)] text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Page
          </Link>
        )}

        <span className="text-xs text-slate-400 px-3 py-2 rounded-xl bg-[#0b0b0e] border border-white/5">
          {currentPage} / {totalPages}
        </span>

        {currentPage < totalPages && (
          <Link
            href={`/tv?${selectedGenre ? `genre=${selectedGenre}&` : ''}page=${currentPage + 1}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#111116] border border-white/10 hover:border-[var(--primary-color)] text-white transition-colors"
          >
            Next Page
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
