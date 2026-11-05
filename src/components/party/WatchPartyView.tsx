'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  Copy,
  Check,
  Send,
  Crown,
  AlertTriangle,
  LogOut,
  MessageSquare,
  ShieldAlert,
  Zap,
  Pause,
  Play,
  Clock,
  RotateCcw,
  Sliders,
  Sparkles,
  Flame,
  Film,
  Tv,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  VIDEO_SERVERS,
  ANIME_SERVERS,
  getEmbedUrl,
  getAnimeEmbedUrl,
} from '@/lib/resolvers';
import { PartyMedia, ChatMessage, PartyPlaybackState } from '@/lib/partyStore';
import CustomHlsPlayer from '@/components/player/CustomHlsPlayer';
import { SITE_CONFIG } from '@/lib/siteConfig';

function formatSecondsToTimestamp(totalSeconds: number): string {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function parseEmbedTelemetry(data: any): { currentTime: number; duration?: number } | null {
  if (!data) return null;
  let obj = data;
  if (typeof obj === 'string') {
    try {
      obj = JSON.parse(obj);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') return null;

  // 1. VidLink PLAYER_EVENT: { type: 'PLAYER_EVENT', data: { event: 'timeupdate', currentTime: number, duration: number } }
  if (obj.type === 'PLAYER_EVENT' && obj.data) {
    const time = obj.data.currentTime ?? obj.data.progress;
    if (typeof time === 'number' && !isNaN(time)) {
      return { currentTime: time, duration: obj.data.duration };
    }
  }

  // 2. FrameXTV: event: 'frameXTV:timeupdate'
  if (obj.event === 'frameXTV:timeupdate' && typeof obj.currentTime === 'number') {
    return { currentTime: obj.currentTime, duration: obj.duration };
  }

  // 3. VidLink MEDIA_DATA / MEDIA_TIME
  if (obj.type === 'MEDIA_DATA' || obj.type === 'MEDIA_TIME') {
    const directTime = obj.data?.currentTime ?? obj.currentTime ?? obj.data?.time ?? obj.progress;
    if (typeof directTime === 'number' && !isNaN(directTime)) {
      return { currentTime: directTime, duration: obj.data?.duration ?? obj.duration };
    }
    if (obj.data?.progress && typeof obj.data.progress.watched === 'number') {
      return { currentTime: obj.data.progress.watched, duration: obj.data.progress.duration };
    }
    if (obj.data && typeof obj.data === 'object') {
      for (const k of Object.keys(obj.data)) {
        const item = obj.data[k];
        if (item?.progress && typeof item.progress.watched === 'number') {
          return { currentTime: item.progress.watched, duration: item.progress.duration };
        }
        if (item?.show_progress) {
          for (const epKey of Object.keys(item.show_progress)) {
            const ep = item.show_progress[epKey];
            if (ep?.progress && typeof ep.progress.watched === 'number') {
              return { currentTime: ep.progress.watched, duration: ep.progress.duration };
            }
          }
        }
      }
    }
  }

  // 4. Generic HTML5 / Player.js / JWPlayer (event: 'timeupdate' or 'time')
  if (obj.event === 'timeupdate' || obj.event === 'time') {
    const time =
      typeof obj.value === 'number'
        ? obj.value
        : obj.value?.seconds ?? obj.value?.currentTime ?? obj.currentTime ?? obj.seconds ?? obj.time;
    if (typeof time === 'number' && !isNaN(time)) {
      return { currentTime: time, duration: obj.value?.duration ?? obj.duration };
    }
  }

  // 5. Direct properties on data object
  if (typeof obj.currentTime === 'number' && !isNaN(obj.currentTime) && obj.currentTime > 0) {
    return { currentTime: obj.currentTime, duration: obj.duration };
  }

  return null;
}

interface WatchPartyViewProps {
  roomId: string;
}

interface RoomState {
  roomId: string;
  hostName: string;
  media: PartyMedia;
  mediaType?: 'movie' | 'tv' | 'anime' | 'kdrama';
  server: string;
  status: 'active' | 'ended';
  participantCount: number;
  messages: ChatMessage[];
  playback?: PartyPlaybackState;
  isHost?: boolean;
}

interface WatchPartyVideoFrameProps {
  status: 'active' | 'ended';
  soloWatchUrl: string;
  isCountingDown: boolean;
  countdownSeconds: number | null;
  isPaused: boolean;
  isHost: boolean;
  timestampFormatted?: string;
  isSyncingPlayback: boolean;
  onTogglePause: () => void;
  customStreamUrl?: string;
  backdropPath?: string | null;
  iframeKey: number;
  currentEmbedUrl: string;
  title: string;
}

// Memoized player container isolated from chat updates and typing re-renders
const WatchPartyVideoFrame = React.memo(function WatchPartyVideoFrame({
  status,
  soloWatchUrl,
  isCountingDown,
  countdownSeconds,
  isPaused,
  isHost,
  timestampFormatted,
  isSyncingPlayback,
  onTogglePause,
  customStreamUrl,
  backdropPath,
  iframeKey,
  currentEmbedUrl,
  title,
}: WatchPartyVideoFrameProps) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10">
      {/* 1. ROOM ENDED OVERLAY */}
      {status === 'ended' && (
        <div className="absolute inset-0 z-40 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shadow-xl">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Watch Party Ended
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md">
              The creator of the link has left the session. As designed, this temporary watch room has now expired.
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={soloWatchUrl}
              className="px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all"
              style={{
                backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
              }}
            >
              Continue Watching Solo
            </Link>
            <Link
              href="/"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#1a1a24] border border-white/10 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      )}

      {/* 2. SYNCHRONIZED COUNTDOWN OVERLAY (3... 2... 1... PLAY!) */}
      {isCountingDown && (
        <div className="absolute inset-0 z-35 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-3">
          <div
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 flex items-center justify-center animate-pulse"
            style={{
              background: `radial-gradient(circle, rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.25) 0%, rgba(255, 255, 255, 0.05) 100%)`,
              borderColor: SITE_CONFIG.PRIMARY_COLOR,
              boxShadow: `0 0 40px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.9)`,
            }}
          >
            <span
              className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text"
              style={{
                backgroundImage: `linear-gradient(to bottom, #ffffff, ${SITE_CONFIG.PRIMARY_COLOR})`,
              }}
            >
              {countdownSeconds}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-white tracking-wide">
              Resuming Stream in {countdownSeconds}...
            </p>
            <p className="text-xs font-semibold" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
              All party viewers synchronized
            </p>
          </div>
        </div>
      )}

      {/* 3. SYNCHRONIZED PAUSE OVERLAY */}
      {isPaused && !isCountingDown && (
        <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
            style={{
              backgroundColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.15)`,
              borderColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
              borderWidth: '1px',
              boxShadow: `0 0 30px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.7)`,
            }}
          >
            <Pause className="w-8 h-8" style={{ fill: SITE_CONFIG.PRIMARY_COLOR, color: SITE_CONFIG.PRIMARY_COLOR }} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Session Paused by Host
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              {isHost
                ? 'You have paused the room. Click Resume Party to initiate a 3-second synchronized countdown for all viewers.'
                : 'The host has paused the session. Grab popcorn — the stream will resume once the host unpauses.'}
            </p>
            {timestampFormatted && (
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-mono mt-1"
                style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Paused at {timestampFormatted}</span>
              </div>
            )}
          </div>

          {isHost && (
            <button
              onClick={onTogglePause}
              disabled={isSyncingPlayback}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Resume Party (3s Countdown)</span>
            </button>
          )}
        </div>
      )}

      {/* Active Video Player (HLS or Iframe) */}
      {customStreamUrl ? (
        <CustomHlsPlayer
          streamUrl={customStreamUrl}
          posterUrl={backdropPath || undefined}
          autoPlay={!isPaused}
        />
      ) : (
        <iframe
          key={iframeKey}
          src={currentEmbedUrl}
          title={title}
          className="absolute inset-0 w-full h-full border-0"
          referrerPolicy="no-referrer"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      )}
    </div>
  );
});

export default function WatchPartyView({ roomId }: WatchPartyViewProps) {
  const router = useRouter();

  const [roomData, setRoomData] = useState<RoomState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [hostToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    }
    return null;
  });

  const [myNickname, setMyNickname] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('roseflix_party_name');
      if (saved) return saved;
      const token = sessionStorage.getItem(`roseflix_party_host_${roomId}`);
      if (token) return 'Host';
      const randomGuest = `Guest_${Math.floor(100 + Math.random() * 900)}`;
      sessionStorage.setItem('roseflix_party_name', randomGuest);
      return randomGuest;
    }
    return 'Guest';
  });

  const [inputMessage, setInputMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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

  // State for live playback telemetry and synchronization
  const [hostPlaybackSeconds, setHostPlaybackSeconds] = useState<number>(0);
  const [appliedTimestampSeconds, setAppliedTimestampSeconds] = useState<number | undefined>(undefined);
  const [justSynced, setJustSynced] = useState(false);
  const lastReportedTimeRef = useRef<number>(0);
  const lastReportedAtRef = useRef<number>(0);
  const lastSeekVersionRef = useRef<number | undefined>(undefined);

  // Cross-Origin postMessage Telemetry Listener for Watch Party Timestamp Syncing
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const telemetry = parseEmbedTelemetry(event.data);
        if (!telemetry || typeof telemetry.currentTime !== 'number') return;

        const currentSeconds = Math.floor(telemetry.currentTime);
        if (currentSeconds <= 0) return;

        // Save local backup
        try {
          localStorage.setItem(
            `party_telemetry_${roomId}`,
            JSON.stringify({
              currentTime: currentSeconds,
              duration: Math.floor(telemetry.duration || 0),
              updatedAt: Date.now(),
            })
          );
        } catch {}

        // If this user is the room host, update local display time and broadcast to party backend
        const currentHostToken =
          hostToken ||
          (typeof window !== 'undefined'
            ? sessionStorage.getItem(`roseflix_party_host_${roomId}`)
            : null);

        if (currentHostToken) {
          setHostPlaybackSeconds(currentSeconds);

          const now = Date.now();
          const timeDiff = Math.abs(currentSeconds - lastReportedTimeRef.current);
          const elapsed = now - lastReportedAtRef.current;

          // Throttled broadcast: every 4 seconds, or immediately on large jump (> 5 seconds)
          if (elapsed > 4000 || timeDiff > 5) {
            lastReportedTimeRef.current = currentSeconds;
            lastReportedAtRef.current = now;

            fetch(`/api/party/${roomId}/playback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-host-token': currentHostToken,
              },
              body: JSON.stringify({
                action: 'telemetry',
                timestampSeconds: currentSeconds,
              }),
            }).catch(() => {});
          }
        }
      } catch {
        // Silently ignore cross-origin or parse errors
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [roomId, hostToken]);

  // Playback sync controls
  const [customTimestamp, setCustomTimestamp] = useState<string | null>(null);
  const [isSyncingPlayback, setIsSyncingPlayback] = useState(false);
  const [hostJustSynced, setHostJustSynced] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Real-Time Server-Sent Events (SSE) Stream Subscription
  useEffect(() => {
    let isMounted = true;
    const currentToken =
      hostToken ||
      (typeof window !== 'undefined'
        ? sessionStorage.getItem(`roseflix_party_host_${roomId}`)
        : null);

    const streamUrl = `/api/party/${roomId}/stream${
      currentToken ? `?token=${encodeURIComponent(currentToken)}` : ''
    }`;

    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      if (isMounted) {
        setIsLiveConnected(true);
      }
    };

    eventSource.onmessage = (event) => {
      if (!isMounted) return;
      try {
        const data = JSON.parse(event.data);
        setRoomData(data);
        setLoading(false);

        if (data.status === 'ended') {
          setError('This temporary watch party has ended.');
        }

        // Detect explicit host seek via seekVersion to jump/reload all viewers to the new seek point
        if (
          data.playback?.seekVersion !== undefined &&
          data.playback.seekVersion > 0 &&
          data.playback.seekVersion !== lastSeekVersionRef.current
        ) {
          lastSeekVersionRef.current = data.playback.seekVersion;
          if (data.playback.timestampSeconds !== undefined && data.playback.timestampSeconds > 0) {
            setAppliedTimestampSeconds(data.playback.timestampSeconds);
            setIframeKey((k) => k + 1);
          }
        }
      } catch (err) {
        console.error('Error parsing SSE room update:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('Watch party SSE connection status:', err);
      if (eventSource.readyState === EventSource.CLOSED) {
        if (isMounted) {
          setError((prev) => prev || 'This temporary watch party has expired or does not exist.');
          setLoading(false);
        }
        setIsLiveConnected(false);
      }
    };

    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, [roomId, hostToken]);

  // Synchronized Countdown Timer (e.g. 3.. 2.. 1.. Play)
  const [now, setNow] = useState<number>(() => Date.now());
  const countdownEnd = roomData?.playback?.countdownEnd;
  const countdownSeconds =
    countdownEnd && countdownEnd > now
      ? Math.ceil((countdownEnd - now) / 1000)
      : null;

  useEffect(() => {
    if (!countdownEnd || countdownEnd <= Date.now()) return;

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 100);

    return () => clearInterval(timer);
  }, [countdownEnd]);

  // Host browser tab close / leave protection
  useEffect(() => {
    const isHost = Boolean(hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`));
    if (!isHost) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'If you leave, this Watch Party session will end for everyone.';
      return 'If you leave, this Watch Party session will end for everyone.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hostToken, roomId]);

  // Auto-scroll chat when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [roomData?.messages]);

  // Copy invite link with fallback for insecure origins
  const copyInviteLink = async () => {
    if (typeof window === 'undefined') return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy invite link:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSendingMessage) return;

    const text = inputMessage.trim();
    setInputMessage('');
    setIsSendingMessage(true);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
      if (currentToken) {
        headers['x-host-token'] = currentToken;
      }

      await fetch(`/api/party/${roomId}/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          sender: myNickname,
          text,
        }),
      });
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Playback Control Actions
  const handleTogglePause = async () => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || isSyncingPlayback) return;

    setIsSyncingPlayback(true);
    const isCurrentlyPaused = roomData?.playback?.isPaused;
    const action = isCurrentlyPaused ? 'resume' : 'pause';

    try {
      await fetch(`/api/party/${roomId}/playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({
          action,
          timestampSeconds: hostPlaybackSeconds > 0 ? hostPlaybackSeconds : undefined,
        }),
      });
    } catch (err) {
      console.error('Failed to toggle pause/resume:', err);
    } finally {
      setIsSyncingPlayback(false);
    }
  };

  const handleSyncTimestamp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    const timeToSync = (customTimestamp !== null ? customTimestamp : effectiveTimestampValue).trim();
    if (!currentToken || !timeToSync || isSyncingPlayback) return;

    setIsSyncingPlayback(true);
    try {
      let targetSecs = 0;
      const parts = timeToSync.split(':').map(Number);
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        targetSecs = parts[0] * 60 + parts[1];
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        targetSecs = parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (!isNaN(Number(timeToSync)) && timeToSync !== '') {
        targetSecs = Math.max(0, Number(timeToSync));
      }

      await fetch(`/api/party/${roomId}/playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({
          action: 'seek',
          timestamp: timeToSync,
          timestampSeconds: targetSecs > 0 ? targetSecs : undefined,
        }),
      });

      if (targetSecs > 0) {
        setHostPlaybackSeconds(targetSecs);
        setAppliedTimestampSeconds(targetSecs);
        setIframeKey((k) => k + 1);

        try {
          const iframe = document.querySelector('iframe');
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ action: 'seek', time: targetSecs }, '*');
          }
        } catch {}
      }

      setCustomTimestamp(null);
      setHostJustSynced(true);
      setTimeout(() => setHostJustSynced(false), 2000);
    } catch (err) {
      console.error('Failed to sync timestamp:', err);
    } finally {
      setIsSyncingPlayback(false);
    }
  };

  const handleGuestSyncToHost = () => {
    const targetSeconds = roomData?.playback?.timestampSeconds;
    if (typeof targetSeconds === 'number' && targetSeconds >= 0) {
      setAppliedTimestampSeconds(targetSeconds);
      setIframeKey((k) => k + 1);
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 2000);

      try {
        const iframe = document.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ action: 'seek', time: targetSeconds }, '*');
        }
      } catch {}
    }
  };

  const handleHostConfirmEnd = async () => {
    try {
      const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
      if (currentToken) {
        await fetch(`/api/party/${roomId}`, {
          method: 'DELETE',
          headers: { 'x-host-token': currentToken },
        });
      }
    } catch (err) {
      console.error(err);
    }
    sessionStorage.removeItem(`roseflix_party_host_${roomId}`);
    setShowLeaveModal(false);
    router.push('/');
  };

  const handleServerChange = async (newServer: string) => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || !roomData) return;

    try {
      setRoomData((prev) => (prev ? { ...prev, server: newServer } : prev));

      await fetch(`/api/party/${roomId}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({ serverId: newServer }),
      });
    } catch (err) {
      console.error('Failed to change server:', err);
    }
  };

  const handleSubOrDubChange = async (newTrack: 'sub' | 'dub') => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || !roomData) return;

    try {
      setRoomData((prev) =>
        prev ? { ...prev, media: { ...prev.media, subOrDub: newTrack } } : prev
      );
      setIframeKey((k) => k + 1);

      await fetch(`/api/party/${roomId}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({ subOrDub: newTrack }),
      });
    } catch (err) {
      console.error('Failed to change audio track:', err);
    }
  };

  const handleEpisodeChange = async (newEp: number) => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || !roomData || newEp < 1) return;

    try {
      setRoomData((prev) =>
        prev ? { ...prev, media: { ...prev.media, episode: newEp } } : prev
      );
      setIframeKey((k) => k + 1);

      await fetch(`/api/party/${roomId}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({ episode: newEp }),
      });
    } catch (err) {
      console.error('Failed to change episode:', err);
    }
  };

  const handleSeasonChange = async (newSeason: number) => {
    const currentToken = hostToken || sessionStorage.getItem(`roseflix_party_host_${roomId}`);
    if (!currentToken || !roomData || newSeason < 1) return;

    try {
      setRoomData((prev) =>
        prev ? { ...prev, media: { ...prev.media, season: newSeason, episode: 1 } } : prev
      );
      setIframeKey((k) => k + 1);

      await fetch(`/api/party/${roomId}/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-host-token': currentToken,
        },
        body: JSON.stringify({ season: newSeason, episode: 1 }),
      });
    } catch (err) {
      console.error('Failed to change season:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-28 flex flex-col items-center justify-center space-y-3">
        <div
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: SITE_CONFIG.PRIMARY_COLOR, borderTopColor: 'transparent' }}
        />
        <p className="text-sm font-semibold text-slate-300">Connecting to real-time party stream...</p>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen pt-28 max-w-lg mx-auto px-4 text-center">
        <div className="p-8 rounded-2xl bg-[#0e0e13] border border-white/10 space-y-4 shadow-2xl">
          <AlertTriangle className="w-12 h-12 mx-auto" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          <h2 className="text-xl font-bold text-white">Watch Party Not Available</h2>
          <p className="text-sm text-slate-400">
            {error || 'This session has expired or the link is invalid.'}
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg transition-all"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
            }}
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const { media, status, server: activeServer, messages, participantCount, playback } = roomData;
  const isHost = Boolean(hostToken || roomData.isHost);
  const isKDrama =
    media.type === 'kdrama' ||
    (media as any).mediaType === 'kdrama' ||
    roomData.mediaType === 'kdrama';
  const isAnime =
    media.type === 'anime' ||
    (media as any).mediaType === 'anime' ||
    roomData.mediaType === 'anime';
  const isMovie = media.type === 'movie' && !isAnime && !isKDrama;

  const currentSeason = media.season || 1;
  const currentEpisode = media.episode || 1;
  const currentSubOrDub = media.subOrDub || 'sub';

  const soloWatchUrl = isKDrama
    ? `/watch/kdrama/${media.tmdbId}?s=${currentSeason}&e=${currentEpisode}`
    : isAnime
    ? `/watch/anime/${media.tmdbId}?ep=${currentEpisode}&dub=${currentSubOrDub === 'dub' ? 1 : 0}`
    : isMovie
    ? `/watch/movie/${media.tmdbId}`
    : `/watch/tv/${media.tmdbId}?s=${currentSeason}&e=${currentEpisode}`;

  // Determine seek/jump timestamp:
  // For host: uses explicit manual seek timestamp if set, else undefined (host plays live)
  // For guest: uses applied timestamp when guest clicks "Sync to Host" or when host triggers an explicit seek
  const activeTimestampSeconds = isHost
    ? appliedTimestampSeconds
    : (appliedTimestampSeconds ?? (playback?.timestampSeconds && playback.timestampSeconds > 0 ? playback.timestampSeconds : undefined));

  const currentEmbedUrl = isAnime
    ? getAnimeEmbedUrl(
        activeServer,
        media.tmdbId,
        currentSeason,
        currentEpisode,
        currentSubOrDub,
        isMovie,
        undefined,
        activeTimestampSeconds
      )
    : getEmbedUrl(
        activeServer,
        isKDrama ? 'kdrama' : (isMovie ? 'movie' : 'tv'),
        media.tmdbId,
        currentSeason,
        currentEpisode,
        activeTimestampSeconds
      );

  const availableServers = isAnime ? ANIME_SERVERS : VIDEO_SERVERS;
  const isPaused = Boolean(playback?.isPaused);
  const isCountingDown = typeof countdownSeconds === 'number' && countdownSeconds > 0;

  // Live host timestamp: displays real-time seconds for host or synced SSE time for viewers
  const displayHostTime =
    isHost && hostPlaybackSeconds > 0
      ? formatSecondsToTimestamp(hostPlaybackSeconds)
      : (playback?.timestampFormatted || '');

  // Effective timestamp displayed in the sync input:
  // Auto-updates with the video player's live time, unless host explicitly typed a custom override
  const effectiveTimestampValue =
    customTimestamp !== null
      ? customTimestamp
      : (displayHostTime || '');

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Top Session Status Bar */}
      <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-[#0e0e13] border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Room ID Badge */}
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#161622] text-xs font-semibold text-white border"
            style={{ borderColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)` }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Room: {roomId}</span>
          </div>

          {/* SSE Real-Time Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isLiveConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Zap className="w-3 h-3" />
            <span>{isLiveConnected ? 'SSE Live' : 'Connecting...'}</span>
          </div>

          {/* Participant Counter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Users className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <span>
              {participantCount} {participantCount === 1 ? 'viewer' : 'viewers'}
            </span>
          </div>

          {/* Media Type Badge */}
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
            {isKDrama ? (
              <>
                <Flame className="w-3 h-3" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>K-Drama Party</span>
              </>
            ) : isAnime ? (
              <>
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400">Anime Party</span>
              </>
            ) : isMovie ? (
              <>
                <Film className="w-3 h-3 text-rose-400" />
                <span className="text-rose-400">Movie Party</span>
              </>
            ) : (
              <>
                <Tv className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400">TV Party</span>
              </>
            )}
          </span>

          {/* Host or Guest Identity */}
          {isHost ? (
            <span
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-md text-white shadow-sm"
              style={{
                backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                boxShadow: `0 0 10px ${SITE_CONFIG.PRIMARY_COLOR}60`,
              }}
            >
              <Crown className="w-3 h-3 fill-white" />
              Room Host
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
              Host: {roomData.hostName}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#181824] hover:bg-[#222232] text-white border border-white/10 hover:border-[var(--primary-color)] transition-all cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span>Share Link</span>
              </>
            )}
          </button>

          {isHost ? (
            <button
              onClick={() => setShowLeaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              End Session
            </button>
          ) : (
            <Link
              href={soloWatchUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Watch Solo
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Video Player + Live Chat */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Synchronized Video Player */}
        <div className="lg:col-span-3 space-y-3.5">
          {/* Host Sync Control Bar */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-[#12121c] via-[#161624] to-[#12121c] border border-white/10 shadow-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.2)`,
                  border: `1px solid rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
                  color: SITE_CONFIG.PRIMARY_COLOR,
                }}
              >
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  {isHost ? 'Host Sync Controls' : 'Room Synchronization'}
                </span>
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPaused ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                    }`}
                  />
                  {isPaused ? 'Stream Paused by Host' : 'Stream Active'}
                  {displayHostTime && (
                    <span
                      className="text-[11px] font-mono ml-1 px-2 py-0.5 rounded-lg bg-white/10 border border-white/10 font-bold"
                      style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
                    >
                      ⏱️ {displayHostTime}
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Anime Audio & Episode Controls for Host */}
            {isAnime && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Audio Track Switcher */}
                {isHost ? (
                  <div className="flex items-center p-1 rounded-xl bg-[#181824] border border-white/10 shadow-inner">
                    <button
                      onClick={() => handleSubOrDubChange('sub')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentSubOrDub === 'sub'
                          ? 'shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      style={
                        currentSubOrDub === 'sub'
                          ? {
                              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                            }
                          : undefined
                      }
                    >
                      <span>🇯🇵 SUB</span>
                    </button>
                    <button
                      onClick={() => handleSubOrDubChange('dub')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentSubOrDub === 'dub'
                          ? 'shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                      style={
                        currentSubOrDub === 'dub'
                          ? {
                              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                            }
                          : undefined
                      }
                    >
                      <span>🇺🇸 DUB</span>
                    </button>
                  </div>
                ) : (
                  <span
                    className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#181824] border border-white/10"
                    style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
                  >
                    {currentSubOrDub === 'dub' ? '🇺🇸 DUB' : '🇯🇵 SUB'}
                  </span>
                )}

                {/* Season & Episode Switcher for Host */}
                {isHost && (
                  <div className="flex items-center gap-1.5 bg-[#181824] border border-white/10 p-1 rounded-xl text-xs">
                    <span className="text-slate-400 font-semibold px-0.5">S{currentSeason}</span>
                    <button
                      onClick={() => handleSeasonChange(currentSeason - 1)}
                      disabled={currentSeason <= 1}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Previous Season"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleSeasonChange(currentSeason + 1)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                      title="Next Season"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      onClick={() => handleEpisodeChange(currentEpisode - 1)}
                      disabled={currentEpisode <= 1}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Previous Episode"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-white px-1">Ep {currentEpisode}</span>
                    <button
                      onClick={() => handleEpisodeChange(currentEpisode + 1)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                      title="Next Episode"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* K-Drama / TV Series Episode & Season Controls */}
            {(isKDrama || (!isAnime && !isMovie)) && (
              <div className="flex flex-wrap items-center gap-2">
                {isHost ? (
                  <div className="flex items-center gap-1.5 bg-[#181824] border border-white/10 p-1 rounded-xl text-xs">
                    <span className="text-slate-400 font-semibold px-1">S{currentSeason}</span>
                    <button
                      onClick={() => handleEpisodeChange(currentEpisode - 1)}
                      disabled={currentEpisode <= 1}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Previous Episode"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-white px-1">Ep {currentEpisode}</span>
                    <button
                      onClick={() => handleEpisodeChange(currentEpisode + 1)}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                      title="Next Episode"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#181824] text-slate-200 border border-white/10">
                    Season {currentSeason} &bull; Episode {currentEpisode}
                  </span>
                )}
              </div>
            )}

            {/* Host Playback Controls */}
            {isHost ? (
              <div className="flex flex-wrap items-center gap-2">
                {/* Pause / Resume Button */}
                <button
                  onClick={handleTogglePause}
                  disabled={isSyncingPlayback}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                    isPaused
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-emerald-500/30'
                      : 'text-white'
                  }`}
                  style={
                    !isPaused
                      ? {
                          background: `linear-gradient(to right, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                          color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                          boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)`,
                        }
                      : undefined
                  }
                  title={isPaused ? 'Resume with 3-second countdown' : 'Pause for everyone'}
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-white" />
                      <span>Resume Party (3s Countdown)</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>Pause for Everyone</span>
                    </>
                  )}
                </button>

                {/* Timestamp Jump Input & Button */}
                <form onSubmit={handleSyncTimestamp} className="flex items-center gap-1.5">
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setCustomTimestamp(null)}
                      title={customTimestamp !== null ? "Click to resume auto-updating with video player" : "Auto-updating with live video player"}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 p-0 bg-transparent border-0 cursor-pointer"
                    >
                      <Clock
                        className="w-3.5 h-3.5 transition-transform group-hover:scale-110"
                        style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
                      />
                    </button>
                    <input
                      id="party-sync-timestamp-input"
                      name="partySyncTimestamp"
                      type="text"
                      value={effectiveTimestampValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomTimestamp(val);
                      }}
                      onBlur={() => {
                        if (!customTimestamp?.trim()) {
                          setCustomTimestamp(null);
                        }
                      }}
                      placeholder={displayHostTime || "00:00"}
                      className={`w-24 pl-7 pr-2 py-1.5 rounded-xl border text-white text-xs focus:outline-none font-mono transition-all ${
                        customTimestamp !== null
                          ? 'bg-[#202034] border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                          : 'bg-[#1a1a28] border-white/10'
                      }`}
                      style={{ outlineColor: SITE_CONFIG.PRIMARY_COLOR }}
                      title={
                        customTimestamp !== null
                          ? "Custom timestamp entered. Click the clock icon or clear input to resume auto-updating."
                          : "Auto-updating with video player. Type to enter a custom time."
                      }
                      autoComplete="off"
                      aria-label="Synchronize timestamp"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!effectiveTimestampValue.trim() || isSyncingPlayback}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-all cursor-pointer shadow-sm"
                    style={
                      hostJustSynced
                        ? {
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            boxShadow: '0 0 12px rgba(16,185,129,0.5)',
                          }
                        : {
                            backgroundColor: '#222232',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.1)',
                          }
                    }
                    title={
                      customTimestamp !== null
                        ? `Seek everyone to custom timestamp ${effectiveTimestampValue}`
                        : `Synchronize everyone to current player time (${effectiveTimestampValue || '00:00'})`
                    }
                  >
                    {hostJustSynced ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-white" />
                        <span>Synced!</span>
                      </>
                    ) : (
                      <span>Sync Time</span>
                    )}
                  </button>
                </form>
              </div>
            ) : (
              /* Guest Sync Status & Manual Jump Button */
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-400 italic">
                  {isPaused ? 'Waiting for host to resume...' : 'Synchronized with host'}
                </span>
                {playback?.timestampFormatted && (
                  <button
                    onClick={handleGuestSyncToHost}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                    style={{
                      backgroundColor: justSynced ? '#10b981' : SITE_CONFIG.PRIMARY_COLOR,
                      color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                      boxShadow: justSynced ? '0 0 12px rgba(16,185,129,0.5)' : `0 0 12px rgba(${SITE_CONFIG.PRIMARY_RGB},0.4)`,
                    }}
                    title="Reload player to host's current playback timestamp"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${justSynced ? 'animate-spin' : ''}`} />
                    <span>{justSynced ? 'Synced!' : `Sync to ${playback.timestampFormatted}`}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Server Switcher Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl bg-[#111116] border border-white/5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                Stream Server:
              </span>
              <span className="font-bold" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
                {availableServers.find((s) => s.id === activeServer)?.name || activeServer}
              </span>
            </div>

            {isHost ? (
              <div className="flex items-center gap-1.5">
                {availableServers.slice(0, 3).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleServerChange(s.id)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                      activeServer === s.id
                        ? 'shadow-sm'
                        : 'bg-[#1a1a24] text-slate-400 hover:text-white'
                    }`}
                    style={
                      activeServer === s.id
                        ? {
                            backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                            color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                          }
                        : undefined
                    }
                  >
                    {s.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-slate-500 italic">
                Server chosen by host
              </span>
            )}
          </div>

          {/* Memoized Video Player Frame with Synchronized Overlays (0 CLS, Chat Re-render Isolated) */}
          <WatchPartyVideoFrame
            status={status}
            soloWatchUrl={soloWatchUrl}
            isCountingDown={isCountingDown}
            countdownSeconds={countdownSeconds}
            isPaused={isPaused}
            isHost={isHost}
            timestampFormatted={playback?.timestampFormatted}
            isSyncingPlayback={isSyncingPlayback}
            onTogglePause={handleTogglePause}
            customStreamUrl={media.customStreamUrl}
            backdropPath={media.backdropPath}
            iframeKey={iframeKey}
            currentEmbedUrl={currentEmbedUrl}
            title={media.title}
          />

          {/* Media Info Panel */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#0e0e13] border border-white/5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                    color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  }}
                >
                  {isAnime
                    ? `Anime Ep ${currentEpisode} (${currentSubOrDub.toUpperCase()})`
                    : isMovie
                    ? 'Movie'
                    : `S${media.season || 1} E${currentEpisode}`}
                </span>
                <span className="text-xs font-semibold" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>Real-Time Sync</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">{media.title}</h2>
            </div>
            <Link
              href={soloWatchUrl}
              className="text-xs text-slate-400 hover:text-white shrink-0 hover:underline"
            >
              View Full Details &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Instant Live Chat */}
        <div className="lg:col-span-1 flex flex-col h-[560px] rounded-2xl bg-[#0e0e13] border border-white/10 overflow-hidden shadow-2xl">
          {/* Chat Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#12121a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Party Chat</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <label htmlFor="party-user-nickname-input" className="text-[11px] text-slate-400">You:</label>
              <input
                id="party-user-nickname-input"
                name="partyNickname"
                type="text"
                value={myNickname}
                maxLength={18}
                onChange={(e) => {
                  setMyNickname(e.target.value);
                  sessionStorage.setItem('roseflix_party_name', e.target.value);
                }}
                className="w-20 px-1.5 py-0.5 rounded bg-[#1a1a26] text-white text-[11px] font-semibold border border-white/10 focus:outline-none"
                style={{ outlineColor: SITE_CONFIG.PRIMARY_COLOR }}
                title="Click to edit nickname"
                autoComplete="username"
                aria-label="Edit your nickname"
              />
            </div>
          </div>

          {/* Chat Messages Log */}
          <div
            ref={chatContainerRef}
            className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs divide-y divide-white/5"
          >
            {messages.map((msg) => (
              <div key={msg.id} className="pt-2 first:pt-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-bold flex items-center gap-1" style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>
                    {msg.isHost && <Crown className="w-3 h-3 text-amber-400 fill-amber-400" />}
                    {msg.sender}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-slate-200 leading-relaxed break-words">{msg.text}</p>
              </div>
            ))}
          </div>

          {/* Chat Input Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-2.5 border-t border-white/10 bg-[#12121a] flex items-center gap-2"
          >
            <input
              id="party-chat-message-input"
              name="partyChatMessage"
              type="text"
              value={inputMessage}
              disabled={status === 'ended'}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={status === 'ended' ? 'Session ended' : 'Type a message...'}
              className="flex-1 px-3 py-2 rounded-xl bg-[#1a1a26] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none transition-colors"
              style={{ outlineColor: SITE_CONFIG.PRIMARY_COLOR }}
              autoComplete="off"
              aria-label="Party chat message"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || status === 'ended'}
              className="p-2 rounded-xl disabled:opacity-40 transition-all cursor-pointer"
              style={{
                backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
              }}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* Host Leaving Warning Popup Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-[#0e0e13] border border-red-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-white">Leaving will end the session!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                As the <strong style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>creator & host</strong> of this temporary watch party, leaving or ending the session will immediately expire the link and disconnect all friends who are watching with you.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-[#1a1a24] hover:bg-[#252535] text-white border border-white/10 transition-colors cursor-pointer"
              >
                Stay in Watch Party
              </button>
              <button
                onClick={handleHostConfirmEnd}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all cursor-pointer"
              >
                End for Everyone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
