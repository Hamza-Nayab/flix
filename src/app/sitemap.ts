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
import { SITE_CONFIG } from '@/lib/siteConfig';

export const revalidate = 86400; // Cache sitemap for 24 hours

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();
  const niche = SITE_CONFIG.PRIMARY_NICHE;

  // Core Static Routes with Niche-Adaptive Priority
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/movies`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: niche === 'movies' ? 0.95 : 0.85,
    },
    {
      url: `${baseUrl}/tv`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/anime`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: niche === 'anime' ? 0.95 : 0.85,
    },
    {
      url: `${baseUrl}/kdramas`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: niche === 'kdrama' ? 0.95 : 0.85,
    },
  ];

  let movieRoutes: MetadataRoute.Sitemap = [];
  let tvRoutes: MetadataRoute.Sitemap = [];
  let animeRoutes: MetadataRoute.Sitemap = [];
  let kdramaRoutes: MetadataRoute.Sitemap = [];

  // 1. Movies & TV from TMDB
  try {
    const results = await Promise.allSettled([
      getTrendingMovies('day'),
      getTrendingMovies('week'),
      getPopularMovies(1),
      getPopularMovies(2),
      getTopRatedMovies(1),
      getTrendingTV('day'),
      getTrendingTV('week'),
      getPopularTV(1),
      getPopularTV(2),
      getTopRatedTV(1),
    ]);

    const movieMap = new Map<number, { isTrending: boolean }>();
    const tvMap = new Map<number, { isTrending: boolean }>();

    const trendingDayMovies = results[0].status === 'fulfilled' ? results[0].value : [];
    const trendingWeekMovies = results[1].status === 'fulfilled' ? results[1].value : [];
    const popularMovies1 = results[2].status === 'fulfilled' ? results[2].value : [];
    const popularMovies2 = results[3].status === 'fulfilled' ? results[3].value : [];
    const topRatedMovies = results[4].status === 'fulfilled' ? results[4].value : [];

    [...trendingDayMovies, ...trendingWeekMovies].forEach((m) => {
      movieMap.set(m.id, { isTrending: true });
    });
    [...popularMovies1, ...popularMovies2, ...topRatedMovies].forEach((m) => {
      if (!movieMap.has(m.id)) {
        movieMap.set(m.id, { isTrending: false });
      }
    });

    const trendingDayTV = results[5].status === 'fulfilled' ? results[5].value : [];
    const trendingWeekTV = results[6].status === 'fulfilled' ? results[6].value : [];
    const popularTV1 = results[7].status === 'fulfilled' ? results[7].value : [];
    const popularTV2 = results[8].status === 'fulfilled' ? results[8].value : [];
    const topRatedTV = results[9].status === 'fulfilled' ? results[9].value : [];

    [...trendingDayTV, ...trendingWeekTV].forEach((t) => {
      tvMap.set(t.id, { isTrending: true });
    });
    [...popularTV1, ...popularTV2, ...topRatedTV].forEach((t) => {
      if (!tvMap.has(t.id)) {
        tvMap.set(t.id, { isTrending: false });
      }
    });

    const moviePriorityBoost = niche === 'movies' ? 0.05 : 0;
    movieRoutes = Array.from(movieMap.entries()).map(([id, info]) => ({
      url: `${baseUrl}/watch/movie/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: Number((info.isTrending ? 0.85 + moviePriorityBoost : 0.75 + moviePriorityBoost).toFixed(2)),
    }));

    tvRoutes = Array.from(tvMap.entries()).map(([id, info]) => ({
      url: `${baseUrl}/watch/tv/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: info.isTrending ? 0.85 : 0.75,
    }));
  } catch (error) {
    console.warn('Error fetching TMDB routes for sitemap:', error);
  }

  // 2. Anime from Jikan
  try {
    const [airingAnime, popularAnime] = await Promise.allSettled([
      getTopAiringAnime(25),
      getMostPopularAnime(25),
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

    const animePriorityBoost = niche === 'anime' ? 0.1 : 0;
    animeRoutes = Array.from(animeMap.entries()).map(([malId, isAiring]) => ({
      url: `${baseUrl}/watch/anime/${malId}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: Number((isAiring ? 0.80 + animePriorityBoost : 0.70 + animePriorityBoost).toFixed(2)),
    }));
  } catch (error) {
    console.warn('Error fetching Jikan anime routes for sitemap:', error);
  }

  // 3. K-Dramas & Asian Series
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

    const kdramaPriorityBoost = niche === 'kdrama' ? 0.1 : 0;
    kdramaRoutes = Array.from(kdramaMap.entries()).map(([id, isTrending]) => ({
      url: `${baseUrl}/watch/kdrama/${id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: Number((isTrending ? 0.80 + kdramaPriorityBoost : 0.70 + kdramaPriorityBoost).toFixed(2)),
    }));
  } catch (error) {
    console.warn('Error fetching K-Drama routes for sitemap:', error);
  }

  return [...staticRoutes, ...movieRoutes, ...tvRoutes, ...animeRoutes, ...kdramaRoutes];
}
