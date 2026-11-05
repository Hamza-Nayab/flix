'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Play, Clock, Star, Tv } from 'lucide-react';
import { SeasonSummary, Episode, SeasonDetails } from '@/types/tmdb';
import { getTMDBImageUrl, formatRuntime, formatRating } from '@/lib/utils';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface EpisodeSelectorProps {
  tvId: number | string;
  seasons: SeasonSummary[];
  currentSeason: number;
  currentEpisode: number;
  onSelect: (season: number, episode: number) => void;
}

export default function EpisodeSelector({
  tvId,
  seasons,
  currentSeason,
  currentEpisode,
  onSelect,
}: EpisodeSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filter out season 0 (specials) if desired, or keep
  const validSeasons = seasons.filter((s) => s.season_number > 0);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState(currentSeason);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  useEffect(() => {
    setSelectedSeasonNumber(currentSeason);
  }, [currentSeason]);

  // Fetch season episodes client-side when switching seasons
  useEffect(() => {
    async function loadEpisodes() {
      setLoadingEpisodes(true);
      try {
        const res = await fetch(`/api/tv/${tvId}/season/${selectedSeasonNumber}`);
        if (res.ok) {
          const data: SeasonDetails = await res.json();
          setEpisodes(data.episodes || []);
        }
      } catch (err) {
        console.error('Failed to fetch season episodes:', err);
      } finally {
        setLoadingEpisodes(false);
      }
    }

    loadEpisodes();
  }, [tvId, selectedSeasonNumber]);

  const handleEpisodeClick = (epNum: number) => {
    onSelect(selectedSeasonNumber, epNum);
    // Update URL query params without full reload
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('s', selectedSeasonNumber.toString());
    params.set('e', epNum.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mt-8 bg-[#0b0b0e] border border-white/5 rounded-2xl p-4 sm:p-6">
      {/* Header with Season Selector Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Tv className="w-5 h-5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
          <h3 className="text-lg font-bold text-white">Episodes & Seasons</h3>
        </div>

        {/* Custom Season Dropdown */}
        <div className="relative inline-block">
          <select
            id="season-selector-dropdown"
            name="seasonSelect"
            aria-label="Select Season"
            value={selectedSeasonNumber}
            onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
            className="appearance-none bg-[#161620] text-white text-sm font-semibold py-2.5 pl-4 pr-10 rounded-xl border border-white/10 focus:outline-none transition-colors cursor-pointer"
            style={{ outlineColor: SITE_CONFIG.PRIMARY_COLOR }}
          >
            {validSeasons.map((s) => (
              <option key={s.id} value={s.season_number} className="bg-[#111116] text-white">
                {s.name || `Season ${s.season_number}`} ({s.episode_count} Episodes)
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Episode Cards Grid */}
      <div className="mt-5">
        {loadingEpisodes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-28 rounded-xl skeleton-shimmer" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
            {episodes.map((ep) => {
              const isCurrent =
                selectedSeasonNumber === currentSeason && ep.episode_number === currentEpisode;

              return (
                <button
                  key={ep.id}
                  onClick={() => handleEpisodeClick(ep.episode_number)}
                  className={`flex gap-3 p-2.5 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-[#1a1a24] border-2 shadow-lg'
                      : 'bg-[#111116] border border-white/5 hover:border-white/20 hover:bg-[#161620]'
                  }`}
                  style={
                    isCurrent
                      ? {
                          borderColor: SITE_CONFIG.PRIMARY_COLOR,
                          boxShadow: `0 0 15px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)`,
                        }
                      : undefined
                  }
                >
                  {/* Episode Still Thumbnail */}
                  <div className="relative w-28 h-18 rounded-lg overflow-hidden shrink-0 bg-[#161620]">
                    <Image
                      src={getTMDBImageUrl(ep.still_path, 'w300')}
                      alt={ep.name}
                      fill
                      sizes="120px"
                      className="object-cover"
                    />
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={
                        isCurrent
                          ? { backgroundColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)` }
                          : undefined
                      }
                    >
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={
                          isCurrent
                            ? {
                                backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                                color: SITE_CONFIG.PRIMARY_CONTRAST_TEXT,
                                boxShadow: `0 0 10px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
                              }
                            : { backgroundColor: 'rgba(0, 0, 0, 0.6)', color: '#ffffff' }
                        }
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5" style={{ fill: isCurrent ? SITE_CONFIG.PRIMARY_CONTRAST_TEXT : '#ffffff' }} />
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div
                        className="flex items-center justify-between gap-1 text-[11px] font-bold"
                        style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
                      >
                        <span>EPISODE {ep.episode_number}</span>
                        {ep.runtime && (
                          <span className="flex items-center gap-1 text-slate-400 font-normal">
                            <Clock className="w-2.5 h-2.5" />
                            {formatRuntime(ep.runtime)}
                          </span>
                        )}
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate mt-0.5">
                        {ep.name || `Episode ${ep.episode_number}`}
                      </h4>
                    </div>

                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-1">
                      {ep.overview || 'No description available for this episode.'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
