import { NextRequest, NextResponse } from 'next/server';
import { updatePartyPlayback, getPartyRoom } from '@/lib/partyStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const room = getPartyRoom(roomId);

  if (!room || room.status === 'ended') {
    return NextResponse.json({ error: 'Party session is no longer active' }, { status: 400 });
  }

  const hostToken = request.headers.get('x-host-token');
  if (!hostToken || hostToken !== room.hostToken) {
    return NextResponse.json({ error: 'Only the room host can sync playback' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, timestamp, timestampSeconds } = body;

    let updated = false;

    if (action === 'pause') {
      let seconds = typeof timestampSeconds === 'number' ? timestampSeconds : undefined;
      let formatted: string | undefined = undefined;
      if (typeof seconds === 'number' && seconds > 0) {
        const m = Math.floor(seconds / 60);
        const s = String(Math.floor(seconds % 60)).padStart(2, '0');
        formatted = `${m}:${s}`;
      }

      updated = updatePartyPlayback(roomId, hostToken, {
        isPaused: true,
        countdownEnd: null,
        timestampSeconds: seconds,
        timestampFormatted: formatted || room.playback.timestampFormatted,
      });
    } else if (action === 'resume') {
      // 3-second synchronized countdown
      updated = updatePartyPlayback(roomId, hostToken, {
        isPaused: false,
        countdownEnd: Date.now() + 3200,
      });
    } else if (action === 'telemetry') {
      // Periodic background telemetry from host player (silent = true to prevent chat spam)
      let seconds = typeof timestampSeconds === 'number' ? timestampSeconds : 0;
      if (typeof timestamp === 'number') seconds = timestamp;

      const m = Math.floor(seconds / 60);
      const s = String(Math.floor(seconds % 60)).padStart(2, '0');
      const formatted = `${m}:${s}`;

      updated = updatePartyPlayback(roomId, hostToken, {
        timestampSeconds: seconds,
        timestampFormatted: formatted,
        silent: true,
      });
    } else if (action === 'timestamp' || action === 'seek' || action === 'time') {
      // Explicit manual seek from host
      let seconds = 0;
      let rawText = '';

      if (typeof timestampSeconds === 'number') {
        seconds = Math.max(0, timestampSeconds);
        const m = Math.floor(seconds / 60);
        const s = String(Math.floor(seconds % 60)).padStart(2, '0');
        rawText = `${m}:${s}`;
      } else {
        rawText = String(timestamp || '').trim();
        const parts = rawText.split(':').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          seconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
          seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (!isNaN(Number(rawText)) && rawText !== '') {
          seconds = Math.max(0, Number(rawText));
        }

        const m = Math.floor(seconds / 60);
        const s = String(Math.floor(seconds % 60)).padStart(2, '0');
        if (parts.length < 2) {
          rawText = `${m}:${s}`;
        }
      }

      const nextSeekVersion = (room.playback.seekVersion || 0) + 1;

      updated = updatePartyPlayback(roomId, hostToken, {
        timestampSeconds: seconds,
        timestampFormatted: rawText,
        seekVersion: nextSeekVersion,
        silent: false,
      });
    }

    return NextResponse.json({ success: updated, playback: room.playback });
  } catch (err) {
    console.error('Failed to sync playback state:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
