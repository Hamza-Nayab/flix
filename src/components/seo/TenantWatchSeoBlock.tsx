import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  HelpCircle,
  Tv,
  Film,
  Calendar,
  Building,
  Clock,
  Layers,
  ChevronDown,
  PlayCircle,
  Globe,
  Radio,
} from 'lucide-react';
import {
  TenantId,
  detectTenantId,
  getTenantProfile,
  SITE_CONFIG,
} from '@/lib/siteConfig';
import { generateTenantSeoFaqs, SeoFaqItem } from '@/lib/seo';

export interface TenantWatchSeoBlockProps {
  tenantId?: TenantId;
  requestHost?: string | null;
  mediaType: 'anime' | 'kdrama' | 'movie' | 'tv';
  id: string | number;
  title: string;
  originalTitle?: string | null;
  romajiTitle?: string | null;
  season?: number;
  episode?: number;
  absoluteEpisode?: number;
  year?: string | number;
  runtimeMinutes?: number;
  director?: string | null;
  cast?: string[] | null;
  studio?: string | null;
  network?: string | null;
  genres?: string[] | null;
  overview?: string | null;
  rating?: number;
  ratingCount?: number;
  totalEpisodes?: number | null;
  totalSeasons?: number | null;
  status?: string | null;
  faqs?: SeoFaqItem[];
}

