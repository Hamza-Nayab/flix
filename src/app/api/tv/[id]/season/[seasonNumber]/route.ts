import { NextRequest, NextResponse } from 'next/server';
import { getTVSeason } from '@/lib/tmdb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;
  const parsedSeason = parseInt(seasonNumber, 10);

  if (!id || isNaN(parsedSeason) || parsedSeason < 0) {
    return NextResponse.json(
      { error: 'Invalid TV show ID or season number parameter' },
      { status: 400 }
    );
  }

  try {
    const seasonData = await getTVSeason(id, parsedSeason);
    if (!seasonData) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(seasonData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error(`Error fetching season ${seasonNumber} for show ${id}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch season details' },
      { status: 500 }
    );
  }
}
