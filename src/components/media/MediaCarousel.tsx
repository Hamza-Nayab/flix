'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from '@/components/media/MediaCard';
import { SITE_CONFIG } from '@/lib/siteConfig';

interface MediaCarouselProps {
  title: string;
  items: any[];
  viewAllHref?: string;
  icon?: React.ReactNode;
}

const MediaCarousel = React.memo(function MediaCarousel({
  title,
  items,
  viewAllHref,
  icon,
}: MediaCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollBounds = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const atLeft = scrollLeft <= 10;
      const atRight = scrollLeft + clientWidth >= scrollWidth - 10;

      setCanScrollLeft(!atLeft);
      setCanScrollRight(!atRight);
    }
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScrollBounds();

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkScrollBounds();
          ticking = false;
        });
        ticking = true;
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [checkScrollBounds, items]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative my-8 sm:my-12 content-visibility-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-6 rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${SITE_CONFIG.PRIMARY_COLOR}, ${SITE_CONFIG.PRIMARY_GRADIENT_TO})`,
              boxShadow: `0 0 10px rgba(${SITE_CONFIG.PRIMARY_RGB}, 0.6)`,
            }}
          />
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            {title}
            {icon}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs sm:text-sm font-semibold transition-colors hover:opacity-80"
            style={{ color: SITE_CONFIG.PRIMARY_COLOR }}
          >
            Explore All &rarr;
          </Link>
        )}
      </div>

      {/* Rail Wrapper - isolated group/carousel */}
      <div className="relative px-4 sm:px-6 lg:px-8 group/carousel">
        {/* Left Arrow */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/90 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:bg-[var(--primary-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-contrast-text)] hover:scale-110 cursor-pointer ${
            canScrollLeft ? 'opacity-0 group-hover/carousel:opacity-100' : 'hidden'
          }`}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Scrollable Container with will-change containment */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2"
        >
          {items.map((item, idx) => (
            <div
              key={`${item.id}-${idx}`}
              className="shrink-0 w-[140px] sm:w-[175px] md:w-[200px] snap-start"
            >
              <MediaCard item={item} priority={false} />
            </div>
          ))}
        </div>

        {/* Right Arrow */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/90 border border-white/10 text-white flex items-center justify-center shadow-2xl transition-all duration-300 hover:bg-[var(--primary-color)] hover:border-[var(--primary-color)] hover:text-[var(--primary-contrast-text)] hover:scale-110 cursor-pointer ${
            canScrollRight ? 'opacity-0 group-hover/carousel:opacity-100' : 'hidden'
          }`}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
});

export default MediaCarousel;
