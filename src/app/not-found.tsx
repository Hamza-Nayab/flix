import React from 'react';
import Link from 'next/link';
import { Film, Home, Search, Compass, Tv } from 'lucide-react';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="max-w-md w-full space-y-6">
        {/* Glowing 404 Badge */}
        <div className="relative inline-flex items-center justify-center">
          <div
            className="w-24 h-24 rounded-3xl border flex items-center justify-center shadow-2xl"
            style={{
              backgroundColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.1)`,
              borderColor: `rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.3)`,
              boxShadow: `0 0 40px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.25)`,
            }}
          >
            <Film
              className="w-12 h-12"
              style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
            />
          </div>
          <span
            className="absolute -top-3 -right-3 text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }}
          >
            404
          </span>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Lost in the Stream?
          </h1>
          <p className="text-sm text-slate-400">
            The title or page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
        </div>

        {/* Quick Search */}
        <form
          action="/search"
          method="GET"
          className="relative flex items-center max-w-sm mx-auto w-full"
        >
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            name="q"
            placeholder="Search movies, anime, tv..."
            className="w-full bg-[#12121a] border border-white/10 rounded-xl pl-10 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow transition-all cursor-pointer"
            style={{ backgroundColor: SITE_CONFIG.PRIMARY_COLOR }}
          >
            Search
          </button>
        </form>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg"
            style={{
              backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
              boxShadow: `0 0 20px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.4)`,
            }}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>

          <Link
            href="/anime"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#13131c] border border-white/10 hover:border-white/20 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Browse Anime</span>
          </Link>

          <Link
            href="/movies"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#13131c] border border-white/10 hover:border-white/20 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Explore Movies</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
