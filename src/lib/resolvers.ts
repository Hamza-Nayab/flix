import { SITE_CONFIG } from '@/lib/siteConfig';

/**
 * Dynamically resolves the active tenant's primary hex color (without '#')
 * AniRose (#00F5D4) -> '00F5D4'
 * DramaPulse (#8B5CF6) -> '8B5CF6'
 * RoseFlix (#FF1E56) -> 'FF1E56'
 */
export function getPrimaryColorHex(): string {
  const envColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR || SITE_CONFIG.PRIMARY_COLOR;
  if (envColor) {
    return envColor.replace(/^#/, '');
  }
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || SITE_CONFIG.SITE_NAME || '').toLowerCase();
  const niche = (process.env.NEXT_PUBLIC_PRIMARY_NICHE || SITE_CONFIG.PRIMARY_NICHE || '').toLowerCase();
  if (siteName.includes('anirose') || niche.includes('anime')) {
    return '00F5D4';
  }
  if (siteName.includes('dramapulse') || niche.includes('kdrama')) {
    return '8B5CF6';
  }
  return 'FF1E56';
}

export const PRIMARY_COLOR_HEX = getPrimaryColorHex();

export interface VideoServer {
  id: string;
  name: string;
  badge: string;
  getMovieUrl: (tmdbId: number | string) => string;
  getTVUrl: (tmdbId: number | string, season: number, episode: number, imdbId?: string | null) => string;
}

export interface AnimeBridgeOptions {
  anilistId?: number | null;
  malId?: number | null;
  slug?: string | null;
  absoluteEpisode?: number | null;
}

export interface AnimeServer {
  id: string;
  name: string;
  badge: string;
  getAnimeUrl: (
    id: number | string,
    season: number,
    episode: number,
    subOrDub: 'sub' | 'dub',
    isMovie?: boolean,
    bridge?: AnimeBridgeOptions
  ) => string;
}

/**
 * High-Uptime Streaming Mirrors for Movies and General TV with FrameXTV as #1 Default Priority
 * (Ranked by live latency & reachability benchmark)
 */
