import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Film, Tv, Sparkles, Flame } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import AdBanner from '@/components/ads/AdBanner';
import { searchMulti } from '@/lib/tmdb';
import { searchAnime } from '@/lib/anime';
import { searchKDramas } from '@/lib/kdrama';
import { getSiteUrl } from '@/lib/seo';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const sParams = await searchParams;
  const siteUrl = getSiteUrl();
  const query = sParams.q?.trim() || '';

  const title = query
    ? `Search Results for "${query}" | ${SITE_CONFIG.SITE_NAME}`
    : `Search Movies, TV Shows, Anime & K-Dramas in 1080p HD | ${SITE_CONFIG.SITE_NAME}`;

  const description = query
    ? `Stream movies, TV shows, anime, and K-dramas matching "${query}" in full 1080p HD online on ${SITE_CONFIG.SITE_NAME}.`
    : `Search our expansive catalog of movies, television series, anime, and Asian dramas to stream in full 1080p HD on ${SITE_CONFIG.SITE_NAME}.`;

  const canonicalUrl = `${siteUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ''}`;

  return {
    title: {
      absolute: title,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sParams = await searchParams;
  const query = sParams.q || '';
  const filterType = sParams.type || 'all';

  let results: any[] = [];
  if (query.trim()) {
    try {
      const promises: [Promise<any>, Promise<any>, Promise<any>] = [
        filterType === 'anime' || filterType === 'kdrama'
          ? Promise.resolve({ results: [] })
          : searchMulti(query.trim(), 1).catch(() => ({ results: [] })),
        filterType === 'movie' || filterType === 'tv' || filterType === 'kdrama'
          ? Promise.resolve([])
          : searchAnime(query.trim(), 16).catch(() => []),
        filterType === 'movie' || filterType === 'anime'
          ? Promise.resolve([])
          : searchKDramas(query.trim()).catch(() => []),
      ];

      const [tmdbData, animeData, kdramaData] = await Promise.all(promises);

      const tmdbResults = (tmdbData?.results || [])
        .filter(
          (item: any) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            (item.poster_path || item.backdrop_path)
        )
        .map((item: any) => ({
          ...item,
          media_type: item.media_type,
        }));

      const animeResults = (animeData || []).map((anime: any) => ({
        id: anime.id || anime.mal_id,
        mal_id: anime.id || anime.mal_id,
        title: anime.title || anime.name || anime.title_english,
        name: anime.name || anime.title || anime.title_english,
        poster_path: anime.poster_path || anime.images?.jpg?.large_image_url || null,
        backdrop_path: anime.backdrop_path || anime.trailer?.images?.maximum_image_url || null,
        release_date: anime.first_air_date || anime.release_date || '',
        first_air_date: anime.first_air_date || anime.release_date || '',
        vote_average: anime.vote_average || anime.score || 0,
        vote_count: anime.vote_count || anime.scored_by || 0,
        popularity: anime.popularity || 0,
        media_type: 'anime',
        anime_media_type: anime.anime_media_type || 'tv',
        overview: anime.overview || anime.synopsis || '',
      }));

      const kdramaResults = (kdramaData || []).map((k: any) => ({
        ...k,
        media_type: 'kdrama',
      }));

      if (filterType === 'movie') {
        results = tmdbResults.filter((i: any) => i.media_type === 'movie');
      } else if (filterType === 'tv') {
        results = tmdbResults.filter((i: any) => i.media_type === 'tv');
      } else if (filterType === 'anime') {
        results = animeResults;
      } else if (filterType === 'kdrama') {
        results = kdramaResults;
      } else {
        const kdramaIds = new Set(kdramaResults.map((k: any) => k.id));
        const taggedTmdb = tmdbResults.map((item: any) => {
          const isKorean =
            (item.origin_country && Array.isArray(item.origin_country) && item.origin_country.includes('KR')) ||
            item.original_language === 'ko' ||
            kdramaIds.has(item.id);
          if (isKorean) {
            return { ...item, media_type: 'kdrama' };
          }
          return item;
        });

        const existingIds = new Set(taggedTmdb.map((i: any) => i.id));
        const additionalKdramas = kdramaResults.filter((k: any) => !existingIds.has(k.id));

        results = [...taggedTmdb, ...additionalKdramas, ...animeResults];
      }
    } catch (err) {
      console.error('Search query error:', err);
    }
  }

  const nameParts = SITE_CONFIG.SITE_NAME.match(/([A-Z][a-z]+|[A-Z]+)/g) || [SITE_CONFIG.SITE_NAME];
  const brandPrefix = nameParts[0] || SITE_CONFIG.SITE_NAME;
  const brandSuffix = nameParts.slice(1).join('') || '';

  return (
    <div className="min-h-screen pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Search Header */}
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4">
          Search {brandPrefix}
          <span style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>{brandSuffix || 'Flix'}</span>
        </h1>

        {/* Search Form */}
        <form action="/search" method="GET" className="relative flex items-center">
          <Search
            className="absolute left-4 w-5 h-5"
            style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
          />
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder={`Search movies, TV shows, anime & K-dramas on ${SITE_CONFIG.SITE_NAME}...`}
            className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-[#111116] border border-white/10 text-white placeholder-slate-400 focus:outline-none shadow-xl text-base transition-colors"
          />
          {filterType !== 'all' && (
            <input type="hidden" name="type" value={filterType} />
          )}
          <button
            type="submit"
            className="absolute right-2 px-5 py-2 rounded-xl text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              boxShadow: `0 0 15px ${SITE_CONFIG.PRIMARY_COLOR}60`,
            }}
          >
            Search
          </button>
        </form>
      </div>

      {/* Search Ad slot */}
      <AdBanner zone="search-top" />

      {query.trim() && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
          <p className="text-sm text-slate-400">
            Found <strong className="text-white">{results.length}</strong> results for &ldquo;
            <span style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>{query}</span>&rdquo;
          </p>

          {/* Type filters */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'All', icon: null },
              { id: 'movie', label: 'Movies', icon: <Film className="w-3 h-3" /> },
              { id: 'tv', label: 'TV Shows', icon: <Tv className="w-3 h-3" /> },
              { id: 'anime', label: 'Anime', icon: <Sparkles className="w-3 h-3" /> },
              { id: 'kdrama', label: 'K-Dramas', icon: <Flame className="w-3 h-3" /> },
            ].map((filter) => {
              const isActive = filterType === filter.id;
              return (
                <Link
                  key={filter.id}
                  href={`/search?q=${encodeURIComponent(query)}&type=${filter.id}`}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1 ${
                    isActive
                      ? 'text-white'
                      : 'bg-[#111116] text-slate-400 hover:text-white'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                          boxShadow: `0 0 10px ${SITE_CONFIG.PRIMARY_COLOR}60`,
                        }
                      : {}
                  }
                >
                  {filter.icon}
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
          {results.map((item, idx) => (
            <MediaCard key={`${item.media_type}-${item.id}`} item={item} priority={idx < 6} />
          ))}
        </div>
      ) : query.trim() ? (
        <div className="py-20 text-center text-slate-400">
          <p className="text-lg text-white font-medium">No results found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-slate-500 mt-2">
            Try checking spelling or search for another popular movie, series, anime, or K-drama.
          </p>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-sm">
          Enter a title above to begin searching thousands of movies, TV series, anime, and Asian dramas.
        </div>
      )}
    </div>
  );
}
