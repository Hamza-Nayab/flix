'use client';

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface CustomHlsPlayerProps {
  streamUrl: string;
  posterUrl?: string;
  onPlaybackChange?: (state: { isPlaying: boolean; currentTime: number }) => void;
  className?: string;
  autoPlay?: boolean;
}

export default function CustomHlsPlayer({
  streamUrl,
  posterUrl,
  onPlaybackChange,
  className = '',
  autoPlay = false,
}: CustomHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Setup HLS / Video playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hlsInstance: Hls | null = null;
    setIsLoading(true);
    setError(null);

    const isM3u8 = streamUrl.toLowerCase().includes('.m3u8');

    if (isM3u8 && Hls.isSupported()) {
      hlsInstance = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90,
      });

      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(video);

      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });

      hlsInstance.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hlsInstance?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hlsInstance?.recoverMediaError();
              break;
            default:
              hlsInstance?.destroy();
              setError('Stream playback error encountered.');
              break;
          }
        }
      });
    } else if (
      video.canPlayType('application/vnd.apple.mpegurl') ||
      streamUrl.toLowerCase().includes('.mp4') ||
      !isM3u8
    ) {
      // Native Safari HLS or direct MP4 stream
      video.src = streamUrl;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) {
          video.play().catch(() => {});
        }
      });
      video.addEventListener('error', () => {
        setIsLoading(false);
        setError('Direct video source error.');
      });
    } else {
      setError('HLS streaming is not supported on this browser.');
    }

    return () => {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [streamUrl, autoPlay]);

  // Video event handlers
  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      onPlaybackChange?.({
        isPlaying: true,
        currentTime: videoRef.current.currentTime,
      });
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      onPlaybackChange?.({
        isPlaying: false,
        currentTime: videoRef.current.currentTime,
      });
    }
  };

  const handleSeeked = () => {
    if (videoRef.current) {
      onPlaybackChange?.({
        isPlaying: !videoRef.current.paused,
        currentTime: videoRef.current.currentTime,
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleDurationChange = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs)) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    hideControlsTimerRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full aspect-video bg-black overflow-hidden group select-none ${className}`}
    >
      <video
        ref={videoRef}
        poster={posterUrl}
        playsInline
        onPlay={handlePlay}
        onPause={handlePause}
        onSeeked={handleSeeked}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => setIsLoading(false)}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          <span className="text-xs font-semibold text-slate-300 mt-2">Buffering HLS Stream...</span>
        </div>
      )}

      {/* Stream Error Notice */}
      {error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
          <p className="text-red-400 font-bold text-sm mb-2">{error}</p>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
            }}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry Stream
          </button>
        </div>
      )}

      {/* Cyber-Noir Controls Overlay */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 p-4 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Bar */}
        <div className="relative w-full flex items-center mb-3">
          <input
            id="hls-video-scrubber"
            name="videoProgress"
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer hover:h-2 transition-all"
            style={{ accentColor: SITE_CONFIG.PRIMARY_COLOR }}
            aria-label="Seek video position"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5 group/volume">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                id="hls-video-volume"
                name="videoVolume"
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: SITE_CONFIG.PRIMARY_COLOR }}
                aria-label="Adjust volume"
              />
            </div>

            {/* Time Stamp */}
            <span className="font-mono text-[11px] text-slate-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{
                backgroundColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.2)`,
                borderColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)`,
                color: SITE_CONFIG.PRIMARY_COLOR,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Direct HLS
            </span>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