export default function TenantWatchSeoBlock(props: TenantWatchSeoBlockProps) {
  const tenant = props.tenantId || detectTenantId(props.requestHost);
  const profile = getTenantProfile(tenant);
  const siteName = profile.siteName;
  const primaryColor = profile.primaryColor;

  const isMovie = props.mediaType === 'movie';
  const s = props.season || 1;
  const ep = props.episode || 1;
  const absEp = props.absoluteEpisode || ep;
  const totalEps = props.totalEpisodes || 12;

  const faqs =
    props.faqs ||
    generateTenantSeoFaqs({
      id: props.id,
      mediaType: props.mediaType,
      title: props.title,
      romajiTitle: props.romajiTitle,
      japaneseTitle: props.originalTitle,
      season: s,
      episode: ep,
      absoluteEpisode: absEp,
      year: props.year,
      overview: props.overview,
      director: props.director,
      cast: props.cast,
      studio: props.studio,
      network: props.network,
      genres: props.genres,
      tenantId: tenant,
      requestHost: props.requestHost,
    });

  // Calculate clean crawlable sibling episode links
  const prevEp = ep > 1 ? ep - 1 : null;
  const nextEp = totalEps && ep < totalEps ? ep + 1 : ep + 1;

  const episodeUrlFor = (targetEp: number) => {
    if (props.mediaType === 'anime') {
      return `/watch/anime/${props.id}?s=${s}&ep=${targetEp}`;
    }
    if (props.mediaType === 'kdrama') {
      return `/watch/kdrama/${props.id}?s=${s}&ep=${targetEp}`;
    }
    if (props.mediaType === 'tv') {
      return `/watch/tv/${props.id}?s=${s}&e=${targetEp}`;
    }
    return `/watch/movie/${props.id}`;
  };

  return (
    <section
      aria-label={`${props.title} Streaming Guide & Production Specifications`}
      className="mt-10 space-y-8"
      data-tenant={tenant}
    >
      {/* 1. Tenant-Specific SSR Technical Specs & Production Block */}
      <article className="rounded-2xl bg-[#0e0e14] border border-white/5 p-6 sm:p-8 shadow-2xl">
        {tenant === 'anirose' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                AniRose Anime Archive & Simulcast Specs
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4">
              {props.title} {isMovie ? '— Official Movie Production Info' : `— Season ${s} Episode ${absEp} Specifications`}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-4 border-y border-white/5 text-xs">
              <div>
                <span className="text-slate-500 block">Romaji Title</span>
                <strong className="text-white font-medium text-sm">
                  {props.romajiTitle || props.originalTitle || props.title}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Animation Studio</span>
                <strong className="text-white font-medium text-sm">
                  {props.studio || 'Industry Leading Studio'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Airing Season & Year</span>
                <strong className="text-white font-medium text-sm">
                  {props.year ? `${props.year} Simulcast` : 'Official Broadcast'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Audio & Dubbing</span>
                <strong className="text-white font-medium text-sm">
                  Japanese 2.0 / English Dub
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Subtitles</span>
                <strong className="text-white font-medium text-sm">
                  Full English Subtitles & Signs
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Episode Index</span>
                <strong className="text-white font-medium text-sm">
                  Episode {absEp} {totalEps ? `of ${totalEps}` : ''}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Video Quality</span>
                <strong className="text-white font-medium text-sm">
                  1080p FHD (Multi-Server)
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Canon Storyline</span>
                <strong className="text-white font-medium text-sm">
                  Official Studio Adaptation
                </strong>
              </div>
            </div>

            {/* Differentiated Anime Prose Overview */}
            <div className="mt-5 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                Experience <strong>{props.title}</strong>{' '}
                {props.romajiTitle ? `(${props.romajiTitle})` : ''} on <strong>{siteName}</strong>{' '}
                with zero buffering and high-definition video streams. Animated by{' '}
                <strong>{props.studio || 'top-tier Japanese creators'}</strong>, this{' '}
                {isMovie ? 'feature anime film' : `simulcast installment in Season ${s}`}{' '}
                delivers immersive Japanese audio alongside crisp, synchronized English subtitles.
              </p>
              {props.overview && (
                <p className="text-slate-400 text-xs sm:text-sm">
                  {props.overview}
                </p>
              )}
            </div>
          </div>
        )}

        {tenant === 'dramapulse' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                DramaPulse Asian Drama Broadcast Registry
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4">
              {props.title} — Episode {ep} Broadcast Details & Cast Guide
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-4 border-y border-white/5 text-xs">
              <div>
                <span className="text-slate-500 block">Original Network</span>
                <strong className="text-white font-medium text-sm">
                  {props.network || 'tvN / JTBC / SBS / Netflix'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Aired Year</span>
                <strong className="text-white font-medium text-sm">
                  {props.year || 'Current Season'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Original Language</span>
                <strong className="text-white font-medium text-sm">
                  Korean (Original Soundtrack)
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Subtitle Availability</span>
                <strong className="text-white font-medium text-sm">
                  Complete English Subtitles
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Total Series Episodes</span>
                <strong className="text-white font-medium text-sm">
                  {totalEps ? `${totalEps} Episodes` : 'Full Series'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Lead Cast Roles</span>
                <strong className="text-white font-medium text-sm truncate">
                  {props.cast && props.cast.length > 0 ? props.cast.slice(0, 2).join(', ') : 'All-Star Ensemble'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Streaming Resolution</span>
                <strong className="text-white font-medium text-sm">
                  1080p Ultra HD Fast CDN
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Drama Status</span>
                <strong className="text-white font-medium text-sm">
                  {props.status || 'Verified Completed/Airing'}
                </strong>
              </div>
            </div>

            {/* Differentiated K-Drama Prose Overview */}
            <div className="mt-5 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                Follow the captivating narrative of <strong>{props.title}</strong>{' '}
                Episode {ep} on <strong>{siteName}</strong>. Originally broadcast across{' '}
                <strong>{props.network || 'leading Korean television networks'}</strong>,{' '}
                this production showcases stellar performances by{' '}
                <strong>{props.cast && props.cast.length > 0 ? props.cast.slice(0, 3).join(', ') : 'acclaimed drama stars'}</strong>.
              </p>
              {props.overview && (
                <p className="text-slate-400 text-xs sm:text-sm">
                  {props.overview}
                </p>
              )}
            </div>
          </div>
        )}

        {tenant === 'roseflix' && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                RoseFlix Cinema Archive & Feature Specs
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-4">
              {props.title} ({props.year || 'HD'}) — Cinematic Details & Production Credits
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 py-4 border-y border-white/5 text-xs">
              <div>
                <span className="text-slate-500 block">Theatrical Release</span>
                <strong className="text-white font-medium text-sm">
                  {props.year ? `${props.year} Worldwide` : 'Official Release'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Runtime</span>
                <strong className="text-white font-medium text-sm">
                  {props.runtimeMinutes ? `${props.runtimeMinutes} min` : isMovie ? '110 min' : '45 min/ep'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Director</span>
                <strong className="text-white font-medium text-sm">
                  {props.director || 'Visionary Filmmakers'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Leading Ensemble</span>
                <strong className="text-white font-medium text-sm truncate">
                  {props.cast && props.cast.length > 0 ? props.cast.slice(0, 2).join(', ') : 'Hollywood Cast'}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Format & Audio</span>
                <strong className="text-white font-medium text-sm">
                  1080p FHD • Dolby 5.1 Stereo
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Subtitles</span>
                <strong className="text-white font-medium text-sm">
                  English SDH & Multi-Language
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Platform Redundancy</span>
                <strong className="text-white font-medium text-sm">
                  6 Cloud Playback Mirrors
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Stream Access</span>
                <strong className="text-white font-medium text-sm">
                  Zero Membership Required
                </strong>
              </div>
            </div>

            {/* Differentiated RoseFlix Prose Overview */}
            <div className="mt-5 space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                Stream <strong>{props.title}</strong>{' '}
                {props.year ? `(${props.year})` : ''} in full 1080p high definition on{' '}
                <strong>{siteName}</strong>. With multi-server cloud acceleration, you can enjoy{' '}
                {isMovie ? 'the full length feature presentation' : `Season ${s} Episode ${ep}`}{' '}
                with zero buffering, crystal-clear audio, and accurate subtitle synchronization.
              </p>
              {props.overview && (
                <p className="text-slate-400 text-xs sm:text-sm">
                  {props.overview}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Real Crawlable Sibling Links Spiderweb */}
        {!isMovie && (
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <PlayCircle className="w-3.5 h-3.5" style={{ color: primaryColor }} />
              Sequential Episode Navigation:
            </span>
            <div className="flex items-center gap-2">
              {prevEp && (
                <Link
                  href={episodeUrlFor(prevEp)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                >
                  ← Previous Episode {prevEp}
                </Link>
              )}
              <span className="px-3 py-1.5 rounded-lg bg-white/10 text-white font-semibold">
                Current: Ep {ep}
              </span>
              <Link
                href={episodeUrlFor(nextEp)}
                className="px-3 py-1.5 rounded-lg text-white font-semibold transition-all shadow"
                style={{ backgroundColor: primaryColor, color: profile.primaryContrastText }}
              >
                Next Episode {nextEp} →
              </Link>
            </div>
          </div>
        )}
      </article>

      {/* 2. Dynamic Per-Tenant SEO FAQ Accordion (Rendered Server-Side for Google/Bing Crawlers) */}
      <article className="rounded-2xl bg-[#0e0e14] border border-white/5 p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-4 h-4" style={{ color: primaryColor }} />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Frequently Asked Questions
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-5">
          Everything You Need to Know About Streaming {props.title}
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={index}
              open={index === 0}
              className="group border border-white/5 bg-[#12121a] rounded-xl overflow-hidden transition-all duration-200"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer text-xs sm:text-sm font-semibold text-white select-none hover:bg-white/5 transition-colors">
                <span>{faq.question}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 bg-[#0b0b10]">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>
      </article>
    </section>
  );
}
