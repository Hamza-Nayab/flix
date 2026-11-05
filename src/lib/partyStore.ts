import { EventEmitter } from 'events';
import { SITE_CONFIG } from '@/lib/siteConfig';

export interface PartyMedia {
  tmdbId: number | string;
  type: 'movie' | 'tv' | 'anime' | 'kdrama';
  mediaType?: 'movie' | 'tv' | 'anime' | 'kdrama';
  title: string;
  backdropPath?: string | null;
  season?: number;
  episode?: number;
  subOrDub?: 'sub' | 'dub';
  customStreamUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isHost: boolean;
}

export interface PartyPlaybackState {
  isPlaying?: boolean;
  isPaused: boolean;
  countdownEnd?: number | null;
  timestampSeconds?: number;
  timestampFormatted?: string;
  seekVersion?: number;
  updatedAt: number;
}

export interface PartyRoom {
  roomId: string;
  hostToken: string;
  hostName: string;
  media: PartyMedia;
  server: string;
  status: 'active' | 'ended';
  createdAt: number;
  lastHostHeartbeat: number;
  participantCount: number;
  messages: ChatMessage[];
  playback: PartyPlaybackState;
}

export interface FormattedPartyState {
  roomId: string;
  hostName: string;
  media: PartyMedia;
  mediaType?: 'movie' | 'tv' | 'anime' | 'kdrama';
  server: string;
  status: 'active' | 'ended';
  participantCount: number;
  messages: ChatMessage[];
  playback: PartyPlaybackState;
  createdAt: number;
  isHost?: boolean;
}

// In-memory global store & event bus across hot-reloads and requests
declare global {
  var __ROSEFLIX_PARTY_STORE__: Map<string, PartyRoom> | undefined;
  var __ROSEFLIX_PARTY_BUS__: EventEmitter | undefined;
}

const partyStore: Map<string, PartyRoom> =
  global.__ROSEFLIX_PARTY_STORE__ || new Map<string, PartyRoom>();

const partyBus: EventEmitter =
  global.__ROSEFLIX_PARTY_BUS__ || new EventEmitter();
partyBus.setMaxListeners(0);

if (process.env.NODE_ENV !== 'production') {
  global.__ROSEFLIX_PARTY_STORE__ = partyStore;
  global.__ROSEFLIX_PARTY_BUS__ = partyBus;
}

// Generate human-friendly 8-char room code
function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${result.slice(0, 4)}-${result.slice(4)}`;
}

export function subscribeToRoom(roomId: string, listener: (room: PartyRoom) => void): void {
  partyBus.on(`room:${roomId}`, listener);
}

export function unsubscribeFromRoom(roomId: string, listener: (room: PartyRoom) => void): void {
  partyBus.off(`room:${roomId}`, listener);
}

export function notifyRoomUpdate(roomId: string): void {
  const room = partyStore.get(roomId);
  if (room) {
    partyBus.emit(`room:${roomId}`, room);
  }
}

export function formatRoomState(room: PartyRoom, isHost: boolean = false): FormattedPartyState {
  const effectiveMediaType = room.media.mediaType || room.media.type;
  return {
    roomId: room.roomId,
    hostName: room.hostName,
    media: {
      ...room.media,
      mediaType: effectiveMediaType,
    },
    mediaType: effectiveMediaType,
    server: room.server,
    status: room.status,
    participantCount: room.participantCount,
    messages: room.messages,
    playback: room.playback || {
      isPaused: false,
      countdownEnd: null,
      timestampSeconds: 0,
      timestampFormatted: '00:00',
      updatedAt: Date.now(),
    },
    createdAt: room.createdAt,
    isHost,
  };
}

export function createPartyRoom(media: PartyMedia, hostName: string = 'Host'): PartyRoom {
  const roomId = generateRoomCode();
  const hostToken = `host_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;

  // Default server based on media type
  const isAnime = media.type === 'anime' || media.mediaType === 'anime';
  const defaultServer = isAnime ? 'anime-server-1' : 'server-1';

  const normalizedMedia: PartyMedia = {
    ...media,
    mediaType: isAnime ? 'anime' : media.type,
    subOrDub: media.subOrDub || 'sub',
    episode: media.episode || 1,
  };

  const newRoom: PartyRoom = {
    roomId,
    hostToken,
    hostName: hostName.trim() || 'Host',
    media: normalizedMedia,
    server: defaultServer,
    status: 'active',
    createdAt: Date.now(),
    lastHostHeartbeat: Date.now(),
    participantCount: 0,
    messages: [
      {
        id: `sys_${Date.now()}`,
        sender: 'RoseFlix Bot',
        text: `Watch party created! Share the link with friends to watch together in real-time.`,
        timestamp: Date.now(),
        isHost: false,
      },
    ],
    playback: {
      isPaused: false,
      countdownEnd: null,
      timestampSeconds: 0,
      timestampFormatted: '00:00',
      updatedAt: Date.now(),
    },
  };

  partyStore.set(roomId, newRoom);
  return newRoom;
}

export function getPartyRoom(roomId: string): PartyRoom | null {
  const room = partyStore.get(roomId);
  if (!room) return null;

  // If host hasn't sent a heartbeat for more than 60 seconds and no participants, mark ended
  if (room.status === 'active' && Date.now() - room.lastHostHeartbeat > 60000 && room.participantCount <= 0) {
    room.status = 'ended';
    notifyRoomUpdate(roomId);
  }

  return room;
}

