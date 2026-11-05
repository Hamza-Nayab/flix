import { NextRequest, NextResponse } from 'next/server';
import { resolveAnimeIds, resolveAnimeIdsSync } from '@/lib/anilist';
import { getAnimeById } from '@/lib/anime';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || searchParams.get('tmdbId') || searchParams.get('malId') || '0';
  const title = searchParams.get('title') || '';
  const originalTitle = searchParams.get('originalTitle') || '';
  const season = parseInt(searchParams.get('season') || '1', 10);
  const type = searchParams.get('type') === 'movie' ? 'movie' : 'tv';

  try {
    // 1. Resolve IDs via static lookup or AniList GraphQL
    const bridge = await resolveAnimeIds({
      tmdbId: id,
      title,
      originalTitle,
      season: isNaN(season) ? 1 : season,
    });

    // 2. Fetch cached TMDB metadata without hitting Jikan
    const anime = await getAnimeById(id, type, season);

    return NextResponse.json({
      success: true,
      bridge,
      anime: anime
        ? {
            id: anime.id,
            mal_id: bridge?.malId || anime.mal_id,
            anilist_id: bridge?.anilistId || anime.anilist_id,
            slug: bridge?.slug || anime.slug,
            title: anime.title || anime.name,
            overview: anime.overview,
            poster_path: anime.poster_path,
            backdrop_path: anime.backdrop_path,
            vote_average: anime.vote_average,
            total_episodes: anime.episodes || anime.number_of_episodes || 12,
            number_of_seasons: anime.number_of_seasons || 1,
            seasons: anime.seasons,
          }
        : null,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to fetch anime metadata',
      },
      { status: 500 }
    );
  }
}

