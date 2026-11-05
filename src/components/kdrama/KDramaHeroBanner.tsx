'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Users, Star, Flame } from 'lucide-react';
import { KDramaItem } from '@/lib/kdrama';
import { getTMDBImageUrl, formatRating } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';
import CreatePartyModal from '@/components/party/CreatePartyModal';

interface KDramaHeroBannerProps {
  drama: KDramaItem;
}

export default function KDramaHeroBanner({ drama }: KDramaHeroBannerProps) {
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  const title = drama.name;
  const originalTitle = drama.original_name && drama.original_name !== title ? drama.original_name : null;
  const rating = formatRating(drama.vote_average);
  const backdropUrl = getTMDBImageUrl(drama.backdrop_path || drama.poster_path, 'w1280');
  const [bgSrc, setBgSrc] = useState<string>(backdropUrl);

  return (
    <>
      <div className="relative min-h-[550px] sm:min-h-[620px] w-full flex items-center overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 -z-10">
          <Image
            src={bgSrc}
            alt={title}
            fill
            priority
            unoptimized={Boolean(bgSrc && (bgSrc.includes('myanimelist.net') || bgSrc.startsWith('/placeholder')))}
            onError={() => setBgSrc('/placeholder-backdrop.svg')}
            className="object-cover object-center filter brightness-[0.4] scale-105"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-[#070709]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/80 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full z-10">
          <div className="max-w-2xl space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg"
                style={{
                  backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                  color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  boxShadow: `0 0 15px ${SITE_CONFIG.PRIMARY_COLOR}80`,
                }}
              >
                <Flame className="w-3.5 h-3.5" />
                #1 Trending K-Drama
              </span>

              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>TMDB: {rating}</span>
              </div>

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
                🇰🇷 Korean Audio • 🇺🇸 Eng Sub
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {title}
              </h1>
              {originalTitle && (
                <p
                  className="text-base sm:text-lg font-medium mt-1 drop-shadow"
                  style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
                >
                  {originalTitle}
                </p>
              )}
            </div>

            {/* Synopsis */}
            {drama.overview && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
                {drama.overview}
              </p>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href={`/watch/kdrama/${drama.id}?s=1&ep=1`}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-xl hover:brightness-110 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                  color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  boxShadow: `0 0 25px ${SITE_CONFIG.PRIMARY_COLOR}80`,
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Episode 1 (Eng Sub)</span>
              </Link>

              <button
                onClick={() => setIsPartyModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-[#14141c]/90 hover:bg-[#1f1f2e] border border-white/10 hover:border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                <Users className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span>Start K-Drama Watch Party</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Watch Party Modal */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        media={{
          tmdbId: drama.id,
          type: 'kdrama' as any,
          title: `${title} (Season 1 Episode 1)`,
          backdropPath: drama.backdrop_path,
          season: 1,
          episode: 1,
        }}
      />
    </>
  );
}

