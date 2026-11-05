'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Play,
  Maximize2,
  Minimize2,
  Server,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Loader2,
  Users,
  X,
} from 'lucide-react';
import { VIDEO_SERVERS, getEmbedUrl } from '@/lib/resolvers';
import { getTMDBImageUrl } from '@/lib/utils';
import { WatchHistoryItem } from '@/components/media/ContinueWatching';
import CreatePartyModal from '@/components/party/CreatePartyModal';
import CustomHlsPlayer from '@/components/player/CustomHlsPlayer';
import AdGateOverlay from '@/components/ads/AdGateOverlay';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface VideoPlayerProps {
  tmdbId: number | string;
  type: 'movie' | 'tv';
  title: string;
  backdropPath?: string | null;
  season?: number;
  episode?: number;
  streamUrl?: string;
}

export default function VideoPlayer({
  tmdbId,
  type,
  title,
  backdropPath,
  season = 1,
  episode = 1,
  streamUrl,
}: VideoPlayerProps) {
  const [selectedServer, setSelectedServer] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlServer = new URL(window.location.href).searchParams.get('server');
        if (urlServer && VIDEO_SERVERS.some((s) => s.id === urlServer)) {
          return urlServer;
        }
        const saved = localStorage.getItem('preferred_movie_tv_server');
        if (saved && VIDEO_SERVERS.some((s) => s.id === saved)) {
          return saved;
        }
      } catch {}
    }
    return 'server-1';
  });

  // Load and apply remembered server preference from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const urlServer = new URL(window.location.href).searchParams.get('server');
      const savedServer = localStorage.getItem('preferred_movie_tv_server');
      const target =
        urlServer && VIDEO_SERVERS.some((s) => s.id === urlServer)
          ? urlServer
          : savedServer && VIDEO_SERVERS.some((s) => s.id === savedServer)
          ? savedServer
          : null;
      if (target && target !== selectedServer) {
        setSelectedServer(target);
      }
    } catch {}
  }, []);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);
  const [showFallbackBanner, setShowFallbackBanner] = useState<boolean>(true);
  const [iframeKey, setIframeKey] = useState<number>(0);

  const fullBackdropUrl = backdropPath ? getTMDBImageUrl(backdropPath, 'original') : null;

  // Save to continue watching when playback starts or episode changes
  useEffect(() => {
    if (isPlaying) {
      try {
        const stored = localStorage.getItem('roseflix_continue_watching');
        let list: WatchHistoryItem[] = stored ? JSON.parse(stored) : [];
        list = list.filter((i) => i.id !== tmdbId);
        list.unshift({
          id: tmdbId,
          type,
          title,
          poster: backdropPath || null,
          season: type === 'tv' ? season : undefined,
          episode: type === 'tv' ? episode : undefined,
          timestamp: Date.now(),
        });
        localStorage.setItem('roseflix_continue_watching', JSON.stringify(list.slice(0, 12)));
      } catch (err) {
        console.error('Failed to update continue watching:', err);
      }
    }
  }, [isPlaying, tmdbId, type, title, backdropPath, season, episode]);

  // Listen for Cross-Origin postMessage events from embed providers (e.g., VidLink MEDIA_DATA)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        // VidLink / player progress event
        if (
          data.type === 'MEDIA_DATA' ||
          data.event === 'timeupdate' ||
          typeof data.currentTime === 'number'
        ) {
          const progressTime = data.currentTime || data.progress || 0;
          if (progressTime > 0) {
            localStorage.setItem(
              `roseflix_progress_${type}_${tmdbId}_s${season}_e${episode}`,
              String(progressTime)
            );
          }
        }
      } catch {
        // Ignore unparseable third-party messages
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [type, tmdbId, season, episode]);

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

  const embedUrl = getEmbedUrl(selectedServer, type, tmdbId, season, episode);

  const handleStartPlay = () => {
    setIsPlaying(true);
  };

  const handleServerChange = (serverId: string) => {
    if (serverId === selectedServer) return;
    setIsLoadingServer(true);
    setSelectedServer(serverId);
    try {
      localStorage.setItem('preferred_movie_tv_server', serverId);
      const url = new URL(window.location.href);
      if (url.searchParams.get('server') !== serverId) {
        url.searchParams.set('server', serverId);
        window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
      }
    } catch {}
    setIframeKey((prev) => prev + 1);
    setIsPlaying(true);

    setTimeout(() => {
      setIsLoadingServer(false);
    }, 500);
  };

  return (
    <div className={`relative transition-all duration-300 ${isTheaterMode ? 'w-full max-w-full' : 'w-full'}`}>
      {/* Control Bar: Server Switcher & Watch Party */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 rounded-xl bg-[#111116] border border-white/5">
        {/* Left: Server Switcher (Hidden if direct streamUrl provided) */}
        {!streamUrl ? (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 mr-1 text-slate-300">
              <Server className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
              <span className="text-xs font-bold uppercase tracking-wider">Servers:</span>
            </div>
            {VIDEO_SERVERS.map((server) => {
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
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
            <Sparkles className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <span>Direct Stream Mode (Ad-Free Native HLS)</span>
          </div>
        )}

        {/* Right side controls: Watch Together + Theater Mode */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Watch Together Trigger */}
          <button
            onClick={() => setIsPartyModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold hover:scale-102 transition-all cursor-pointer shadow-lg"
            style={{
              background: `linear-gradient(to right, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
              boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.5)`,
            }}
            title="Watch together with friends"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Watch Together</span>
          </button>

          {/* Theater Mode Toggle */}
          <button
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-[#1a1a24] hover:bg-white/10 transition-colors cursor-pointer"
            title="Toggle Theater Mode"
          >
            {isTheaterMode ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span>Standard</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span>Theater</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Dismissible Playback Troubleshooting Alert Banner */}
      {showFallbackBanner && (
        <div className="mb-3 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs shadow-lg backdrop-blur-sm transition-all animate-fadeIn">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base select-none">💡</span>
            <span className="font-medium">
              If the video is loading or shows a blank screen, click{' '}
              <button
                type="button"
                onClick={() => handleServerChange('server-2')}
                className="font-bold underline text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                Server 2 (VidSrc To)
              </button>{' '}
              or{' '}
              <button
                type="button"
                onClick={() => handleServerChange('server-4')}
                className="font-bold underline text-white hover:text-amber-300 transition-colors cursor-pointer"
              >
                Server 4 (VidSrc Me)
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

      {/* Main Video Frame / Poster Container (Strict aspect-video for 0 CLS) */}
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
        {isLoadingServer && (
          <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <p className="text-xs font-semibold text-slate-300">Switching server stream...</p>
          </div>
        )}

        {/* 12-Hour Ad-Gate Overlay (Mounted directly inside video frame) */}
        <AdGateOverlay
          title={title}
          backdropUrl={fullBackdropUrl}
          onUnlock={() => setIsPlaying(true)}
        />

        {streamUrl ? (
          /* Direct HLS Stream Player */
          <CustomHlsPlayer
            streamUrl={streamUrl}
            posterUrl={fullBackdropUrl || undefined}
            autoPlay={isPlaying}
          />
        ) : !isPlaying ? (
          /* Pre-Play Poster View */
          <div
            onClick={handleStartPlay}
            className="relative w-full h-full flex items-center justify-center cursor-pointer group"
          >
            {fullBackdropUrl && (
              <Image
                src={fullBackdropUrl}
                alt={title}
                fill
                priority
                className="object-cover filter brightness-[0.55] transition-transform duration-700 group-hover:scale-102"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            {/* Glowing Play CTA */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                  color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  boxShadow: `0 0 35px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.8)`,
                }}
                aria-label="Click to start streaming"
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1.5 transition-transform" style={{ fill: SITE_CONFIG.PRIMARY_CONTRAST_TEXT }} />
              </div>

              <div className="space-y-1">
                <p className="text-white font-bold text-lg sm:text-xl drop-shadow">
                  Click to Stream Now
                </p>
                <p className="text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
                  <Sparkles className="w-3.5 h-3.5" />
                  Multi-server redundancy enabled • 1080p HD
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Server Clean Iframe Embed */
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={title}
            className="absolute inset-0 w-full h-full border-0"
            referrerPolicy="no-referrer"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        )}
      </div>

      {/* Troubleshooting Bar */}
      {!streamUrl && (
        <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Buffering or server down? Switch to another server tab above for instant fallback.</span>
          </div>
          {isPlaying && (
            <button
              onClick={() => setIframeKey((k) => k + 1)}
              className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
              style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
            >
              <RefreshCw className="w-3 h-3" />
              Reload Player
            </button>
          )}
        </div>
      )}

      {/* Watch Together Modal */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        media={{
          tmdbId,
          type,
          title,
          backdropPath,
          season,
          episode,
          customStreamUrl: streamUrl,
        }}
      />
    </div>
  );
}
