'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Server,
  Play,
  Users,
  AlertCircle,
  RefreshCw,
  Loader2,
  Sparkles,
  X,
} from 'lucide-react';
import { KDRAMA_SERVERS, getEmbedUrl } from '@/lib/resolvers';
import { SeasonSummary } from '@/types/tmdb';
import { getTMDBImageUrl } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';
import AdGateOverlay from '@/components/ads/AdGateOverlay';
import EpisodeSelector from '@/components/media/EpisodeSelector';
import CreatePartyModal from '@/components/party/CreatePartyModal';
import { triggerHybridActionAd } from '@/components/ads/PopUnderManager';

interface KDramaWatchSectionProps {
  tvId: number;
  showTitle: string;
  imdbId?: string | null;
  slug?: string | null;
  backdropPath?: string | null;
  seasons: SeasonSummary[];
  initialSeason: number;
  initialEpisode: number;
}

export default function KDramaWatchSection({
  tvId,
  showTitle,
  imdbId,
  slug,
  backdropPath,
  seasons,
  initialSeason,
  initialEpisode,
}: KDramaWatchSectionProps) {
  const [selectedServer, setSelectedServer] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlServer = new URL(window.location.href).searchParams.get('server');
        if (urlServer && KDRAMA_SERVERS.some((s) => s.id === urlServer)) {
          return urlServer;
        }
        const saved = localStorage.getItem('preferred_kdrama_server');
        if (saved && KDRAMA_SERVERS.some((s) => s.id === saved)) {
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
      const savedServer = localStorage.getItem('preferred_kdrama_server');
      const target =
        urlServer && KDRAMA_SERVERS.some((s) => s.id === urlServer)
          ? urlServer
          : savedServer && KDRAMA_SERVERS.some((s) => s.id === savedServer)
          ? savedServer
          : null;
      if (target && target !== selectedServer) {
        setSelectedServer(target);
      }
    } catch {}
  }, []);
  const [currentSeason, setCurrentSeason] = useState<number>(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState<number>(initialEpisode);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [showFallbackBanner, setShowFallbackBanner] = useState<boolean>(true);
  const [isLoadingServer, setIsLoadingServer] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState<boolean>(false);

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

  const fullBackdropUrl = backdropPath ? getTMDBImageUrl(backdropPath, 'original') : null;
  const embedUrl = getEmbedUrl(selectedServer, 'kdrama', tvId, currentSeason, currentEpisode, undefined, {
    imdbId,
    slug,
  });

  const handleSelectEpisode = (season: number, episode: number) => {
    // Trigger hybrid monetization pass on user action
    triggerHybridActionAd();

    setCurrentSeason(season);
    setCurrentEpisode(episode);
    setIsPlaying(true);
    setIframeKey((k) => k + 1);
  };

  const handleServerChange = (serverId: string) => {
    if (serverId === selectedServer) return;

    // Trigger hybrid monetization pass on server switch
    triggerHybridActionAd();

    setIsLoadingServer(true);
    setSelectedServer(serverId);
    try {
      localStorage.setItem('preferred_kdrama_server', serverId);
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
    }, 450);
  };

  return (
    <div className="space-y-4">
      {/* Control Bar: Server Switcher & Watch Party */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#111116] border border-white/5 shadow-xl">
        {/* Left: Server Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 mr-1 text-slate-300">
            <Server className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <span className="text-xs font-bold uppercase tracking-wider">Servers:</span>
          </div>
          {KDRAMA_SERVERS.map((server) => {
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

        {/* Right side controls: Bridge Status Pill, Audio Badge & Watch Party */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Bridge Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-[#181824] text-slate-300 border border-white/10 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }} />
            <span>TMDB #{tvId}</span>
            <span className="text-white/20">•</span>
            <span>IMDb {imdbId || 'Linked'}</span>
          </div>

          {/* Audio & Subtitle Indicator Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-[#181824] text-slate-200 border border-white/10 shadow-inner">
            <span>🇰🇷 Korean Audio • 🇺🇸 Eng Sub</span>
          </span>

          {/* Watch Party CTA */}
          <button
            onClick={() => setIsPartyModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:brightness-110 hover:scale-105 transition-all cursor-pointer"
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
          title={`${showTitle} - S${currentSeason} E${currentEpisode}`}
          backdropUrl={fullBackdropUrl}
          onUnlock={() => setIsPlaying(true)}
        />

        {!isPlaying ? (
          /* Pre-Play Poster View */
          <div
            onClick={() => {
              triggerHybridActionAd();
              setIsPlaying(true);
            }}
            className="relative w-full h-full flex items-center justify-center cursor-pointer group"
          >
            {fullBackdropUrl && (
              <Image
                src={fullBackdropUrl}
                alt={showTitle}
                fill
                priority
                className="object-cover filter brightness-[0.55] transition-transform duration-700 group-hover:scale-102"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

            <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-4">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 active:scale-95 transition-all duration-300"
                style={{
                  backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                  boxShadow: `0 0 35px ${SITE_CONFIG.PRIMARY_COLOR}99`,
                }}
              >
                <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1.5 transition-transform" />
              </div>

              <div className="space-y-1">
                <p className="text-white font-black text-lg sm:text-xl drop-shadow">
                  Play S{currentSeason} Episode {currentEpisode} (Eng Sub)
                </p>
                <p className="text-xs sm:text-sm text-pink-300 font-semibold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Multi-server K-Drama stream • 1080p Full HD
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Multi-Server Clean Iframe Embed */
          <iframe
            key={iframeKey}
            src={embedUrl}
            title={`${showTitle} - S${currentSeason} E${currentEpisode}`}
            className="absolute inset-0 w-full h-full border-0"
            referrerPolicy="no-referrer"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        )}
      </div>

      {/* Troubleshooting bar */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Buffering or server down? Switch to another server tab above for instant fallback.</span>
        </div>
        {isPlaying && (
          <button
            onClick={() => setIframeKey((k) => k + 1)}
            className="flex items-center gap-1 text-pink-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reload Player
          </button>
        )}
      </div>

      {/* Season and Episode Selector Grid */}
      <EpisodeSelector
        tvId={tvId}
        seasons={seasons}
        currentSeason={currentSeason}
        currentEpisode={currentEpisode}
        onSelect={handleSelectEpisode}
      />

      {/* Watch Together Modal */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        media={{
          tmdbId: tvId,
          type: 'kdrama' as any,
          title: `${showTitle} - S${currentSeason} E${currentEpisode} (Eng Sub)`,
          backdropPath,
          season: currentSeason,
          episode: currentEpisode,
        }}
      />
    </div>
  );
}

