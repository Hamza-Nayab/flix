'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface AdBannerProps {
  zone?: 'player-bottom' | 'in-feed' | 'search-top';
  className?: string;
}

export default function AdBanner({ zone = 'player-bottom', className = '' }: AdBannerProps) {
  const pathname = usePathname();
  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === 'true';

  // Return null if ads are disabled, in clean phase, or currently inside a Watch Party room
  if (!adsEnabled || SITE_CONFIG.AD_PHASE === 'clean' || pathname?.startsWith('/party')) {
    return null;
  }

  // Dimension styling based on zone
  const dimensions =
    zone === 'player-bottom'
      ? 'w-full max-w-[728px] h-[90px]'
      : zone === 'in-feed'
      ? 'w-full max-w-[970px] h-[100px]'
      : 'w-full max-w-[728px] h-[90px]';

  return (
    <div className={`my-6 flex flex-col items-center justify-center ${className}`}>
      <div
        className={`${dimensions} rounded-xl bg-[#111116] flex flex-col items-center justify-center p-2 text-center text-xs text-slate-500 overflow-hidden relative`}
        style={{
          border: `1px solid rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.2)`,
          boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.05)`,
        }}
      >
        <span
          className="text-[10px] uppercase tracking-widest font-semibold mb-1"
          style={{ color: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.7)` }}
        >
          Sponsored Advertisement
        </span>
        <div className="w-full h-full flex items-center justify-center text-slate-600 border border-dashed border-white/5 rounded-lg">
          {/* Ad Network Script injects here in production */}
          <span className="text-xs">Banner Placement ({zone})</span>
        </div>
      </div>
    </div>
  );
}