export const VIDEO_SERVERS: VideoServer[] = [
  {
    id: 'server-1',
    name: 'Server 1 (FrameXTV Ultra)',
    badge: 'Ultra Fast • Multi-Audio',
    getMovieUrl: (tmdbId) => `https://framextv.xyz/embed/${tmdbId}?autoplay=0&controls=1`,
    getTVUrl: (tmdbId, season, episode) => `https://framextv.xyz/embed/${tmdbId}/${season}/${episode}?autoplay=0&controls=1`,
  },
  {
    id: 'server-2',
    name: 'Server 2 (VidLink VIP)',
    badge: 'Custom Skin • Auto-Sync',
    getMovieUrl: (tmdbId) => {
      const color = getPrimaryColorHex();
      return `https://vidlink.pro/movie/${tmdbId}?primaryColor=${color}&secondaryColor=09090b&iconColor=${color}&autoplay=false`;
    },
    getTVUrl: (tmdbId, season, episode) => {
      const color = getPrimaryColorHex();
      return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=${color}&secondaryColor=09090b&iconColor=${color}&nextbutton=true&autoplay=false`;
    },
  },
  {
    id: 'server-3',
    name: 'Server 3 (VidSrc To)',
    badge: 'High-Speed CDN • 1080p',
    getMovieUrl: (tmdbId) => `https://vidsrc.to/embed/movie/${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'server-4',
    name: 'Server 4 (AutoEmbed Co)',
    badge: 'Fast Cloud Mirror',
    getMovieUrl: (tmdbId) => `https://autoembed.co/movie/tmdb/${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`,
  },
  {
    id: 'server-5',
    name: 'Server 5 (VidSrc Me)',
    badge: 'Ultra HD • Low Buffer',
    getMovieUrl: (tmdbId) => `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
  },
  {
    id: 'server-6',
    name: 'Server 6 (MultiEmbed)',
    badge: 'Multi-Server Redundancy',
    getMovieUrl: (tmdbId) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTVUrl: (tmdbId, season, episode, imdbId) =>
      `https://multiembed.mov/?video_id=${imdbId || tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: 'server-7',
    name: 'Server 7 (2Embed Direct)',
    badge: 'Fail-Safe Backup',
    getMovieUrl: (tmdbId) => `https://www.2embed.cc/embedmovie/${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
];

/**
 * Asian Drama & K-Drama Streaming Mirrors with FrameXTV as #1 Default Priority
 * (Ranked by live latency & reachability benchmark with IMDb + TMDB Dual-Bridge)
 */
export const KDRAMA_SERVERS: VideoServer[] = [
  {
    id: 'server-1',
    name: 'Server 1 (FrameXTV Ultra)',
    badge: 'Ultra Fast • Multi-Audio',
    getMovieUrl: (tmdbId) => `https://framextv.xyz/embed/${tmdbId}?autoplay=0&controls=1`,
    getTVUrl: (tmdbId, season, episode) => `https://framextv.xyz/embed/${tmdbId}/${season}/${episode}?autoplay=0&controls=1`,
  },
  {
    id: 'server-2',
    name: 'Server 2 (VidLink Asian VIP)',
    badge: 'Auto-Next • 1080p VIP',
    getMovieUrl: (tmdbId) => {
      const color = getPrimaryColorHex();
      return `https://vidlink.pro/movie/${tmdbId}?primaryColor=${color}&secondaryColor=09090b&iconColor=${color}&autoplay=false`;
    },
    getTVUrl: (tmdbId, season, episode) => {
      const color = getPrimaryColorHex();
      return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=${color}&secondaryColor=09090b&iconColor=${color}&nextbutton=true&autoplay=false`;
    },
  },
  {
    id: 'server-3',
    name: 'Server 3 (VidSrc To)',
    badge: 'High-Speed CDN • 1080p',
    getMovieUrl: (tmdbId) => `https://vidsrc.to/embed/movie/${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
  },
  {
    id: 'server-4',
    name: 'Server 4 (AutoEmbed Co)',
    badge: 'Fast Cloud Mirror',
    getMovieUrl: (tmdbId) => `https://autoembed.co/movie/tmdb/${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`,
  },
  {
    id: 'server-5',
    name: 'Server 5 (VidSrc Me)',
    badge: 'Ultra HD • Low Buffer',
    getMovieUrl: (tmdbId) => `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
  },
  {
    id: 'server-6',
    name: 'Server 6 (MultiEmbed VIP)',
    badge: 'IMDb & TMDB Dual Bridge',
    getMovieUrl: (tmdbId) => `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`,
    getTVUrl: (tmdbId, season, episode, imdbId) =>
      `https://multiembed.mov/?video_id=${imdbId || tmdbId}&tmdb=1&s=${season}&e=${episode}`,
  },
  {
    id: 'server-7',
    name: 'Server 7 (2Embed Direct)',
    badge: 'Fail-Safe Backup',
    getMovieUrl: (tmdbId) => `https://www.2embed.cc/embedmovie/${tmdbId}`,
    getTVUrl: (tmdbId, season, episode) => `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`,
  },
];

/**
 * 8 Verified 200-OK Anime Streaming Mirrors (with FrameXTV #1 Ultra + Archer Multi-Audio)
 * (Ranked by live diagnostic latency & reachability benchmark)
 */
export const ANIME_SERVERS: AnimeServer[] = [
  {
    id: 'anime-server-1',
    name: 'Server 1 (FrameXTV Ultra)',
    badge: 'Official Embed Gateway • 1080p',
    getAnimeUrl: (tmdbId, season, episode, _subOrDub, isMovie, bridge) => {
      if (isMovie) {
        return `https://framextv.xyz/embed/${tmdbId}?autoplay=0&controls=1`;
      }
      const absoluteEpisode = bridge?.absoluteEpisode || episode;
      return `https://framextv.xyz/embed/${tmdbId}/1/${absoluteEpisode}?autoplay=0&controls=1`;
    },
  },
  {
    id: 'anime-server-2',
    name: 'Server 2 (VidLink Anime Pro)',
    badge: 'VPN-Safe • Auto-Next',
    getAnimeUrl: (tmdbId, season, episode, _subOrDub, isMovie) => {
      const color = getPrimaryColorHex();
      if (isMovie) {
        return `https://vidlink.pro/movie/${tmdbId}?primaryColor=${color}&secondaryColor=09090b&iconColor=${color}&autoplay=false`;
      }
      return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}?primaryColor=${color}&secondaryColor=09090b&iconColor=${color}&nextbutton=true&autoplay=false`;
    },
  },
  {
    id: 'anime-server-3',
    name: 'Server 3 (FrameXTV Direct Anime)',
    badge: 'Direct Anime Gateway • Multi-Audio',
    getAnimeUrl: (tmdbId, season, episode, subOrDub, isMovie, bridge) => {
      if (isMovie) {
        return `https://framextv.xyz/embed/${tmdbId}?autoplay=0&controls=1`;
      }
      const animeId = bridge?.anilistId || bridge?.malId || 21;
      const absoluteEpisode = bridge?.absoluteEpisode || episode;
      const subType = subOrDub === 'dub' ? 'dub' : 'sub';
      return `https://framextv.xyz/embed/anime?id=${animeId}&type=anime&season=1&episode=${absoluteEpisode}&sub_type=${subType}&autoplay=0&controls=1`;
    },
  },
  {
    id: 'anime-server-4',
    name: 'Server 4 (VidSrc CC Anime)',
    badge: 'AniList Absolute • Cloud CDN',
    getAnimeUrl: (tmdbId, season, episode, subOrDub, isMovie, bridge) => {
      if (isMovie) {
        return `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`;
      }
      const animeId = bridge?.anilistId || bridge?.malId;
      const absoluteEpisode = bridge?.absoluteEpisode || episode;
      if (animeId && animeId > 0) {
        return `https://vidsrc.cc/v2/embed/anime/ani${animeId}/${absoluteEpisode}/${subOrDub}?autoPlay=false`;
      }
      if (tmdbId) {
        return `https://vidsrc.cc/v2/embed/anime/tmdb${tmdbId}/${season}/${episode}/${subOrDub}?autoPlay=false`;
      }
      return `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    },
  },
  {
    id: 'anime-server-5',
    name: 'Server 5 (VidSrc To)',
    badge: 'Ad-Free CDN • 1080p HD',
    getAnimeUrl: (tmdbId, season, episode, _subOrDub, isMovie) => {
      return isMovie
        ? `https://vidsrc.to/embed/movie/${tmdbId}`
        : `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`;
    },
  },
  {
    id: 'anime-server-6',
    name: 'Server 6 (MultiEmbed VIP)',
    badge: 'Zero-Tracker Multi-Server',
    getAnimeUrl: (tmdbId, season, episode, _subOrDub, isMovie) => {
      return isMovie
        ? `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`;
    },
  },
  {
    id: 'anime-server-7',
    name: 'Server 7 (AutoEmbed Co)',
    badge: 'Fast Cloud Stream',
    getAnimeUrl: (tmdbId, season, episode, _subOrDub, isMovie) => {
      return isMovie
        ? `https://autoembed.co/movie/tmdb/${tmdbId}`
        : `https://autoembed.co/tv/tmdb/${tmdbId}-${season}-${episode}`;
    },
  },
  {
    id: 'anime-server-8',
    name: 'Server 8 (2Embed TV)',
    badge: 'Multi-Season Fallback',
    getAnimeUrl: (tmdbId, season, episode, _subOrDub, isMovie) => {
      return isMovie
        ? `https://www.2embed.cc/embedmovie/${tmdbId}`
        : `https://www.2embed.cc/embedtv/${tmdbId}&s=${season}&e=${episode}`;
    },
  },
];

