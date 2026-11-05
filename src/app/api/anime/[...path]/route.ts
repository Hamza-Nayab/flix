import { NextRequest, NextResponse } from 'next/server';
import { getAnimeEmbedUrl, getAnimeEmbedServers } from '@/lib/resolvers';
import { resolveAnimeIdsSync } from '@/lib/anilist';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const { searchParams } = new URL(request.url);

  // Path format: /api/anime/:id/:episode/:subOrDub (e.g. /api/anime/21/1/sub)
  const rawId = path[0] || '21';
  const rawEp = parseInt(path[1] || '1', 10);
  const rawSubOrDub = path[2] === 'dub' ? 'dub' : 'sub';
  const serverId = searchParams.get('server') || 'anime-server-1';

  // Synchronously resolve bridge data
  const bridge = resolveAnimeIdsSync({ tmdbId: rawId, malId: Number(rawId) });

  const embedUrl = getAnimeEmbedUrl(
    serverId,
    rawId,
    1,
    isNaN(rawEp) ? 1 : rawEp,
    rawSubOrDub,
    false,
    bridge || undefined
  );

  const servers = getAnimeEmbedServers().map((s) => ({
    id: s.id,
    name: s.name,
    badge: s.badge,
    url: s.getAnimeUrl(rawId, 1, isNaN(rawEp) ? 1 : rawEp, rawSubOrDub, false, bridge || undefined),
  }));

  return NextResponse.json(
    {
      success: true,
      id: rawId,
      episode: rawEp,
      subOrDub: rawSubOrDub,
      streamUrl: embedUrl,
      servers,
    },
    {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}

