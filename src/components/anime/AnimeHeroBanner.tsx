'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Play, Users, Star, Sparkles, Film, Tv } from 'lucide-react';
import { JikanAnime } from '@/lib/anime';
import CreatePartyModal from '@/components/party/CreatePartyModal';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface AnimeHeroBannerProps {
  anime: JikanAnime;
}

export default function AnimeHeroBanner({ anime }: AnimeHeroBannerProps) {
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);

  const title = anime.title || anime.name || anime.title_english || 'Featured Anime';
  const romaji = anime.original_name || (anime.title !== title ? anime.title : anime.title_japanese || null);
  const score = anime.score ? anime.score.toFixed(2) : 'N/A';
  const episodes = anime.episodes ? `${anime.episodes} Episodes` : 'Airing Simulcast';

  // Deduplicate genres
  const uniqueGenres = Array.from(
    new Map((anime.genres || []).map((g) => [g.name.toLowerCase().trim(), g])).values()
  );

  // Choose the highest resolution poster or trailer banner with fallback
  const initialBackdrop =
    anime.trailer?.images?.maximum_image_url ||
    anime.trailer?.images?.large_image_url ||
    anime.images.jpg.large_image_url ||
    '/placeholder-backdrop.svg';
  const [bgSrc, setBgSrc] = useState<string>(initialBackdrop);

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
          {/* Gradients for Cyber-Noir look */}
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
                  boxShadow: `0 0 15px ${SITE_CONFIG.PRIMARY_COLOR}99`,
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
                #1 Airing Simulcast
              </span>

              {anime.score && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>MAL Score: {score}</span>
                </div>
              )}

              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-slate-300 text-xs font-medium">
                {episodes}
              </span>
            </div>

            {/* Title */}
            <div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-md">
                {title}
              </h1>
              {romaji && (
                <p
                  className="text-sm sm:text-base font-semibold mt-1 drop-shadow"
                  style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
                >
                  {romaji}
                </p>
              )}
            </div>

            {/* Synopsis */}
            {anime.synopsis && (
              <p className="text-xs sm:text-sm text-slate-300 line-clamp-3 leading-relaxed max-w-xl">
                {anime.synopsis}
              </p>
            )}

            {/* Deduplicated Genres */}
            {uniqueGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {uniqueGenres.slice(0, 4).map((g) => (
                  <span
                    key={g.name}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#161622] text-slate-300 border border-white/5"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            {/* CTAs: Watch Episode 1 & Start Watch Party */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <Link
                href={`/watch/anime/${anime.id || anime.mal_id}?s=1&ep=1`}
                className="group flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
                  color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                  boxShadow: `0 0 25px ${SITE_CONFIG.PRIMARY_COLOR}80`,
                }}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch Episode 1</span>
              </Link>

              <button
                onClick={() => setIsPartyModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-slate-200 hover:text-white bg-[#14141c]/90 hover:bg-[#1f1f2e] border border-white/10 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                style={{
                  borderColor: `${SITE_CONFIG.PRIMARY_COLOR}40`,
                }}
              >
                <Users className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                <span>Start Anime Watch Party</span>
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
          tmdbId: anime.id || anime.mal_id,
          type: 'anime',
          title: `${title} (Episode 1)`,
          backdropPath: bgSrc,
          season: 1,
          episode: 1,
        }}
      />
    </>
  );
}

