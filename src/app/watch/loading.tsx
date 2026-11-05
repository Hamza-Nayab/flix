import React from 'react';

export default function WatchLoading() {
  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse space-y-6">
      {/* Breadcrumb skeleton */}
      <div className="flex items-center gap-2">
        <div className="w-16 h-4 rounded bg-white/10" />
        <span className="text-white/20">/</span>
        <div className="w-24 h-4 rounded bg-white/10" />
        <span className="text-white/20">/</span>
        <div className="w-36 h-4 rounded bg-white/10" />
      </div>

      {/* 16:9 Player Skeleton */}
      <div className="relative aspect-video w-full rounded-2xl bg-[#0e0e13] border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center" />
      </div>

      {/* Server & Action Bar Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#111116] border border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-24 h-8 rounded-lg bg-white/10" />
          <div className="w-20 h-8 rounded-lg bg-white/5" />
          <div className="w-20 h-8 rounded-lg bg-white/5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-8 rounded-lg bg-white/10" />
          <div className="w-32 h-8 rounded-lg bg-white/10" />
        </div>
      </div>

      {/* Media Details Skeleton */}
      <div className="p-6 sm:p-8 rounded-2xl bg-[#0e0e13] border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="w-36 sm:w-44 aspect-[2/3] rounded-xl bg-white/10 shrink-0" />
          <div className="flex-1 space-y-3">
            <div className="w-2/3 h-8 rounded-lg bg-white/15" />
            <div className="flex gap-3">
              <div className="w-16 h-5 rounded bg-white/10" />
              <div className="w-20 h-5 rounded bg-white/10" />
              <div className="w-24 h-5 rounded bg-white/10" />
            </div>
            <div className="w-full h-4 rounded bg-white/5 mt-4" />
            <div className="w-5/6 h-4 rounded bg-white/5" />
            <div className="w-3/4 h-4 rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

