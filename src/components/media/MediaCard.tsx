'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Star, Play, Film, Tv, Sparkles, Flame } from 'lucide-react';
import { Movie, TVShow, MediaItem } from '@/types/tmdb';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';

export type UnifiedMediaCardItem = {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  media_type?: 'movie' | 'tv' | 'anime' | 'kdrama';
  origin_country?: string[];
  original_language?: string;
};

interface MediaCardProps {
  item: UnifiedMediaCardItem | MediaItem | Movie | TVShow;
  priority?: boolean;
}

const MediaCard = React.memo(function MediaCard({ item, priority = false }: MediaCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  // Default to compact w342 poster size for 60%+ transfer bandwidth reduction
  const initialPoster = getTMDBImageUrl(item.poster_path, 'w342');
  const [imgSrc, setImgSrc] = useState<string>(initialPoster);

  const isKDrama =
    ('media_type' in item && item.media_type === 'kdrama') ||
    ('origin_country' in item && Array.isArray((item as any).origin_country) && (item as any).origin_country.includes('KR')) ||
    ('original_language' in item && (item as any).original_language === 'ko');

  const isAnime =
    ('media_type' in item && item.media_type === 'anime') ||
    (!isKDrama && Array.isArray((item as any).genre_ids) && (item as any).genre_ids.includes(16) && (((item as any).origin_country?.includes('JP')) || (item as any).original_language === 'ja'));

  const isMovie =
    ('media_type' in item && item.media_type === 'movie') ||
    (!isAnime && !isKDrama && 'title' in item && Boolean(item.title));

  const title =
    ('title' in item && item.title
      ? item.title
      : 'name' in item && item.name
      ? item.name
      : undefined) || 'Untitled';

  const releaseDate =
    'release_date' in item && item.release_date
      ? item.release_date
      : 'first_air_date' in item && item.first_air_date
      ? item.first_air_date
      : undefined;

  const year = formatYear(releaseDate);

  const itemId = item.id || (item as any).mal_id;
  const isAnimeMovie = isAnime && ('anime_media_type' in item ? (item as any).anime_media_type === 'movie' : false);

  const watchUrl = !itemId
    ? '#'
    : isKDrama
    ? `/watch/kdrama/${itemId}`
    : isAnime
    ? `/watch/anime/${itemId}${isAnimeMovie ? '?type=movie' : ''}`
    : isMovie
    ? `/watch/movie/${itemId}`
    : `/watch/tv/${itemId}`;

  const accessibleLabel = `Watch ${title} (${year}) Online Full HD on ${SITE_CONFIG.SITE_NAME}`;

  return (
    <Link
      href={watchUrl}
      prefetch={false}
      title={accessibleLabel}
      aria-label={accessibleLabel}
      className="group/card relative flex flex-col rounded-xl overflow-hidden bg-[#111116] border border-white/5 transition-all duration-300 hover:border-white/20 hover:-translate-y-1 hover:transform-gpu focus:outline-none"
      style={{
        boxShadow: undefined,
      }}
    >
      {/* Poster Image Container (Strict aspect-[2/3] for 0 CLS) */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#16161f]">
        {/* Shimmer Placeholder before load */}
        {!imageLoaded && <div className="absolute inset-0 skeleton-shimmer" />}

        <Image
          src={imgSrc}
          alt={`${title} (${year}) official poster`}
          fill
          priority={priority}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          unoptimized={Boolean(imgSrc && (imgSrc.includes('myanimelist.net') || imgSrc.startsWith('/placeholder')))}
          sizes="(max-width: 640px) 140px, (max-width: 1024px) 175px, 200px"
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImgSrc('/placeholder-poster.svg');
            setImageLoaded(true);
          }}
          className={`object-cover transition-transform duration-300 ease-out group-hover/card:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Top Badges - high-performance solid dark overlay without GPU-taxing backdrop-blur */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-950/90 text-white border border-white/10 shadow-sm">
            {isKDrama ? (
              <>
                <Flame className="w-2.5 h-2.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                K-Drama
              </>
            ) : isAnime ? (
              <>
                <Sparkles className="w-2.5 h-2.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                Anime
              </>
            ) : isMovie ? (
              <>
                <Film className="w-2.5 h-2.5" />
                Movie
              </>
            ) : (
              <>
                <Tv className="w-2.5 h-2.5" />
                TV
              </>
            )}
          </span>
          <span
            className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-sm"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
            }}
          >
            HD
          </span>
        </div>

        {/* Hover Vignette & Quick Play Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-black/30 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-xl transform scale-90 group-hover/card:scale-100 transition-all duration-300"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
              boxShadow: `0 0 20px ${SITE_CONFIG.PRIMARY_COLOR}99`,
            }}
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3 flex flex-col justify-between flex-1 bg-[#0e0e13]">
        <h3 className="font-semibold text-sm text-white line-clamp-1 transition-colors">
          {title}
        </h3>

        <div className="flex items-center justify-between mt-1.5 text-xs text-slate-400">
          <span>{year}</span>
          <div className="flex items-center gap-1 text-amber-400 font-medium">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span>{formatRating(item.vote_average)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
});

export default MediaCard;
