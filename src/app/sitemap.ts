import { MetadataRoute } from 'next';
import {
  getTrendingMovies,
  getTrendingTV,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getTopRatedTV,
} from '@/lib/tmdb';
import { getTopAiringAnime, getMostPopularAnime } from '@/lib/anime';
import { getTrendingKDramas, getTopRatedKDramas, FALLBACK_KDRAMA_LIST } from '@/lib/kdrama';
import { getSiteUrl } from '@/lib/seo';
import { SITE_CONFIG, detectTenantId } from '@/lib/siteConfig';

export const revalidate = 86400; // Cache sitemap for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const niche = SITE_CONFIG.PRIMARY_NICHE;
  const now = new Date();

  // Core Static Category Hubs with Niche-Prioritized Ordering
  let hubPriorityList: Array<{ path: string; priority: number; changeFreq: 'daily' | 'weekly' }> = [];

  if (niche === 'anime') {
    hubPriorityList = [
      { path: '', priority: 1.0, changeFreq: 'daily' },
      { path: '/anime', priority: 0.98, changeFreq: 'daily' },
      { path: '/movies', priority: 0.80, changeFreq: 'daily' },
      { path: '/tv', priority: 0.75, changeFreq: 'daily' },
      { path: '/kdramas', priority: 0.70, changeFreq: 'daily' },
    ];
  } else if (niche === 'kdrama') {
    hubPriorityList = [
      { path: '', priority: 1.0, changeFreq: 'daily' },
      { path: '/kdramas', priority: 0.98, changeFreq: 'daily' },
      { path: '/tv', priority: 0.80, changeFreq: 'daily' },
      { path: '/movies', priority: 0.75, changeFreq: 'daily' },
      { path: '/anime', priority: 0.70, changeFreq: 'daily' },
    ];
  } else {
    // RoseFlix (Movies & TV Focus)
    hubPriorityList = [
      { path: '', priority: 1.0, changeFreq: 'daily' },
      { path: '/movies', priority: 0.98, changeFreq: 'daily' },
      { path: '/tv', priority: 0.95, changeFreq: 'daily' },
      { path: '/anime', priority: 0.75, changeFreq: 'daily' },
      { path: '/kdramas', priority: 0.75, changeFreq: 'daily' },
    ];
  }

  const staticRoutes: MetadataRoute.Sitemap = hubPriorityList.map((hub) => ({
    url: `${baseUrl}${hub.path}`,
    lastModified: now,
    changeFrequency: hub.changeFreq,
    priority: hub.priority,
  }));

  let movieRoutes: MetadataRoute.Sitemap = [];
  let tvRoutes: MetadataRoute.Sitemap = [];
  let animeRoutes: MetadataRoute.Sitemap = [];
  let kdramaRoutes: MetadataRoute.Sitemap = [];

  // 1. Fetch TMDB Movies & TV Shows
  try {
    const results = await Promise.allSettled([
      getTrendingMovies('day'),
      getTrendingMovies('week'),
      getPopularMovies(1),
      getTopRatedMovies(1),
      getTrendingTV('day'),
      getTrendingTV('week'),
      getPopularTV(1),
      getTopRatedTV(1),
    ]);

    const movieMap = new Map<number, boolean>();
    const trendingDayMovies = results[0].status === 'fulfilled' ? results[0].value : [];
    const trendingWeekMovies = results[1].status === 'fulfilled' ? results[1].value : [];
    const popularMovies = results[2].status === 'fulfilled' ? results[2].value : [];
    const topRatedMovies = results[3].status === 'fulfilled' ? results[3].value : [];

    [...trendingDayMovies, ...trendingWeekMovies].forEach((m) => {
      movieMap.set(m.id, true);
    });
    [...popularMovies, ...topRatedMovies].forEach((m) => {
      if (!movieMap.has(m.id)) movieMap.set(m.id, false);
    });

    const movieBoost = niche === 'movies' ? 0.1 : -0.05;
    movieRoutes = Array.from(movieMap.entries()).map(([id, isTrending]) => ({
      url: `${baseUrl}/watch/movie/${id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: Number(Math.min(0.95, Math.max(0.65, (isTrending ? 0.85 : 0.75) + movieBoost)).toFixed(2)),
    }));

    const tvMap = new Map<number, boolean>();
    const trendingDayTV = results[4].status === 'fulfilled' ? results[4].value : [];
    const trendingWeekTV = results[5].status === 'fulfilled' ? results[5].value : [];
    const popularTV = results[6].status === 'fulfilled' ? results[6].value : [];
    const topRatedTV = results[7].status === 'fulfilled' ? results[7].value : [];

    [...trendingDayTV, ...trendingWeekTV].forEach((t) => {
      tvMap.set(t.id, true);
    });
    [...popularTV, ...topRatedTV].forEach((t) => {
      if (!tvMap.has(t.id)) tvMap.set(t.id, false);
    });

    const tvBoost = niche === 'movies' ? 0.05 : -0.05;
    tvRoutes = Array.from(tvMap.entries()).map(([id, isTrending]) => ({
      url: `${baseUrl}/watch/tv/${id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: Number(Math.min(0.95, Math.max(0.65, (isTrending ? 0.85 : 0.75) + tvBoost)).toFixed(2)),
    }));
  } catch (error) {
    console.warn('Error generating TMDB sitemap routes:', error);
  }

  // 2. Fetch Anime Routes
  try {
    const [airingAnime, popularAnime] = await Promise.allSettled([
      getTopAiringAnime(30),
      getMostPopularAnime(30),
    ]);

    const animeMap = new Map<number, boolean>();
    if (airingAnime.status === 'fulfilled' && Array.isArray(airingAnime.value)) {
      airingAnime.value.forEach((a) => {
        if (a.mal_id) animeMap.set(a.mal_id, true);
      });
    }
    if (popularAnime.status === 'fulfilled' && Array.isArray(popularAnime.value)) {
      popularAnime.value.forEach((a) => {
        if (a.mal_id && !animeMap.has(a.mal_id)) {
          animeMap.set(a.mal_id, false);
        }
      });
    }

    const animeBoost = niche === 'anime' ? 0.15 : -0.05;
    animeRoutes = Array.from(animeMap.entries()).map(([malId, isAiring]) => ({
      url: `${baseUrl}/watch/anime/${malId}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: Number(Math.min(0.95, Math.max(0.65, (isAiring ? 0.80 : 0.70) + animeBoost)).toFixed(2)),
    }));
  } catch (error) {
    console.warn('Error generating anime sitemap routes:', error);
  }

  // 3. Fetch K-Drama Routes
  try {
    const [trendingKDrama, topRatedKDrama] = await Promise.allSettled([
      getTrendingKDramas(1),
      getTopRatedKDramas(1),
    ]);

    const kdramaMap = new Map<number, boolean>();
    const trendingItems =
      trendingKDrama.status === 'fulfilled' && Array.isArray(trendingKDrama.value)
        ? trendingKDrama.value
        : FALLBACK_KDRAMA_LIST;
    const topRatedItems =
      topRatedKDrama.status === 'fulfilled' && Array.isArray(topRatedKDrama.value)
        ? topRatedKDrama.value
        : [];

    trendingItems.forEach((d) => {
      if (d.id) kdramaMap.set(d.id, true);
    });
    topRatedItems.forEach((d) => {
      if (d.id && !kdramaMap.has(d.id)) {
        kdramaMap.set(d.id, false);
      }
    });

    const kdramaBoost = niche === 'kdrama' ? 0.15 : -0.05;
    kdramaRoutes = Array.from(kdramaMap.entries()).map(([id, isTrending]) => ({
      url: `${baseUrl}/watch/kdrama/${id}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: Number(Math.min(0.95, Math.max(0.65, (isTrending ? 0.80 : 0.70) + kdramaBoost)).toFixed(2)),
    }));
  } catch (error) {
    console.warn('Error generating K-Drama sitemap routes:', error);
  }

  // Order routes according to niche prominence
  if (niche === 'anime') {
    return [...staticRoutes, ...animeRoutes, ...movieRoutes, ...tvRoutes, ...kdramaRoutes];
  }
  if (niche === 'kdrama') {
    return [...staticRoutes, ...kdramaRoutes, ...tvRoutes, ...movieRoutes, ...animeRoutes];
  }
  return [...staticRoutes, ...movieRoutes, ...tvRoutes, ...animeRoutes, ...kdramaRoutes];
}
