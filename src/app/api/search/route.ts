import { NextRequest, NextResponse } from 'next/server';
import { searchMulti } from '@/lib/tmdb';
import { searchAnime } from '@/lib/anime';
import { searchKDramas } from '@/lib/kdrama';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);

  if (!query || !query.trim()) {
    return NextResponse.json({ results: [], total_pages: 0, total_results: 0 });
  }

  const cleanQuery = query.trim();

  try {
    const promises: [Promise<any>, Promise<any>, Promise<any>] = [
      type === 'anime' || type === 'kdrama'
        ? Promise.resolve({ results: [] })
        : searchMulti(cleanQuery, page).catch(() => ({ results: [] })),
      type === 'movie' || type === 'tv' || type === 'kdrama'
        ? Promise.resolve([])
        : searchAnime(cleanQuery, 12).catch(() => []),
      type === 'movie' || type === 'anime'
        ? Promise.resolve([])
        : searchKDramas(cleanQuery).catch(() => []),
    ];

    const [tmdbData, animeData, kdramaData] = await Promise.all(promises);

    const tmdbResults = (tmdbData?.results || []).filter(
      (item: any) =>
        (item.media_type === 'movie' || item.media_type === 'tv') &&
        (item.poster_path || item.backdrop_path)
    );

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

    // Interleave or combine results according to type filter
    let combined: any[] = [];
    if (type === 'movie') {
      combined = tmdbResults.filter((i: any) => i.media_type === 'movie');
    } else if (type === 'tv') {
      combined = tmdbResults.filter((i: any) => i.media_type === 'tv');
    } else if (type === 'anime') {
      combined = animeResults;
    } else if (type === 'kdrama') {
      combined = kdramaResults;
    } else {
      // 'all': tag Korean series as kdrama and add KDramas
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

      combined = [...taggedTmdb, ...additionalKdramas, ...animeResults];
    }

    return NextResponse.json({
      results: combined,
      total_results: combined.length,
    });
  } catch (error) {
    console.error('Unified search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search media catalog' },
      { status: 500 }
    );
  }
}
