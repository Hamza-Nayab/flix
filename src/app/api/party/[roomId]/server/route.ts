import { NextRequest, NextResponse } from 'next/server';
import { updatePartyServer, updatePartyMedia } from '@/lib/partyStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const hostToken = request.headers.get('x-host-token');

  if (!hostToken) {
    return NextResponse.json(
      { error: 'Only the room creator can switch stream settings' },
      { status: 401 }
    );
  }

  try {
    const { serverId, subOrDub, episode, season } = await request.json();

    if (serverId) {
      updatePartyServer(roomId, hostToken, serverId);
    }

    if (subOrDub || episode !== undefined || season !== undefined) {
      updatePartyMedia(roomId, hostToken, {
        ...(subOrDub ? { subOrDub } : {}),
        ...(episode !== undefined ? { episode: Number(episode) } : {}),
        ...(season !== undefined ? { season: Number(season) } : {}),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update party server or media settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
