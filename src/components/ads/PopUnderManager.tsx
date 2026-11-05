'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { isAdPassActive } from '@/components/ads/AdGateOverlay';
import { SITE_CONFIG } from '@/lib/siteConfig';

const TEN_MINUTES_MS = 10 * 60 * 1000;

/**
 * Triggers a secondary frequency-capped ad on high-intent user actions (switching servers, switching episodes)
 * when in 'hybrid' or 'aggressive' monetization phase.
 */
export function triggerHybridActionAd(): boolean {
  if (typeof window === 'undefined') return false;

  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
  const directLink = process.env.NEXT_PUBLIC_DIRECT_LINK_URL?.trim();

  // Return early if ads disabled, clean phase, or on watch party
  if (
    !adsEnabled ||
    SITE_CONFIG.AD_PHASE === 'clean' ||
    !directLink ||
    window.location.pathname.startsWith('/party')
  ) {
    return false;
  }

  try {
    const now = Date.now();

    // 1. In 'hybrid' mode: Check that initial gate was unlocked at least 10 minutes ago
    if (SITE_CONFIG.AD_PHASE === 'hybrid') {
      const unlockedAt = localStorage.getItem('roseflix_ad_pass_unlocked_at');
      if (unlockedAt) {
        const timeSinceUnlocked = now - Number(unlockedAt);
        if (timeSinceUnlocked < TEN_MINUTES_MS) {
          // User unlocked gate recently; prevent immediate double-hit
          return false;
        }
      }
    }

    // 2. Cooldown calculation
    const cooldownMs =
      SITE_CONFIG.AD_PHASE === 'aggressive'
        ? TEN_MINUTES_MS
        : SITE_CONFIG.POPUNDER_COOLDOWN_MINUTES * 60 * 1000;

    const lastActionAd = localStorage.getItem('roseflix_last_action_ad');
    if (lastActionAd && now - Number(lastActionAd) < cooldownMs) {
      // Cooldown has not expired yet
      return false;
    }

    // 3. Fire action ad in new tab
    if (
      directLink.startsWith('http://') ||
      directLink.startsWith('https://') ||
      directLink.startsWith('//')
    ) {
      try {
        window.open(directLink, '_blank', 'noopener,noreferrer');
      } catch {
        // Silently ignore browser popup blocker rejections
      }
      localStorage.setItem('roseflix_last_action_ad', String(now));
      return true;
    }
  } catch {
    // Silently isolate any storage or runtime issues
  }

  return false;
}

export default function PopUnderManager() {
  const pathname = usePathname();
  const [adFree, setAdFree] = useState(false);

  useEffect(() => {
    setAdFree(isAdPassActive());
  }, [pathname]);

  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';
  const rawUrl = process.env.NEXT_PUBLIC_POPUNDER_SCRIPT_URL?.trim();

  // Guard 1: Must be explicitly enabled
  // Guard 2: Must be non-empty and start with http://, https://, or //
  // Guard 3: Only load if AD_PHASE is NOT 'clean'
  // Guard 4: Never inject or trigger on Watch Party rooms (/party/*)
  // Guard 5: Never inject if user has an active ad pass
  if (
    !adsEnabled ||
    SITE_CONFIG.AD_PHASE === 'clean' ||
    !rawUrl ||
    (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://') && !rawUrl.startsWith('//')) ||
    pathname?.startsWith('/party') ||
    adFree
  ) {
    return null;
  }

  return (
    <Script
      id="roseflix-popunder"
      src={rawUrl}
      strategy="lazyOnload"
      onError={() => {
        // Silently swallow ad network script resolution failures (e.g. adsco.re ERR_NAME_NOT_RESOLVED)
        // or client ad-blocker drops without breaking application execution.
      }}
    />
  );
}
