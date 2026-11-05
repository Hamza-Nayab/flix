'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Film, Tv, Star, Loader2, Sparkles, Flame } from 'lucide-react';
import { getTMDBImageUrl, formatYear, formatRating } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: number;
  mal_id?: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  media_type: 'movie' | 'tv' | 'anime' | 'kdrama';
}

type FilterType = 'all' | 'movie' | 'tv' | 'anime' | 'kdrama';

function SearchItemPoster({
  posterPath,
  title,
}: {
  posterPath: string | null;
  title: string;
}) {
  const [src, setSrc] = useState(getTMDBImageUrl(posterPath, 'w300'));

  return (
    <Image
      src={src}
      alt={title}
      fill
      sizes="48px"
      unoptimized={Boolean(src && (src.includes('myanimelist.net') || src.startsWith('/placeholder')))}
      onError={() => setSrc('/placeholder-poster.svg')}
      className="object-cover group-hover:scale-105 transition-transform duration-300"
    />
  );
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced unified search with AbortController cancellation to eliminate race conditions
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query.trim())}&type=${filterType}`,
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results?.slice(0, 10) || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Search fetch failed:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, filterType]);

  if (!isOpen) return null;

  const filterOptions: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'movie', label: 'Movies' },
    { id: 'tv', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' },
    { id: 'kdrama', label: 'K-Dramas' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/80 backdrop-blur-md transition-opacity">
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-[#0e0e13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 bg-[#111116]">
          <Search
            className="w-5 h-5 mr-3 shrink-0"
            style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search movies, TV shows, anime & K-dramas on ${SITE_CONFIG.SITE_NAME}...`}
            className="w-full bg-transparent text-white placeholder-slate-400 text-base focus:outline-none"
          />
          {loading && (
            <Loader2
              className="w-4 h-4 animate-spin shrink-0 mr-2"
              style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
            />
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-[#0b0b0e] text-xs overflow-x-auto scrollbar-none">
          {filterOptions.map((opt) => {
            const isActive = filterType === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setFilterType(opt.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                        boxShadow: `0 0 10px ${SITE_CONFIG.PRIMARY_COLOR}60`,
                      }
                    : {}
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-white/5 p-2">
          {query.trim() && results.length === 0 && !loading && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-500 mt-1">Try searching by title, character, or franchise</p>
            </div>
          )}

          {!query.trim() && (
            <div className="py-8 px-4 text-center text-slate-400 text-xs">
              <p className="text-slate-300 font-medium mb-1">Unified Multi-Source Search</p>
              <p className="text-slate-500">
                Search Hollywood movies, global television series, Jikan anime, and Asian dramas. Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-xs">Esc</kbd> anytime to exit.
              </p>
            </div>
          )}

          {results.map((item) => {
            const isAnime = item.media_type === 'anime';
            const isKDrama = item.media_type === 'kdrama';
            const isMovie = item.media_type === 'movie';
            const title = item.title || item.name || 'Untitled';
            const date = item.release_date || item.first_air_date;
            const watchUrl = isKDrama
              ? `/watch/kdrama/${item.id}`
              : isAnime
              ? `/watch/anime/${item.id}`
              : isMovie
              ? `/watch/movie/${item.id}`
              : `/watch/tv/${item.id}`;

            return (
              <Link
                key={`${item.media_type}-${item.id}`}
                href={watchUrl}
                onClick={onClose}
                className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1a1a24] transition-all group"
              >
                {/* Poster Thumbnail */}
                <div className="relative w-12 h-16 rounded-md overflow-hidden bg-[#111116] shrink-0 border border-white/5">
                  <SearchItemPoster posterPath={item.poster_path} title={title} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white group-hover:text-white transition-colors truncate">
                      {title}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 border border-white/10">
                      {isKDrama ? (
                        <>
                          <Flame className="w-2.5 h-2.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
                          <span style={{ color: SITE_CONFIG.PRIMARY_COLOR }}>K-Drama</span>
                        </>
                      ) : isAnime ? (
                        <>
                          <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                          <span className="text-cyan-400">Anime</span>
                        </>
                      ) : isMovie ? (
                        <>
                          <Film className="w-2.5 h-2.5 text-rose-400" />
                          <span className="text-rose-400">Movie</span>
                        </>
                      ) : (
                        <>
                          <Tv className="w-2.5 h-2.5 text-purple-400" />
                          <span className="text-purple-400">TV</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{formatYear(date)}</span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {formatRating(item.vote_average)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Modal Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t border-white/10 bg-[#0b0b0e] flex justify-between items-center text-xs text-slate-400">
            <span>Showing top {results.length} matches</span>
            <Link
              href={`/search?q=${encodeURIComponent(query)}&type=${filterType}`}
              onClick={onClose}
              className="hover:underline font-medium"
              style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
            >
              View all results &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
