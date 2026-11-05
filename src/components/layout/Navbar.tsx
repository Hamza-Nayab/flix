'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Film, Tv, Sparkles, Flame, Users, Menu, X, PlayCircle } from 'lucide-react';
import SearchModal from '@/components/media/SearchModal';
import CreatePartyModal from '@/components/party/CreatePartyModal';
import { SITE_CONFIG } from '@/lib/siteConfig';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isPartyModalOpen, setIsPartyModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Global keyboard shortcut for search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies', icon: Film },
    { label: 'TV Shows', href: '/tv', icon: Tv },
    { label: 'Anime', href: '/anime', icon: Sparkles },
    { label: 'K-Dramas', href: '/kdramas', icon: Flame },
  ];

  // Dynamic 2-tone split for Site Name
  const siteName = SITE_CONFIG.SITE_NAME;
  const midPoint = Math.ceil(siteName.length / 2);
  const part1 = siteName.slice(0, midPoint);
  const part2 = siteName.slice(midPoint);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0b0b0e]/90 backdrop-blur-xl border-b border-white/10 py-3 shadow-2xl'
            : 'bg-gradient-to-b from-[#070709]/90 to-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" prefetch={true} className="flex items-center gap-2 group">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${SITE_CONFIG.PRIMARY_COLOR}, #09090b)`,
                boxShadow: `0 0 20px ${SITE_CONFIG.PRIMARY_COLOR}66`,
              }}
            >
              <PlayCircle className="w-5 h-5 text-white fill-white/20" />
            </div>
            <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
              {part1}
              <span
                style={{
                  color: SITE_CONFIG.PRIMARY_COLOR,
                  filter: `drop-shadow(0 0 10px ${SITE_CONFIG.PRIMARY_COLOR}99)`,
                }}
              >
                {part2}
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#111116]/80 p-1.5 rounded-full border border-white/5 backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || pathname?.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                          boxShadow: `0 0 15px ${SITE_CONFIG.PRIMARY_COLOR}80`,
                        }
                      : {}
                  }
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Watch Party Pill Button */}
            <button
              onClick={() => setIsPartyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all cursor-pointer ml-1"
              title="Start Watch Party"
            >
              <Users className="w-3.5 h-3.5" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
              <span>Watch Party</span>
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-[#111116] border border-white/10 hover:border-white/30 text-slate-300 hover:text-white transition-all group cursor-pointer"
              title="Search (Cmd+K)"
            >
              <Search
                className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors"
                style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
              />
              <span className="text-xs text-slate-400 hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded border border-white/10">
                ⌘K
              </kbd>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-[#111116] border border-white/10 cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0e0e13] border-b border-white/10 px-4 pt-3 pb-5 space-y-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === '/'
                  ? pathname === '/'
                  : pathname === link.href || pathname?.startsWith(`${link.href}/`);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-slate-300 hover:bg-white/5'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: SITE_CONFIG.PRIMARY_COLOR,
                        }
                      : {}
                  }
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {link.label}
                </Link>
              );
            })}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsPartyModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-white/5"
            >
              <Users className="w-4 h-4" style={{ color: SITE_CONFIG.PRIMARY_COLOR }} />
              <span>Start Watch Party</span>
            </button>
          </div>
        )}
      </header>

      {/* Instant Search Palette Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Watch Party Generic Creator Modal */}
      <CreatePartyModal
        isOpen={isPartyModalOpen}
        onClose={() => setIsPartyModalOpen(false)}
        media={{
          tmdbId: 299534,
          type: 'movie',
          title: 'Watch Party Room',
          backdropPath: null,
        }}
      />
    </>
  );
}
