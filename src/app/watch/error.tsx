'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { PlayCircle, RefreshCw, Home, Search, AlertCircle } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function WatchError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Watch Page Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="max-w-md w-full space-y-6">
        {/* Glow Player Icon */}
        <div
          className="w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center shadow-2xl"
          style={{
            backgroundColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.1)`,
            borderColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)`,
            boxShadow: `0 0 35px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.25)`,
          }}
        >
          <PlayCircle
            className="w-10 h-10"
            style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
          />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Stream Unavailable or Failed to Load
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            We were unable to load metadata or connect to video mirrors for this title. Upstream indexers might be temporarily updating.
          </p>
        </div>

        {/* Troubleshooting Tip */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2 text-left">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <span>
            If you entered an episode number manually, try reloading or searching for the title in the catalog to use verified season & episode indexes.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              boxShadow: `0 0 20px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Playback</span>
          </button>

          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#13131c] border border-white/10 hover:border-white/20 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Catalog</span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#13131c] border border-white/10 hover:border-white/20 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
