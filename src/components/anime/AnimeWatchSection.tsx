'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Server,
  Play,
  Users,
  Search,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Loader2,
  Film,
  Tv,
  X,
} from 'lucide-react';
import { ANIME_SERVERS, getAnimeEmbedUrl } from '@/lib/resolvers';
import { AnimeItem } from '@/lib/anime';
import AdGateOverlay from '@/components/ads/AdGateOverlay';
import CreatePartyModal from '@/components/party/CreatePartyModal';
import { getTMDBImageUrl } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface AnimeWatchSectionProps {
  malId?: string | number;
  anime: AnimeItem;
  initialSeason?: number;
  initialEpisode?: number;
  initialSubOrDub?: 'sub' | 'dub';
  initialBridgeData?: {
    anilistId: number | null;
    malId: number | null;
    slug: string | null;
  };
}

const CHUNK_SIZE = 50;

export default function AnimeWatchSection({
  malId,
  anime,
  initialSeason = 1,
  initialEpisode = 1,
  initialSubOrDub = 'sub',
  initialBridgeData,
}: AnimeWatchSectionProps) {
  const animeId = anime.id || malId || anime.mal_id;
  const isMovie = anime.anime_media_type === 'movie' || anime.type === 'Movie';

  const validSeasons = useMemo(() => {
    if (!anime.seasons || anime.seasons.length === 0) {
      return [{ id: 1, name: 'Season 1', season_number: 1, episode_count: anime.episodes || 12 }];
    }
    return anime.seasons.filter((s) => s.season_number > 0);
  }, [anime.seasons, anime.episodes]);

  // Total series episodes calculation across all seasons or metadata
  const totalSeriesEpisodes = useMemo(() => {
    const sumFromSeasons = validSeasons.reduce((acc, s) => acc + (s.episode_count || 0), 0);
    return Math.max(
      anime.number_of_episodes || 0,
      anime.episodes || 0,
      sumFromSeasons,
      12
    );
  }, [validSeasons, anime.number_of_episodes, anime.episodes]);

  const [selectedServer, setSelectedServer] = useState<string>('anime-server-1');
  const [subOrDub, setSubOrDub] = useState<'sub' | 'dub'>(initialSubOrDub);
  const [currentSeason, setCurrentSeason] = useState<number>(() => {
    const exists = validSeasons.some((s) => s.season_number === initialSeason);
    return exists ? initialSeason : validSeasons[0]?.season_number || 1;
  });
  const [currentEpisode, setCurrentEpisode] = useState<number>(initialEpisode);
  const [viewMode, setViewMode] = useState<'season' | 'continuous'>('season');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState<boolean>(true);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [episodeSearch, setEpisodeSearch] = useState<string>('');
  const [bridgeData, setBridgeData] = useState<{
    anilistId: number | null;
    malId: number | null;
    slug: string | null;
  }>({
    anilistId: initialBridgeData?.anilistId || anime.anilist_id || (anime.id === 37854 || malId == 21 ? 21 : null),
    malId: initialBridgeData?.malId || anime.mal_id || (anime.id === 37854 || malId == 21 ? 21 : null),
    slug: initialBridgeData?.slug || anime.slug || (anime.id === 37854 || malId == 21 ? 'one-piece' : null),
  });

  // Calculate absolute episode index for continuous playback and specialized anime mirrors
  const absoluteEpisode = useMemo(() => {
    if (validSeasons.length <= 1) {
      return currentEpisode;
    }
    let priorCount = 0;
    for (const s of validSeasons) {
      if (s.season_number < currentSeason) {
        priorCount += s.episode_count || 0;
      }
    }
    return Math.max(1, priorCount + currentEpisode);
  }, [validSeasons, currentSeason, currentEpisode]);

  const activeSeasonData = validSeasons.find((s) => s.season_number === currentSeason) || validSeasons[0];
  const seasonEpisodeCount = activeSeasonData?.episode_count || anime.episodes || 12;

  const title = anime.title || anime.name || 'Anime Stream';

  // Dynamic multi-season bridge resolution (using relative API route with timeout & SSR cache check)
  useEffect(() => {
    let isMounted = true;
    if (isMovie) return;

    // If SSR already provided complete bridge data for the current season, skip redundant client fetch
    if (
      currentSeason === initialSeason &&
      bridgeData.malId &&
      bridgeData.anilistId &&
      bridgeData.slug
    ) {
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    fetch(
      `/api/anime/resolve?tmdbId=${animeId}&title=${encodeURIComponent(title)}&season=${currentSeason}`,
      { signal: controller.signal }
    )
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.success) {
          setBridgeData({
            anilistId: data.anilistId,
            malId: data.malId,
            slug: data.slug,
          });
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('[Anime Bridge] Retaining offline bridge data for season', currentSeason);
        }
      })
      .finally(() => {
        clearTimeout(timeout);
      });

    return () => {
      isMounted = false;
      controller.abort();
      clearTimeout(timeout);
    };
  }, [animeId, title, currentSeason, isMovie, initialSeason]);
  const backdropUrl = anime.backdrop_path
    ? getTMDBImageUrl(anime.backdrop_path, 'w1280')
    : anime.poster_path
    ? getTMDBImageUrl(anime.poster_path, 'w1280')
    : '/placeholder-backdrop.svg';

  // Chunk calculations for seasonal view (e.g. 50+ episodes)
  const totalChunks = Math.max(1, Math.ceil(seasonEpisodeCount / CHUNK_SIZE));
  const [selectedChunk, setSelectedChunk] = useState<number>(() => {
    return Math.floor((initialEpisode - 1) / CHUNK_SIZE);
  });

  const chunkRanges = useMemo(() => {
    const ranges: { start: number; end: number; label: string }[] = [];
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE + 1;
      const end = Math.min((i + 1) * CHUNK_SIZE, seasonEpisodeCount);
      ranges.push({
        start,
        end,
        label: `${start}–${end}`,
      });
    }
    return ranges;
  }, [totalChunks, seasonEpisodeCount]);

  // Chunk calculations for continuous series view (up to totalSeriesEpisodes)
  const continuousTotalChunks = Math.max(1, Math.ceil(totalSeriesEpisodes / CHUNK_SIZE));
  const [selectedContinuousChunk, setSelectedContinuousChunk] = useState<number>(() => {
    return Math.floor((initialEpisode - 1) / CHUNK_SIZE);
  });

  const continuousChunkRanges = useMemo(() => {
    const ranges: { start: number; end: number; label: string }[] = [];
    for (let i = 0; i < continuousTotalChunks; i++) {
      const start = i * CHUNK_SIZE + 1;
      const end = Math.min((i + 1) * CHUNK_SIZE, totalSeriesEpisodes);
      ranges.push({
        start,
        end,
        label: `${start}–${end}`,
      });
    }
    return ranges;
  }, [continuousTotalChunks, totalSeriesEpisodes]);

  // Keep chunk selections aligned when episode changes
  useEffect(() => {
    const targetContinuousChunk = Math.floor((absoluteEpisode - 1) / CHUNK_SIZE);
    setSelectedContinuousChunk(targetContinuousChunk);
  }, [absoluteEpisode]);

  useEffect(() => {
    const targetSeasonChunk = Math.floor((currentEpisode - 1) / CHUNK_SIZE);
    setSelectedChunk(targetSeasonChunk);
  }, [currentEpisode]);

  // Episodes for current seasonal chunk
  const displayedEpisodes = useMemo(() => {
    if (episodeSearch.trim() && viewMode === 'season') {
      const queryNum = parseInt(episodeSearch.trim(), 10);
      if (!isNaN(queryNum) && queryNum > 0 && queryNum <= seasonEpisodeCount) {
        return [queryNum];
      }
      return [];
    }

    const currentRange = chunkRanges[selectedChunk] || chunkRanges[0] || { start: 1, end: seasonEpisodeCount };
    const eps: number[] = [];
    for (let i = currentRange.start; i <= currentRange.end; i++) {
      eps.push(i);
    }
    return eps;
  }, [selectedChunk, chunkRanges, episodeSearch, seasonEpisodeCount, viewMode]);

  // Episodes for current continuous chunk
  const displayedContinuousEpisodes = useMemo(() => {
    if (episodeSearch.trim() && viewMode === 'continuous') {
      const queryNum = parseInt(episodeSearch.trim(), 10);
      if (!isNaN(queryNum) && queryNum > 0 && queryNum <= totalSeriesEpisodes) {
        return [queryNum];
      }
      return [];
    }

    const currentRange =
      continuousChunkRanges[selectedContinuousChunk] ||
      continuousChunkRanges[0] ||
      { start: 1, end: totalSeriesEpisodes };
    const eps: number[] = [];
    for (let i = currentRange.start; i <= currentRange.end; i++) {
      eps.push(i);
    }
    return eps;
  }, [selectedContinuousChunk, continuousChunkRanges, episodeSearch, totalSeriesEpisodes, viewMode]);

  // Global window.open Auto-Quit Tab Interceptor
  useEffect(() => {
    const originalOpen = window.open;
    const directLink = process.env.NEXT_PUBLIC_DIRECT_LINK_URL?.trim();

    window.open = function (url, target, features) {
      if (
        directLink &&
        url &&
        (url === directLink || url.toString().includes(directLink))
      ) {
        return originalOpen.call(window, url, target, features);
      }

      console.warn('[Ad Interceptor] Blocked and auto-closed rogue popup redirect to:', url);
      return {
        closed: true,
        focus: () => {},
        close: () => {},
      } as unknown as Window;
    };

    return () => {
      window.open = originalOpen;
    };
  }, []);

  const embedUrl = getAnimeEmbedUrl(
    selectedServer,
    animeId,
    currentSeason,
    currentEpisode,
    subOrDub,
    isMovie,
    {
      ...bridgeData,
      absoluteEpisode,
    }
  );

  const handleSelectSeason = (seasonNum: number) => {
    if (seasonNum === currentSeason) return;
    setCurrentSeason(seasonNum);
    setCurrentEpisode(1);
    setSelectedChunk(0);
    setIframeKey((k) => k + 1);
  };

  const handleSelectEpisode = (ep: number) => {
    setCurrentEpisode(ep);
    setIsPlaying(true);
    setIframeKey((k) => k + 1);
  };

  const handleSelectAbsoluteEpisode = (absEp: number) => {
    // Map absolute episode number to season and seasonal episode
    let runningCount = 0;
    let targetSeason = validSeasons[0]?.season_number || 1;
    let targetEp = absEp;

    for (const s of validSeasons) {
      const count = s.episode_count || 0;
      if (runningCount + count >= absEp) {
        targetSeason = s.season_number;
        targetEp = Math.max(1, absEp - runningCount);
        break;
      }
      runningCount += count;
    }

    if (runningCount < absEp && validSeasons.length > 0) {
      const lastSeason = validSeasons[validSeasons.length - 1];
      targetSeason = lastSeason.season_number;
      targetEp = Math.max(1, absEp - (runningCount - (lastSeason.episode_count || 0)));
    }

    setCurrentSeason(targetSeason);
    setCurrentEpisode(targetEp);
    setIsPlaying(true);
    setIframeKey((k) => k + 1);
  };

  const handleServerChange = (serverId: string) => {
    if (serverId === selectedServer) return;
    setIsLoadingServer(true);
    setSelectedServer(serverId);
    setIframeKey((prev) => prev + 1);
    setIsPlaying(true);

    setTimeout(() => {
      setIsLoadingServer(false);
    }, 450);
  };

  const handleJumpToEpisode = (e: React.FormEvent) => {
    e.preventDefault();
    const epNum = parseInt(episodeSearch.trim(), 10);
    if (isNaN(epNum) || epNum < 1) return;

    if (viewMode === 'continuous' || epNum > seasonEpisodeCount) {
      if (epNum <= totalSeriesEpisodes) {
        const targetChunk = Math.floor((epNum - 1) / CHUNK_SIZE);
        setSelectedContinuousChunk(targetChunk);
        handleSelectAbsoluteEpisode(epNum);
        setEpisodeSearch('');
      }
    } else {
      if (epNum <= seasonEpisodeCount) {
        const targetChunk = Math.floor((epNum - 1) / CHUNK_SIZE);
        setSelectedChunk(targetChunk);
        handleSelectEpisode(epNum);
        setEpisodeSearch('');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Player Header Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#111116] border border-white/5 shadow-xl">
        {/* Left: Server Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1 text-slate-300">
            <Server className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <span className="text-xs font-bold uppercase tracking-wider">Server:</span>
          </div>
          {ANIME_SERVERS.map((server) => {
            const isActive = selectedServer === server.id;
            return (
              <button
                key={server.id}
                onClick={() => handleServerChange(server.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'shadow-lg font-semibold scale-102'
                    : 'bg-[#181824] text-slate-300 hover:text-white hover:bg-[#202030] border border-white/5'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                        color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                        boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                      }
                    : undefined
                }
              >
                <span>{server.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right side controls: Bridge Status + Sub/Dub Toggle + Watch Party */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bridge Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-xl bg-[#181824] text-slate-300 border border-white/10 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }} />
            <span>MAL #{bridgeData.malId || anime.mal_id || animeId}</span>
            <span className="text-white/20">•</span>
            <span>AniList #{bridgeData.anilistId || anime.anilist_id || animeId}</span>
            <span className="text-white/20">•</span>
            <span>Ep #{absoluteEpisode}</span>
          </div>

          {/* Audio Track Toggle (SUB | DUB) - Available for series & movies */}
          <div className="flex items-center p-1 rounded-xl bg-[#181824] border border-white/10 shadow-inner">
            <button
              onClick={() => {
                setSubOrDub('sub');
                setIframeKey((k) => k + 1);
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subOrDub === 'sub'
                  ? 'shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                subOrDub === 'sub'
                  ? {
                      backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                      color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                      boxShadow: `0 0 10px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.5)`,
                    }
                  : undefined
              }
            >
              <span>🇯🇵 SUB</span>
            </button>
            <button
              onClick={() => {
                setSubOrDub('dub');
                setIframeKey((k) => k + 1);
              }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subOrDub === 'dub'
                  ? 'shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              style={
                subOrDub === 'dub'
                  ? {
                      backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                      color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                      boxShadow: `0 0 10px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.5)`,
                    }
                  : undefined
              }
            >
              <span>🇺🇸 DUB</span>
            </button>
          </div>

          {/* Watch Party CTA */}
          <button
            onClick={() => setIsPartyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
              boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
            }}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Watch Together</span>
          </button>
        </div>
      </div>

      {/* Dismissible Playback Troubleshooting Alert Banner */}
      {showFallbackBanner && (
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs shadow-lg backdrop-blur-sm transition-all animate-fadeIn">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base select-none">💡</span>
            <span className="font-medium">
              If the video is loading or shows a blank screen, click{' '}
              <button
                type="button"
                onClick={() => handleServerChange('anime-server-2')}
                className="font-bold underline text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                Server 2 (VidSrc CC Anime)
              </button>{' '}
              or{' '}
              <button
                type="button"
                onClick={() => handleServerChange('anime-server-5')}
                className="font-bold underline text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                Server 5 (2Embed / GogoAnime)
              </button>{' '}
              above for instant playback.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowFallbackBanner(false)}
            aria-label="Dismiss alert"
            className="p-1 rounded-lg text-amber-300/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Video Player Container (Strict aspect-video for 0 CLS) */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
        {isLoadingServer && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <p className="text-xs font-semibold text-slate-300">Loading Anime Stream...</p>
          </div>
        )}

        {/* 12-Hour Ad Gate Overlay */}
        <AdGateOverlay
          title={isMovie ? title : `${title} - Ep ${absoluteEpisode} (S${currentSeason} E${currentEpisode})`}
          backdropUrl={backdropUrl}
          onUnlock={() => setIsPlaying(true)}
        />

        {!isPlaying ? (
          /* Pre-Play Poster Overlay */
          <div
            onClick={() => setIsPlaying(true)}
            className="relative w-full h-full flex items-center justify-center cursor-pointer group"
          >
            {backdropUrl && (
              <Image
                src={backdropUrl}
                alt={title}
                fill
                priority
                unoptimized={Boolean(backdropUrl && (backdropUrl.includes('myanimelist.net') || backdropUrl.startsWith('/placeholder')))}
                className="object-cover filter brightness-[0.5] transition-transform duration-700 group-hover:scale-102"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                  color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  boxShadow: `0 0 35px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.8)`,
                }}
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1.5" style={{ fill: SITE_CONFIG.PRIMARY_CONTRAST_TEXT }} />
              </div>

              <div className="space-y-1">
                <p className="text-white font-black text-xl sm:text-2xl drop-shadow">
                  {isMovie
                    ? `Play Movie (${subOrDub.toUpperCase()})`
                    : `Play Ep ${absoluteEpisode} (S${currentSeason} E${currentEpisode}) (${subOrDub.toUpperCase()})`}
                </p>
                <p className="text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  6 Multi-Server 1080p HD Anime Mirrors
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Server Clean Iframe Embed */
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={isMovie ? title : `${title} - Ep ${absoluteEpisode} (S${currentSeason} E${currentEpisode})`}
            className="absolute inset-0 w-full h-full border-0"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        )}
      </div>

      {/* Troubleshooting bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Switch between SUB / DUB or switch to another server tab if playback buffers.</span>
        </div>
        {isPlaying && (
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
            style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
          >
            <RefreshCw className="w-3 h-3" />
            Reload Stream
          </button>
        )}
      </div>

      {/* Series Seasons & Episode Selector Grid (Hidden if Movie) */}
      {!isMovie && (
        <div className="mt-8 p-6 rounded-2xl bg-[#0e0e13] border border-white/5 shadow-2xl space-y-5">
          {/* Header & Mode Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Tv className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <h3 className="text-lg font-bold text-white">Episodes & Seasons</h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
                  {viewMode === 'season'
                    ? `Season ${currentSeason} (${seasonEpisodeCount} Eps)`
                    : `All ${totalSeriesEpisodes} Episodes`}
                </span>
                {validSeasons.length > 1 && (
                  <span className="text-[11px] font-medium text-slate-400">
                    • {validSeasons.length} Seasons
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Currently playing: <strong className="text-white">Episode {absoluteEpisode}</strong> (Season {currentSeason} Ep {currentEpisode}) • <span className="uppercase">{subOrDub}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Dual-Mode Selector: By Season vs Continuous Grid */}
              {(validSeasons.length > 1 || totalSeriesEpisodes > 50) && (
                <div className="flex items-center p-0.5 rounded-xl bg-[#161622] border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode('season')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'season' ? 'shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                    style={
                      viewMode === 'season'
                        ? {
                            backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                            color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                            boxShadow: `0 0 10px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
                          }
                        : undefined
                    }
                  >
                    By Season
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('continuous')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      viewMode === 'continuous' ? 'shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                    style={
                      viewMode === 'continuous'
                        ? {
                            backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                            color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                            boxShadow: `0 0 10px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
                          }
                        : undefined
                    }
                  >
                    All Episodes ({totalSeriesEpisodes})
                  </button>
                </div>
              )}

              {/* Quick Jump Input */}
              <form onSubmit={handleJumpToEpisode} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={totalSeriesEpisodes}
                    value={episodeSearch}
                    onChange={(e) => setEpisodeSearch(e.target.value)}
                    placeholder={viewMode === 'continuous' ? `Jump (1-${totalSeriesEpisodes})...` : "Jump to ep #..."}
                    className="w-36 pl-8 pr-3 py-1.5 rounded-xl bg-[#161622] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                  style={{
                    backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                    color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  }}
                >
                  Go
                </button>
              </form>
            </div>
          </div>

          {/* Season Mode: Season Tabs */}
          {viewMode === 'season' && validSeasons.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 pt-1 border-b border-white/5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Seasons:</span>
              {validSeasons.map((s) => (
                <button
                  key={s.season_number}
                  onClick={() => handleSelectSeason(s.season_number)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer border ${
                    currentSeason === s.season_number
                      ? 'shadow-lg'
                      : 'bg-[#161622] text-slate-400 hover:text-white hover:bg-[#202030] border-white/5'
                  }`}
                  style={
                    currentSeason === s.season_number
                      ? {
                          backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                          color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                          borderColor: SITE_CONFIG.PRIMARY_COLOR,
                          boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                        }
                      : undefined
                  }
                >
                  <span>{s.name || `Season ${s.season_number}`}</span>
                  <span className="ml-1 text-[10px] opacity-75">({s.episode_count} eps)</span>
                </button>
              ))}
            </div>
          )}

          {/* Season Mode: Chunk Selector Tabs (for 50+ episodes in long-running seasons) */}
          {viewMode === 'season' && totalChunks > 1 && !episodeSearch && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs text-slate-400 font-semibold mr-1 shrink-0">Range:</span>
              {chunkRanges.map((chunk, idx) => (
                <button
                  key={chunk.label}
                  onClick={() => setSelectedChunk(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedChunk === idx
                      ? 'shadow-md'
                      : 'bg-[#161622] text-slate-400 hover:text-white hover:bg-[#202030] border border-white/5'
                  }`}
                  style={
                    selectedChunk === idx
                      ? {
                          backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                          color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                          boxShadow: `0 0 12px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.5)`,
                        }
                      : undefined
                  }
                >
                  {chunk.label}
                </button>
              ))}
            </div>
          )}

          {/* Continuous Mode: Continuous 50-Episode Chunk Selector Tabs */}
          {viewMode === 'continuous' && continuousTotalChunks > 1 && !episodeSearch && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-xs text-slate-400 font-semibold mr-1 shrink-0">Episode Range:</span>
              {continuousChunkRanges.map((chunk, idx) => (
                <button
                  key={chunk.label}
                  onClick={() => setSelectedContinuousChunk(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer ${
                    selectedContinuousChunk === idx
                      ? 'shadow-md'
                      : 'bg-[#161622] text-slate-400 hover:text-white hover:bg-[#202030] border border-white/5'
                  }`}
                  style={
                    selectedContinuousChunk === idx
                      ? {
                          backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                          color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                          boxShadow: `0 0 12px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.5)`,
                        }
                      : undefined
                  }
                >
                  {chunk.label}
                </button>
              ))}
            </div>
          )}

          {/* Episode Grid Buttons */}
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 max-h-[360px] overflow-y-auto pr-1">
            {viewMode === 'season'
              ? displayedEpisodes.map((ep) => {
                  const isSelected = currentEpisode === ep;
                  return (
                    <button
                      key={ep}
                      onClick={() => handleSelectEpisode(ep)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'shadow-lg scale-105'
                          : 'bg-[#14141d] hover:bg-[#1f1f2e] text-slate-300 hover:text-white border-white/5'
                      }`}
                      style={
                        isSelected
                          ? {
                              background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                              borderColor: SITE_CONFIG.PRIMARY_COLOR,
                              boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                            }
                          : undefined
                      }
                    >
                      <span>Ep {ep}</span>
                      {isSelected && <span className="text-[9px] font-normal uppercase tracking-wider opacity-90">Playing</span>}
                    </button>
                  );
                })
              : displayedContinuousEpisodes.map((ep) => {
                  const isSelected = absoluteEpisode === ep;
                  return (
                    <button
                      key={ep}
                      onClick={() => handleSelectAbsoluteEpisode(ep)}
                      className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? 'shadow-lg scale-105'
                          : 'bg-[#14141d] hover:bg-[#1f1f2e] text-slate-300 hover:text-white border-white/5'
                      }`}
                      style={
                        isSelected
                          ? {
                              background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                              borderColor: SITE_CONFIG.PRIMARY_COLOR,
                              boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                            }
                          : undefined
                      }
                    >
                      <span>Ep {ep}</span>
                      {isSelected && <span className="text-[9px] font-normal uppercase tracking-wider opacity-90">Playing</span>}
                    </button>
                  );
                })}
          </div>
        </div>
      )}

      {/* Movie Mode Indicator if Feature Film */}
      {isMovie && (
        <div className="mt-6 p-4 rounded-2xl bg-[#0e0e13] border border-white/5 flex items-center gap-3">
          <Film className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          <div>
            <h4 className="text-sm font-bold text-white">Full-Length Anime Feature Film</h4>
            <p className="text-xs text-slate-400">
              This title is a standalone theatrical movie. Choose your preferred server and audio track above.
            </p>
          </div>
        </div>
      )}

      {/* Watch Party Modal */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        media={{
          tmdbId: animeId,
          type: 'anime',
          title: isMovie ? title : `${title} - Ep ${absoluteEpisode} (S${currentSeason} Ep ${currentEpisode}) (${subOrDub.toUpperCase()})`,
          backdropPath: backdropUrl,
          season: currentSeason,
          episode: currentEpisode,
          subOrDub,
        }}
      />
    </div>
  );
}
