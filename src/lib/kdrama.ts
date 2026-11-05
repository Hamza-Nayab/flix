import dns from 'node:dns';
import { TVShow, TMDBResponse } from '@/types/tmdb';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

const TMDB_BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;

// High-performance In-Memory Cache with TTL & Circuit Breaker
const kdramaCache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

let isKdramaDown = false;
let kdramaDownUntil = 0;

export function slugify(text: string): string {
  if (!text) return 'kdrama';
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'kdrama'
  );
}

export type KDramaItem = Omit<TVShow, 'media_type'> & {
  media_type: 'kdrama';
  imdb_id?: string | null;
  slug?: string | null;
};

// Resilient fallback catalog for offline builds & network timeout safety
export const FALLBACK_KDRAMA_LIST: KDramaItem[] = [
  {
    id: 93405,
    imdb_id: 'tt10919420',
    slug: 'squid-game',
    name: 'Squid Game',
    original_name: '오징어 게임',
    overview:
      'Hundreds of cash-strapped players accept a strange invitation to compete in children\'s games. Inside, a tempting prize awaits with deadly high stakes.',
    poster_path: '/1QdXdRYfktUSONkl1oD5gc6Be0s.jpg',
    backdrop_path: '/5aE1kxWg6RhgQxJTXTxifv4uq7P.jpg',
    first_air_date: '2021-09-17',
    vote_average: 8.4,
    vote_count: 14200,
    popularity: 180.5,
    media_type: 'kdrama',
    number_of_seasons: 2,
    number_of_episodes: 15,
  },
  {
    id: 215720,
    imdb_id: 'tt27668559',
    slug: 'queen-of-tears',
    name: 'Queen of Tears',
    original_name: '눈물의 여왕',
    overview:
      'The queen of department stores and the prince of supermarkets weather a marital crisis until love miraculously begins to bloom again.',
    poster_path: '/7ZXLZ3KYL3IVvsSHBZaHjcNQzNU.jpg',
    backdrop_path: '/wcP3FsRLog4GNEs9PFrDKKQdcof.jpg',
    first_air_date: '2024-03-09',
    vote_average: 8.7,
    vote_count: 850,
    popularity: 120.4,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 16,
  },
  {
    id: 94796,
    imdb_id: 'tt10850932',
    slug: 'crash-landing-on-you',
    name: 'Crash Landing on You',
    original_name: '사랑의 불시착',
    overview:
      'A paragliding mishap drops a South Korean heiress in North Korea - and into the life of an army officer, who decides he will help her hide.',
    poster_path: '/fgBNLPr6mC8pxuR79ENAJY4nBmj.jpg',
    backdrop_path: '/3yEHM2HT2vrUtO93YzTJNgEfiZG.jpg',
    first_air_date: '2019-12-14',
    vote_average: 8.6,
    vote_count: 1200,
    popularity: 95.2,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 16,
  },
  {
    id: 117376,
    imdb_id: 'tt13433812',
    slug: 'vincenzo',
    name: 'Vincenzo',
    original_name: '빈센조',
    overview:
      'During a visit to his motherland, a Korean-Italian mafia lawyer gives an unrivaled conglomerate a taste of its own medicine with a side of justice.',
    poster_path: '/qbkSS1cTjT4DzIwD44bdhTuYgdT.jpg',
    backdrop_path: '/sf7NCqyVUNoyjYuwW5oJke1T1lH.jpg',
    first_air_date: '2021-02-20',
    vote_average: 8.8,
    vote_count: 1100,
    popularity: 88.0,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 20,
  },
  {
    id: 136283,
    imdb_id: 'tt21344706',
    slug: 'the-glory',
    name: 'The Glory',
    original_name: '더 글로리',
    overview:
      'Years after surviving horrific abuse in high school, a woman puts an elaborate revenge plot in motion to make the perpetrators pay for their crimes.',
    poster_path: '/uUM4LVlPgIrww07OoEKrGWlS1Ej.jpg',
    backdrop_path: '/AjwoDj77HLlqcpwEGqsnvMXm5my.jpg',
    first_air_date: '2022-12-30',
    vote_average: 8.6,
    vote_count: 980,
    popularity: 92.1,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 16,
  },
  {
    id: 99966,
    imdb_id: 'tt14169960',
    slug: 'all-of-us-are-dead',
    name: 'All of Us Are Dead',
    original_name: '지금 우리 학교는',
    overview:
      'A high school becomes ground zero for a zombie virus outbreak. Trapped students must fight their way out or turn into one of the infected.',
    poster_path: '/pTEFqAjLd5YTsMD6NSUxV6Dq7A6.jpg',
    backdrop_path: '/8hp2CuGnw1iP5dLBVMAPUv23swx.jpg',
    first_air_date: '2022-01-28',
    vote_average: 8.3,
    vote_count: 4500,
    popularity: 110.0,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 12,
  },
  {
    id: 67915,
    imdb_id: 'tt5994364',
    slug: 'goblin',
    name: 'Guardian: The Lonely and Great God',
    original_name: '쓸쓸하고 찬란하神-도깨비',
    overview:
      'In his quest for a bride to break his immortal curse, Dokkaebi meets a grim reaper and a sprightly student with a tragic past.',
    poster_path: '/c27bBc9879u05gz9kRwhvTqC9o2.jpg',
    backdrop_path: '/zGUt7gBf390h9hQz0w79W0xTjT9.jpg',
    first_air_date: '2016-12-02',
    vote_average: 8.8,
    vote_count: 1400,
    popularity: 85.0,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 16,
  },
  {
    id: 135157,
    imdb_id: 'tt19895920',
    slug: 'alchemy-of-souls',
    name: 'Alchemy of Souls',
    original_name: '환혼',
    overview:
      'A powerful sorceress in a blind woman\'s body encounters a man from a prestigious family, who wants her help to change his destiny.',
    poster_path: '/z2yqZpDut1h587211wL72bK97Bq.jpg',
    backdrop_path: '/hpeolJj0r067J8m8y52j4s5L3rG.jpg',
    first_air_date: '2022-06-18',
    vote_average: 8.7,
    vote_count: 890,
    popularity: 90.0,
    media_type: 'kdrama',
    number_of_seasons: 2,
    number_of_episodes: 30,
  },
  {
    id: 230923,
    imdb_id: 'tt30806483',
    slug: 'lovely-runner',
    name: 'Lovely Runner',
    original_name: '선재 업고 튀어',
    overview:
      'A devastated fan travels back in time to 2008 to save her favorite idol from a tragic fate.',
    poster_path: '/wO6wYwZl6sTq4bE5t3h3l7k6m4K.jpg',
    backdrop_path: '/wO6wYwZl6sTq4bE5t3h3l7k6m4K.jpg',
    first_air_date: '2024-04-08',
    vote_average: 8.9,
    vote_count: 550,
    popularity: 110.0,
    media_type: 'kdrama',
    number_of_seasons: 1,
    number_of_episodes: 16,
  },
];

