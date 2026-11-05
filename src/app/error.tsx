'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected runtime error to console
    console.error('[Application Runtime Error]:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-6">
        {/* Glowing Warning Icon */}
        <div
          className="w-20 h-20 mx-auto rounded-3xl border flex items-center justify-center shadow-2xl"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderColor: 'rgba(239, 68, 68, 0.3)',
            boxShadow: '0 0 35px rgba(239, 68, 68, 0.2)',
          }}
        >
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Something Went Wrong
          </h1>
          <p className="text-sm text-slate-400">
            An unexpected error occurred while rendering this view. Your session and bookmarks remain safe.
          </p>
          {error.digest && (
            <p className="text-[10px] font-mono text-slate-500">
              Error Digest: {error.digest}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg cursor-pointer"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              boxShadow: `0 0 20px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
            }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#13131c] border border-white/10 hover:border-white/20 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-[#13131c] border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