export function getAnimeEmbedServers(): AnimeServer[] {
  return ANIME_SERVERS;
}

export function getMovieEmbedServers(): VideoServer[] {
  return VIDEO_SERVERS;
}

export function getTVEmbedServers(): VideoServer[] {
  return VIDEO_SERVERS;
}

/**
 * Direct Movie Embed URL resolver
 */
export function getMovieEmbedUrl(serverId: string, tmdbId: number | string): string {
  const server = VIDEO_SERVERS.find((s) => s.id === serverId) || VIDEO_SERVERS[0];
  return server.getMovieUrl(tmdbId);
}

/**
 * Direct TV Series / K-Drama Embed URL resolver
 */
export function getTvEmbedUrl(
  serverId: string,
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1,
  imdbId?: string | null
): string {
  const server = VIDEO_SERVERS.find((s) => s.id === serverId) || VIDEO_SERVERS[0];
  return server.getTVUrl(tmdbId, season, episode, imdbId);
}

/**
 * Direct K-Drama Embed URL resolver supporting TMDB + IMDb dual bridge
 */
export function getKDramaEmbedUrl(
  serverId: string,
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1,
  imdbId?: string | null
): string {
  const server =
    KDRAMA_SERVERS.find((s) => s.id === serverId || s.id === `server-${serverId.replace('server-', '')}`) ||
    KDRAMA_SERVERS[0];
  return server.getTVUrl(tmdbId, season, episode, imdbId);
}