export function updateHostHeartbeat(roomId: string, hostToken: string): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;

  room.lastHostHeartbeat = Date.now();
  if (room.status === 'ended') {
    room.status = 'active';
    notifyRoomUpdate(roomId);
  }
  return true;
}

export function incrementParticipants(roomId: string, isHost: boolean = false): number {
  const room = partyStore.get(roomId);
  if (!room) return 0;
  room.participantCount += 1;
  if (isHost) {
    room.lastHostHeartbeat = Date.now();
  }
  notifyRoomUpdate(roomId);
  return room.participantCount;
}

export function decrementParticipants(roomId: string, isHost: boolean = false): number {
  const room = partyStore.get(roomId);
  if (!room) return 0;
  room.participantCount = Math.max(0, room.participantCount - 1);
  if (isHost) {
    room.lastHostHeartbeat = Date.now();
  }

  // If room is empty, clean up after a 45-second grace period
  if (room.participantCount === 0) {
    setTimeout(() => {
      const current = partyStore.get(roomId);
      if (current && current.participantCount === 0) {
        partyStore.delete(roomId);
        partyBus.removeAllListeners(`room:${roomId}`);
      }
    }, 45000);
  } else {
    notifyRoomUpdate(roomId);
  }

  return room.participantCount;
}

export function endPartyRoom(roomId: string, hostToken: string): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;

  room.status = 'ended';
  room.messages.push({
    id: `sys_end_${Date.now()}`,
    sender: 'RoseFlix Bot',
    text: `The host has ended this watch party session.`,
    timestamp: Date.now(),
    isHost: false,
  });
  notifyRoomUpdate(roomId);
  return true;
}

export function addPartyMessage(
  roomId: string,
  sender: string,
  text: string,
  isHost: boolean
): ChatMessage | null {
  const room = partyStore.get(roomId);
  if (!room || room.status === 'ended') return null;

  const msg: ChatMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    sender: sender.trim() || 'Anonymous',
    text: text.trim().slice(0, 300),
    timestamp: Date.now(),
    isHost,
  };

  room.messages.push(msg);
  if (room.messages.length > 100) {
    room.messages.shift();
  }

  notifyRoomUpdate(roomId);
  return msg;
}

export function updatePartyServer(roomId: string, hostToken: string, serverId: string): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;
  room.server = serverId;
  notifyRoomUpdate(roomId);
  return true;
}

export function updatePartyMedia(
  roomId: string,
  hostToken: string,
  mediaUpdate: Partial<PartyMedia>
): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;

  room.media = {
    ...room.media,
    ...mediaUpdate,
  };

  if (mediaUpdate.season !== undefined && mediaUpdate.episode !== undefined) {
    room.messages.push({
      id: `sys_ep_${Date.now()}`,
      sender: `${SITE_CONFIG.SITE_NAME} Bot`,
      text: `Host switched to Season ${mediaUpdate.season}, Episode ${mediaUpdate.episode}.`,
      timestamp: Date.now(),
      isHost: false,
    });
  } else if (mediaUpdate.episode !== undefined) {
    room.messages.push({
      id: `sys_ep_${Date.now()}`,
      sender: `${SITE_CONFIG.SITE_NAME} Bot`,
      text: `Host switched to Episode ${mediaUpdate.episode}${
        mediaUpdate.subOrDub ? ` (${mediaUpdate.subOrDub.toUpperCase()})` : ''
      }.`,
      timestamp: Date.now(),
      isHost: false,
    });
  } else if (mediaUpdate.subOrDub) {
    room.messages.push({
      id: `sys_audio_${Date.now()}`,
      sender: `${SITE_CONFIG.SITE_NAME} Bot`,
      text: `Host switched audio track to ${mediaUpdate.subOrDub.toUpperCase()}.`,
      timestamp: Date.now(),
      isHost: false,
    });
  }

  notifyRoomUpdate(roomId);
  return true;
}

export function updatePartyPlayback(
  roomId: string,
  hostToken: string,
  data: {
    isPlaying?: boolean;
    isPaused?: boolean;
    countdownEnd?: number | null;
    timestampSeconds?: number;
    timestampFormatted?: string;
    seekVersion?: number;
    silent?: boolean;
  }
): boolean {
  const room = partyStore.get(roomId);
  if (!room || room.hostToken !== hostToken) return false;

  const { silent, ...playbackUpdates } = data;

  room.playback = {
    ...room.playback,
    ...playbackUpdates,
    updatedAt: Date.now(),
  };

  // Add automated announcements in room chat only when not silent
  if (!silent) {
    if (data.seekVersion !== undefined && data.timestampFormatted) {
      room.messages.push({
        id: `sys_time_${Date.now()}`,
        sender: `${SITE_CONFIG.SITE_NAME} Bot`,
        text: `Host synchronized playback to timestamp ${data.timestampFormatted}.`,
        timestamp: Date.now(),
        isHost: false,
      });
    } else if (data.isPaused === true) {
      room.messages.push({
        id: `sys_pause_${Date.now()}`,
        sender: `${SITE_CONFIG.SITE_NAME} Bot`,
        text: `Host paused the session for all participants${
          data.timestampFormatted ? ` at ${data.timestampFormatted}` : ''
        }.`,
        timestamp: Date.now(),
        isHost: false,
      });
    } else if (data.countdownEnd) {
      room.messages.push({
        id: `sys_resume_${Date.now()}`,
        sender: `${SITE_CONFIG.SITE_NAME} Bot`,
        text: `Host resumed streaming. 3-second synchronized countdown started!`,
        timestamp: Date.now(),
        isHost: false,
      });
    }
  }

  notifyRoomUpdate(roomId);
  return true;
}
