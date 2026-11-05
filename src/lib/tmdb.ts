import dns from 'node:dns';
import {
  Movie,
  TVShow,
  MediaItem,
  SeasonDetails,
  Credits,
  Genre,
  TMDBResponse,
} from '@/types/tmdb';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

// High-performance In-Memory Cache with TTL & Circuit Breaker
const tmdbCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let isTmdbDown = false;
let tmdbDownUntil = 0;

interface FetchOptions {
  revalidate?: number;
  params?: Record<string, string | number | undefined>;
}

async function tmdbFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const cacheKey = url.toString();
  const cached = tmdbCache.get(cacheKey);
  const now = Date.now();

  if (cached && now < cached.expiry) {
    return cached.data as T;
  }

  // Circuit Breaker: If TMDB tripped recently, return safe fallback immediately (0ms)
  if (isTmdbDown && now < tmdbDownUntil) {
    if (
      endpoint.includes('trending') ||
      endpoint.includes('popular') ||
      endpoint.includes('top_rated') ||
      endpoint.includes('discover') ||
      endpoint.includes('genre') ||
      endpoint.includes('search') ||
      endpoint.includes('recommendations') ||
      endpoint.includes('similar')
    ) {
      return { results: [], genres: [], page: 1, total_pages: 1, total_results: 0 } as unknown as T;
    }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (TMDB_READ_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_READ_ACCESS_TOKEN}`;
  } else if (TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY);
  }

  const revalidate = options.revalidate ?? 3600;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // Strict 2.5s timeout

    const res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
      next: { revalidate },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`TMDB Request failed [${res.status}]: ${res.statusText}`);
    }

    const data = (await res.json()) as T;
    isTmdbDown = false;
    tmdbCache.set(cacheKey, { data, expiry: now + CACHE_TTL_MS });
    return data;
  } catch (error) {
    // Trip Circuit Breaker for 5 minutes
    isTmdbDown = true;
    tmdbDownUntil = Date.now() + 5 * 60 * 1000;

    if (
      endpoint.includes('trending') ||
      endpoint.includes('popular') ||
      endpoint.includes('top_rated') ||
      endpoint.includes('discover') ||
      endpoint.includes('genre') ||
      endpoint.includes('search') ||
      endpoint.includes('recommendations') ||
      endpoint.includes('similar')
    ) {
      return { results: [], genres: [], page: 1, total_pages: 1, total_results: 0 } as unknown as T;
    }
    throw error;
  }
}

// ==================== HOME / TRENDING ====================

export async function getTrendingAll(timeWindow: 'day' | 'week' = 'week'): Promise<MediaItem[]> {
  const data = await tmdbFetch<TMDBResponse<MediaItem>>(`/trending/all/${timeWindow}`, {
    revalidate: 3600,
  });
  return (data?.results || []).filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
}

export async function getTrendingMovies(timeWindow: 'day' | 'week' = 'day'): Promise<Movie[]> {
  const data = await tmdbFetch<TMDBResponse<Movie>>(`/trending/movie/${timeWindow}`, {
    revalidate: 3600,
  });
  return (data?.results || []).map((m) => ({ ...m, media_type: 'movie' }));
}

export async function getTrendingTV(timeWindow: 'day' | 'week' = 'day'): Promise<TVShow[]> {
  const data = await tmdbFetch<TMDBResponse<TVShow>>(`/trending/tv/${timeWindow}`, {
    revalidate: 3600,
  });
  return (data?.results || []).map((t) => ({ ...t, media_type: 'tv' }));
}

export async function getPopularMovies(page: number = 1): Promise<Movie[]> {
  const data = await tmdbFetch<TMDBResponse<Movie>>('/movie/popular', {
    params: { page },
    revalidate: 3600,
  });
  return (data?.results || []).map((m) => ({ ...m, media_type: 'movie' }));
}

export async function getPopularTV(page: number = 1): Promise<TVShow[]> {
  const data = await tmdbFetch<TMDBResponse<TVShow>>('/tv/popular', {
    params: { page },
    revalidate: 3600,
  });
  return (data?.results || []).map((t) => ({ ...t, media_type: 'tv' }));
}

export async function getTopRatedMovies(page: number = 1): Promise<Movie[]> {
  const data = await tmdbFetch<TMDBResponse<Movie>>('/movie/top_rated', {
    params: { page },
    revalidate: 3600,
  });
  return (data?.results || []).map((m) => ({ ...m, media_type: 'movie' }));
}

export async function getTopRatedTV(page: number = 1): Promise<TVShow[]> {
  const data = await tmdbFetch<TMDBResponse<TVShow>>('/tv/top_rated', {
    params: { page },
    revalidate: 3600,
  });
  return (data?.results || []).map((t) => ({ ...t, media_type: 'tv' }));
}

// ==================== DISCOVER & GENRES ====================

export async function discoverMovies(options: {
  genreId?: string;
  sortBy?: string;
  page?: number;
}): Promise<TMDBResponse<Movie>> {
  return tmdbFetch<TMDBResponse<Movie>>('/discover/movie', {
    params: {
      with_genres: options.genreId,
      sort_by: options.sortBy || 'popularity.desc',
      page: options.page || 1,
      include_adult: 'false',
    },
    revalidate: 3600,
  });
}

export async function discoverTV(options: {
  genreId?: string;
  sortBy?: string;
  page?: number;
}): Promise<TMDBResponse<TVShow>> {
  return tmdbFetch<TMDBResponse<TVShow>>('/discover/tv', {
    params: {
      with_genres: options.genreId,
      sort_by: options.sortBy || 'popularity.desc',
      page: options.page || 1,
      include_adult: 'false',
    },
    revalidate: 3600,
  });
}

export async function getMovieGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/movie/list', {
    revalidate: 86400,
  });
  return data?.genres || [];
}

export async function getTVGenres(): Promise<Genre[]> {
  const data = await tmdbFetch<{ genres: Genre[] }>('/genre/tv/list', {
    revalidate: 86400,
  });
  return data?.genres || [];
}

// ==================== DETAILS & SEASONS ====================

export interface ExternalIds {
  imdb_id?: string | null;
  facebook_id?: string | null;
  instagram_id?: string | null;
  twitter_id?: string | null;
  wikidata_id?: string | null;
}

export interface DetailedMovie extends Movie {
  credits: Credits;
  recommendations: TMDBResponse<Movie>;
  similar: TMDBResponse<Movie>;
  external_ids?: ExternalIds;
}

export interface DetailedTVShow extends TVShow {
  credits: Credits;
  recommendations: TMDBResponse<TVShow>;
  similar: TMDBResponse<TVShow>;
  external_ids?: ExternalIds;
  imdb_id?: string | null;
}

export async function getMovieDetails(id: string | number): Promise<DetailedMovie> {
  return tmdbFetch<DetailedMovie>(`/movie/${id}`, {
    params: { append_to_response: 'credits,recommendations,similar,external_ids' },
    revalidate: 3600,
  });
}

export async function getTVShowDetails(id: string | number): Promise<DetailedTVShow> {
  return tmdbFetch<DetailedTVShow>(`/tv/${id}`, {
    params: { append_to_response: 'credits,recommendations,similar,external_ids' },
    revalidate: 3600,
  });
}

export const getTVDetails = getTVShowDetails;

export async function getSeasonDetails(
  tvId: string | number,
  seasonNumber: number
): Promise<SeasonDetails> {
  return tmdbFetch<SeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`, {
    revalidate: 3600,
  });
}

export const getTVSeason = getSeasonDetails;

// ==================== SEARCH ====================

export async function searchMulti(query: string, page: number = 1): Promise<TMDBResponse<MediaItem>> {
  return tmdbFetch<TMDBResponse<MediaItem>>('/search/multi', {
    params: {
      query,
      page,
      include_adult: 'false',
    },
    revalidate: 300,
  });
}
