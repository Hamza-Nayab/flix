import { NextRequest, NextResponse } from 'next/server';
import { resolveAnimeIds } from '@/lib/anilist';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId') || searchParams.get('id') || '0';
  const title = searchParams.get('title') || '';
  const originalTitle = searchParams.get('originalTitle') || '';
  const season = parseInt(searchParams.get('season') || '1', 10);

  try {
    const bridge = await resolveAnimeIds({
      tmdbId,
      title,
      originalTitle,
      season: isNaN(season) ? 1 : season,
    });

    return NextResponse.json({
      success: true,
      ...bridge,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to resolve anime bridge IDs',
      },
      { status: 500 }
    );
  }
}

