import { DetailedMovie, DetailedTVShow } from '@/lib/tmdb';
import { getTMDBImageUrl } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';

export function getSiteUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return SITE_CONFIG.SITE_URL;
}

/**
 * Truncates and formats description strictly to 155–160 chars for optimal Google snippet display
 */
export function cleanMetaDescription(
  overview: string | undefined | null,
  fallbackCta: string = `Stream in full 1080p HD online on ${SITE_CONFIG.SITE_NAME}.`
): string {
  if (!overview || !overview.trim()) {
    return `Watch full movies, TV series, anime, and K-dramas online in crisp 1080p HD with English subtitles. ${fallbackCta}`.slice(0, 160);
  }

  const clean = overview.replace(/\s+/g, ' ').trim();
  const maxOverviewLength = 160 - fallbackCta.length - 2;

  if (clean.length <= maxOverviewLength) {
    return `${clean} ${fallbackCta}`.slice(0, 160);
  }

  // Trim to nearest word boundary
  const trimmed = clean.slice(0, maxOverviewLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  const safeText = lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed;

  return `${safeText}... ${fallbackCta}`.slice(0, 160);
}

/**
 * Movie Schema.org Rich Snippet
 */
export function buildMovieSchema(movie: DetailedMovie, baseUrl: string) {
  const posterUrl = movie.poster_path ? getTMDBImageUrl(movie.poster_path, 'original') : undefined;
  const backdropUrl = movie.backdrop_path ? getTMDBImageUrl(movie.backdrop_path, 'original') : undefined;
  const topCast = movie.credits?.cast.slice(0, 5) || [];
  const director = movie.credits?.crew.find((c) => c.job === 'Director')?.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    url: `${baseUrl}/watch/movie/${movie.id}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    datePublished: movie.release_date || undefined,
    description: movie.overview || undefined,
    genre: movie.genres?.map((g) => g.name) || [],
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    director: director ? { '@type': 'Person', name: director } : undefined,
    actor: topCast.map((c) => ({
      '@type': 'Person',
      name: c.name,
    })),
    aggregateRating: movie.vote_count && movie.vote_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '1',
          ratingCount: movie.vote_count,
        }
      : undefined,
  };
}

/**
 * TV Series Schema.org Rich Snippet
 */
export function buildTVSeriesSchema(show: DetailedTVShow, baseUrl: string) {
  const posterUrl = show.poster_path ? getTMDBImageUrl(show.poster_path, 'original') : undefined;
  const backdropUrl = show.backdrop_path ? getTMDBImageUrl(show.backdrop_path, 'original') : undefined;
  const topCast = show.credits?.cast.slice(0, 5) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    url: `${baseUrl}/watch/tv/${show.id}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    startDate: show.first_air_date || undefined,
    description: show.overview || undefined,
    genre: show.genres?.map((g) => g.name) || [],
    numberOfSeasons: show.number_of_seasons || undefined,
    numberOfEpisodes: show.number_of_episodes || undefined,
    actor: topCast.map((c) => ({
      '@type': 'Person',
      name: c.name,
    })),
    aggregateRating: show.vote_count && show.vote_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: show.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '1',
          ratingCount: show.vote_count,
        }
      : undefined,
  };
}

/**
 * K-Drama Series Schema.org Rich Snippet (with inLanguage: 'ko' and subtitleLanguage: 'en')
 */
export function buildKDramaSeriesSchema(
  show: DetailedTVShow,
  baseUrl: string,
  season: number = 1,
  episode: number = 1
) {
  const posterUrl = show.poster_path ? getTMDBImageUrl(show.poster_path, 'original') : undefined;
  const backdropUrl = show.backdrop_path ? getTMDBImageUrl(show.backdrop_path, 'original') : undefined;
  const topCast = show.credits?.cast.slice(0, 5) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    alternateName: [show.original_name].filter(Boolean),
    url: `${baseUrl}/watch/kdrama/${show.id}?s=${season}&e=${episode}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    startDate: show.first_air_date || undefined,
    description: show.overview || undefined,
    genre: show.genres?.map((g) => g.name) || [],
    numberOfSeasons: show.number_of_seasons || undefined,
    numberOfEpisodes: show.number_of_episodes || undefined,
    inLanguage: 'ko',
    subtitleLanguage: 'en',
    actor: topCast.map((c) => ({
      '@type': 'Person',
      name: c.name,
    })),
    aggregateRating: show.vote_count && show.vote_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: show.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '1',
          ratingCount: show.vote_count,
        }
      : undefined,
  };
}

/**
 * VideoObject Schema for Watch Pages (Enables Google Video Carousels & Badges)
 */
export function buildVideoObjectSchema(params: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate?: string;
  embedUrl: string;
  duration?: number; // in minutes
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: params.name,
    description: params.description,
    thumbnailUrl: [params.thumbnailUrl],
    uploadDate: params.uploadDate || new Date().toISOString(),
    embedUrl: params.embedUrl,
    duration: params.duration ? `PT${params.duration}M` : undefined,
    potentialAction: {
      '@type': 'SeekToAction',
      target: `${params.embedUrl}?t={seek_to_second_number}`,
      'startOffset-input': 'required name=seek_to_second_number',
    },
  };
}

/**
 * BreadcrumbList Schema (Hierarchical Breadcrumbs in SERPs)
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Anime Series Schema.org Rich Snippet
 */
export function buildAnimeSeriesSchema(anime: any, baseUrl: string, episode: number = 1) {
  const title = anime.title_english || anime.title;
  const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const backdropUrl = anime.trailer?.images?.maximum_image_url || posterUrl;
  const studios = anime.studios?.map((s: any) => ({ '@type': 'Organization', name: s.name })) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    alternateName: [anime.title, anime.title_japanese].filter(Boolean),
    url: `${baseUrl}/watch/anime/${anime.mal_id}?ep=${episode}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    startDate: anime.aired?.from ? anime.aired.from.slice(0, 10) : undefined,
    description: anime.synopsis || undefined,
    genre: anime.genres?.map((g: any) => g.name) || [],
    numberOfEpisodes: anime.episodes || undefined,
    productionCompany: studios,
    aggregateRating:
      anime.score && anime.score > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: anime.score.toFixed(1),
            bestRating: '10',
            worstRating: '1',
            ratingCount: anime.scored_by || 100,
          }
        : undefined,
  };
}

/**
 * WebSite Schema with SearchAction for Google Sitelinks Search Box
 */
export function buildWebSiteSearchSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.SITE_NAME,
    alternateName: [`${SITE_CONFIG.SITE_NAME} HD`, `${SITE_CONFIG.SITE_NAME} Stream`],
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