/**
 * Unified embed resolver for Movies, TV, and K-Dramas with optional timestamp and bridge support
 */
export function getEmbedUrl(
  serverId: string,
  type: 'movie' | 'tv' | 'kdrama',
  tmdbId: number | string,
  season: number = 1,
  episode: number = 1,
  timeSeconds?: number,
  bridgeOptions?: { imdbId?: string | null; slug?: string | null }
): string {
  let baseUrl = '';
  if (type === 'movie') {
    baseUrl = getMovieEmbedUrl(serverId, tmdbId);
  } else if (type === 'kdrama') {
    baseUrl = getKDramaEmbedUrl(serverId, tmdbId, season, episode, bridgeOptions?.imdbId);
  } else {
    baseUrl = getTvEmbedUrl(serverId, tmdbId, season, episode, bridgeOptions?.imdbId);
  }

  if (timeSeconds && timeSeconds > 0) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}t=${Math.floor(timeSeconds)}`;
  }
  return baseUrl;
}

/**
 * Unified embed resolver for Anime with full bridge support and backward-compatible calling signatures
 */
export function getAnimeEmbedUrl(
  serverId: string,
  id: number | string,
  seasonOrEpisode: number = 1,
  episodeOrSubOrDub: number | 'sub' | 'dub' = 1,
  subOrDubParam: 'sub' | 'dub' = 'sub',
  isMovie: boolean = false,
  bridgeOptions?: AnimeBridgeOptions
): string {
  let season = 1;
  let episode = 1;
  let subOrDub: 'sub' | 'dub' = 'sub';
  let movie = isMovie;

  if (typeof episodeOrSubOrDub === 'string') {
    // Legacy invocation: (serverId, id, episode, subOrDub)
    episode = typeof seasonOrEpisode === 'number' ? seasonOrEpisode : 1;
    subOrDub = episodeOrSubOrDub;
  } else {
    // Standard invocation: (serverId, id, season, episode, subOrDub, isMovie, bridgeOptions)
    season = typeof seasonOrEpisode === 'number' ? seasonOrEpisode : 1;
    episode = typeof episodeOrSubOrDub === 'number' ? episodeOrSubOrDub : 1;
    subOrDub = subOrDubParam;
  }

  const server = ANIME_SERVERS.find((s) => s.id === serverId) || ANIME_SERVERS[0];
  return server.getAnimeUrl(id, season, episode, subOrDub, movie, bridgeOptions);
}
