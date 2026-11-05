'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

const AD_PASS_STORAGE_KEY = 'roseflix_ad_pass_expiry';
const AD_PASS_UNLOCKED_AT_KEY = 'roseflix_ad_pass_unlocked_at';

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export function isAdPassActive(): boolean {
  if (typeof window === 'undefined') return true;
  if (SITE_CONFIG.AD_PHASE === 'clean') return true;
  try {
    const expiry = localStorage.getItem(AD_PASS_STORAGE_KEY);
    if (!expiry) return false;
    return Date.now() < Number(expiry);
  } catch {
    return false;
  }
}

interface AdGateOverlayProps {
  title?: string;
  backdropUrl?: string | null;
  onUnlock?: () => void;
}

export default function AdGateOverlay({
  title,
  backdropUrl,
  onUnlock,
}: AdGateOverlayProps) {
  // Default to true during SSR to prevent hydration mismatch
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
    const directLink = process.env.NEXT_PUBLIC_DIRECT_LINK_URL?.trim();

    // If ads are disabled, direct link is empty, or AD_PHASE is 'clean', automatically unlock
    if (!adsEnabled || !directLink || SITE_CONFIG.AD_PHASE === 'clean') {
      setIsUnlocked(true);
      return;
    }

    // Check if token exists and is still valid
    const active = isAdPassActive();
    setIsUnlocked(active);
  }, []);

  const handleUnlockAndPlay = () => {
    const directLink = process.env.NEXT_PUBLIC_DIRECT_LINK_URL?.trim();

    // 1. Open direct link in a new tab if configured
    if (
      directLink &&
      (directLink.startsWith('http://') ||
        directLink.startsWith('https://') ||
        directLink.startsWith('//'))
    ) {
      try {
        window.open(directLink, '_blank', 'noopener,noreferrer');
      } catch (err) {
        console.warn('Ad link window open error:', err);
      }
    }

    // 2. Compute expiration duration based on AD_PHASE
    const passDuration =
      SITE_CONFIG.AD_PHASE === 'aggressive' ? THIRTY_MINUTES_MS : TWELVE_HOURS_MS;

    try {
      const now = Date.now();
      const expiryTimestamp = now + passDuration;
      localStorage.setItem(AD_PASS_STORAGE_KEY, String(expiryTimestamp));
      localStorage.setItem(AD_PASS_UNLOCKED_AT_KEY, String(now));
    } catch (err) {
      console.warn('Failed to store ad pass expiry:', err);
    }

    // 3. Immediately unlock overlay
    setIsUnlocked(true);
    if (onUnlock) {
      onUnlock();
    }
  };

  // Don't render until client mounted, or if unlocked, or if AD_PHASE is 'clean'
  if (!mounted || isUnlocked || SITE_CONFIG.AD_PHASE === 'clean') {
    return null;
  }

  const badgeText =
    SITE_CONFIG.AD_PHASE === 'aggressive'
      ? '1-Click 30-Minute Ad-Free Pass'
      : '1-Click 12-Hour Ad-Free Pass';

  const durationDescription =
    SITE_CONFIG.AD_PHASE === 'aggressive' ? '30 minutes' : '12 hours';

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-[#09090b]/90 backdrop-blur-md transition-all duration-300 select-none"
      role="dialog"
      aria-modal="true"
      aria-label="Unlock Player"
    >
      {/* Background Poster (Dimmed) */}
      {backdropUrl && (
        <div className="absolute inset-0 -z-10 overflow-hidden opacity-25">
          <Image
            src={backdropUrl}
            alt={title || 'Player Backdrop'}
            fill
            className="object-cover filter blur-xs brightness-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent" />
        </div>
      )}

      {/* Cyber-Noir Glassmorphic Card */}
      <div className="relative max-w-md w-full mx-auto p-6 sm:p-8 rounded-2xl bg-[#111118]/80 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col items-center text-center space-y-4">
        {/* Glow accent matching tenant brand color */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-20 blur-3xl pointer-events-none opacity-30"
          style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }}
        />

        {/* Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm"
          style={{
            backgroundColor: `${SITE_CONFIG.PRIMARY_COLOR}15`,
            borderColor: `${SITE_CONFIG.PRIMARY_COLOR}40`,
            color: '#fff',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          <span>{badgeText}</span>
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Unlock Instant HD Streaming
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xs mx-auto leading-relaxed">
            Support {SITE_CONFIG.SITE_NAME} with <span className="text-white font-semibold">1 single click</span> to unlock uninterrupted 1080p playback for the next <span className="font-bold text-white">{durationDescription}</span>.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-2 gap-2 w-full pt-1 text-left text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
            <Zap className="w-3 h-3" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
            <span>Zero Popups ({durationDescription})</span>
          </div>
          <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Full 1080p HD Servers</span>
          </div>
        </div>

        {/* CTA Button: Unlock & Play Full HD with Brand Color */}
        <button
          onClick={handleUnlockAndPlay}
          className="w-full mt-2 group relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-black text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
          style={{
            backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
            boxShadow: `0 0 25px ${SITE_CONFIG.PRIMARY_COLOR}66`,
          }}
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Unlock & Play Full HD</span>
        </button>

        <p className="text-[10px] text-slate-500">
          No sign-up or credit card required. Clean token saved locally.
        </p>
      </div>
    </div>
  );
}