async function kdramaFetch<T>(endpoint: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  const cacheKey = url.toString();
  const cached = kdramaCache.get(cacheKey);
  const now = Date.now();

  if (cached && now < cached.expiry) {
    return cached.data as T;
  }

  // Circuit breaker: immediately return empty list without network lag
  if (isKdramaDown && now < kdramaDownUntil) {
    return { results: [], page: 1, total_pages: 1, total_results: 0 } as unknown as T;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (TMDB_READ_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${TMDB_READ_ACCESS_TOKEN}`;
  } else if (TMDB_API_KEY) {
    url.searchParams.set('api_key', TMDB_API_KEY);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500); // 2.5s timeout

    const res = await fetch(url.toString(), {
      headers,
      signal: controller.signal,
      next: { revalidate: 3600 },
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`KDrama fetch failed [${res.status}]`);
    }

    const data = (await res.json()) as T;
    isKdramaDown = false;
    kdramaCache.set(cacheKey, { data, expiry: now + CACHE_TTL_MS });
    return data;
  } catch {
    isKdramaDown = true;
    kdramaDownUntil = Date.now() + 5 * 60 * 1000;
    return { results: [], page: 1, total_pages: 1, total_results: 0 } as unknown as T;
  }
}

/**
 * Trending & Airing Korean Dramas (KR origin, excluding animation genre 16)
 */
export async function getTrendingKDramas(page = 1): Promise<KDramaItem[]> {
  const data = await kdramaFetch<TMDBResponse<TVShow>>('/discover/tv', {
    with_origin_country: 'KR',
    without_genres: '16',
    sort_by: 'popularity.desc',
    page,
    include_adult: 'false',
  });

  const results = (data?.results || []).map((t) => ({ ...t, media_type: 'kdrama' as const }));
  return results.length > 0 ? results : (FALLBACK_KDRAMA_LIST as KDramaItem[]);
}

/**
 * All-Time Highest Rated K-Dramas (vote_count >= 150)
 */
export async function getTopRatedKDramas(page = 1): Promise<KDramaItem[]> {
  const data = await kdramaFetch<TMDBResponse<TVShow>>('/discover/tv', {
    with_origin_country: 'KR',
    without_genres: '16',
    'vote_count.gte': 150,
    sort_by: 'vote_average.desc',
    page,
    include_adult: 'false',
  });

  const results = (data?.results || []).map((t) => ({ ...t, media_type: 'kdrama' as const }));
  return results.length > 0 ? results : (FALLBACK_KDRAMA_LIST as KDramaItem[]);
}

/**
 * Korean Romance & Melodrama (genre 10749)
 */
export async function getRomanceKDramas(page = 1): Promise<KDramaItem[]> {
  const data = await kdramaFetch<TMDBResponse<TVShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '10749',
    without_genres: '16',
    sort_by: 'popularity.desc',
    page,
    include_adult: 'false',
  });

  const results = (data?.results || []).map((t) => ({ ...t, media_type: 'kdrama' as const }));
  return results.length > 0 ? results : (FALLBACK_KDRAMA_LIST as KDramaItem[]);
}

/**
 * Korean Crime, Thriller & Action (genres 10759, 9648, 80)
 */
export async function getThrillerKDramas(page = 1): Promise<KDramaItem[]> {
  const data = await kdramaFetch<TMDBResponse<TVShow>>('/discover/tv', {
    with_origin_country: 'KR',
    with_genres: '10759,9648,80',
    without_genres: '16',
    sort_by: 'popularity.desc',
    page,
    include_adult: 'false',
  });

  const results = (data?.results || []).map((t) => ({ ...t, media_type: 'kdrama' as const }));
  return results.length > 0 ? results : (FALLBACK_KDRAMA_LIST as KDramaItem[]);
}

/**
 * Popular C-Dramas, Taiwanese & Asian Series (origin KR|CN|TW|TH)
 */
export async function getAsianDramas(page = 1): Promise<KDramaItem[]> {
  const data = await kdramaFetch<TMDBResponse<TVShow>>('/discover/tv', {
    with_origin_country: 'KR|CN|TW|TH',
    without_genres: '16',
    sort_by: 'popularity.desc',
    page,
    include_adult: 'false',
  });

  const results = (data?.results || []).map((t) => ({ ...t, media_type: 'kdrama' as const }));
  return results.length > 0 ? results : (FALLBACK_KDRAMA_LIST as KDramaItem[]);
}

/**
 * Search Korean and Asian Dramas
 */
export async function searchKDramas(query: string): Promise<KDramaItem[]> {
  if (!query || !query.trim()) return [];

  const data = await kdramaFetch<TMDBResponse<TVShow>>('/search/tv', {
    query: query.trim(),
    include_adult: 'false',
  });

  const allowedOrigins = ['KR', 'CN', 'TW', 'TH'];
  const filtered = (data?.results || []).filter((item: any) => {
    const isAsianCountry = item.origin_country?.some((c: string) => allowedOrigins.includes(c));
    const isKoreanLanguage = item.original_language === 'ko';
    return isAsianCountry || isKoreanLanguage;
  });

  return filtered.map((t) => ({ ...t, media_type: 'kdrama' as const }));
}

/**
 * Fetch detailed Korean drama by TMDB ID with external IMDb ID and slug resolution
 */
export async function getKDramaById(id: string | number): Promise<any> {
  const idNum = Number(id);
  const fallback = FALLBACK_KDRAMA_LIST.find((d) => d.id === idNum);

  try {
    const data = await kdramaFetch<any>(`/tv/${idNum}`, {
      append_to_response: 'external_ids,recommendations,credits',
    });

    if (data && data.id) {
      const imdbId = data.external_ids?.imdb_id || fallback?.imdb_id || null;
      const slug = slugify(data.name || data.original_name || fallback?.name || `kdrama-${idNum}`);

      return {
        ...data,
        media_type: 'kdrama' as const,
        imdb_id: imdbId,
        slug,
      };
    }
  } catch (err) {
    // Graceful fallback
  }

  if (fallback) {
    return {
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
    };
  }

  return {
    ...FALLBACK_KDRAMA_LIST[0],
    id: idNum,
    name: `K-Drama #${idNum}`,
    original_name: `K-Drama #${idNum}`,
    slug: `kdrama-${idNum}`,
    imdb_id: null,
  };
}
