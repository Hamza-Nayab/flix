import React from 'react';

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen bg-[#070709] animate-pulse">
      {/* Hero Banner Shimmer Skeleton */}
      <div className="relative w-full h-[60vh] sm:h-[75vh] min-h-[480px] max-h-[750px] bg-gradient-to-b from-[#121218] via-[#0c0c10] to-[#070709] border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 space-y-4">
          <div className="flex gap-2">
            <div className="w-20 h-5 rounded-md bg-white/10" />
            <div className="w-16 h-5 rounded-md bg-white/10" />
          </div>
          <div className="w-3/4 max-w-lg h-10 sm:h-12 rounded-xl bg-white/10" />
          <div className="w-full max-w-md h-4 rounded bg-white/5" />
          <div className="w-2/3 max-w-sm h-4 rounded bg-white/5" />
          <div className="flex gap-3 pt-2">
            <div className="w-32 h-11 rounded-xl bg-white/15" />
            <div className="w-36 h-11 rounded-xl bg-white/5 border border-white/10" />
          </div>
        </div>
      </div>

      {/* 3 Carousels Shimmer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full -mt-6 sm:-mt-10 space-y-10 relative z-10 pb-16">
        {[1, 2, 3].map((row) => (
          <div key={row} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 rounded-full bg-white/20" />
              <div className="w-48 h-6 rounded-md bg-white/10" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6].map((col) => (
                <div key={col} className="space-y-2">
                  <div className="aspect-[2/3] w-full rounded-xl bg-white/5 border border-white/5" />
                  <div className="w-3/4 h-3.5 rounded bg-white/5" />
                  <div className="w-1/2 h-3 rounded bg-white/5" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

