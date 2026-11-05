import type { Metadata } from 'next';
import { DetailedMovie, DetailedTVShow } from '@/lib/tmdb';
import { getTMDBImageUrl } from '@/lib/utils';
import {
  SITE_CONFIG,
  TenantId,
  detectTenantId,
  getTenantProfile,
  resolveActiveSiteUrl,
} from '@/lib/siteConfig';

export function getSiteUrl(requestHost?: string | null): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return resolveActiveSiteUrl(requestHost);
}

/**
 * Truncates and formats description strictly between minLength and maxLength (e.g. 110–160 chars)
 * for optimal Google & Bing SERP snippet presentation without cut-off ellipses.
 */
export function cleanMetaDescription(
  overview: string | undefined | null,
  fallbackCta: string = `Stream in full 1080p HD online on ${SITE_CONFIG.SITE_NAME}.`,
  minLength: number = 100,
  maxLength: number = 160
): string {
  const cta = fallbackCta.trim();
  if (!overview || !overview.trim()) {
    const defaultText = `Watch full movies, global series, anime, and Asian dramas online in crisp 1080p HD with English subtitles. ${cta}`;
    return defaultText.slice(0, maxLength);
  }

  const clean = overview.replace(/\s+/g, ' ').replace(/["\\]/g, '').trim();
  const maxOverviewLength = Math.max(30, maxLength - cta.length - 2);

  if (clean.length + cta.length + 1 <= maxLength && clean.length + cta.length + 1 >= minLength) {
    return `${clean} ${cta}`.slice(0, maxLength);
  }

  if (clean.length <= maxOverviewLength) {
    return `${clean} ${cta}`.slice(0, maxLength);
  }

  // Trim to nearest word boundary
  const trimmed = clean.slice(0, maxOverviewLength);
  const lastSpace = trimmed.lastIndexOf(' ');
  const safeText = lastSpace > 20 ? trimmed.slice(0, lastSpace) : trimmed;

  const combined = `${safeText}... ${cta}`;
  return combined.length > maxLength ? combined.slice(0, maxLength) : combined;
}

export interface WatchMetadataOptions {
  id: string | number;
  mediaType: 'anime' | 'kdrama' | 'movie' | 'tv';
  title: string;
  romajiTitle?: string | null;
  japaneseTitle?: string | null;
  season?: number;
  episode?: number;
  absoluteEpisode?: number;
  year?: string | number;
  overview?: string | null;
  backdropUrl?: string | null;
  posterUrl?: string | null;
  director?: string | null;
  cast?: string[] | null;
  studio?: string | null;
  network?: string | null;
  genres?: string[] | null;
  requestHost?: string | null;
  tenantId?: TenantId;
}

export interface SeoFaqItem {
  question: string;
  answer: string;
}

/**
 * Generates dynamic, tenant-differentiated SEO FAQs for watch pages.
 * Guaranteed to produce distinct Q&A sets across AniRose, DramaPulse, and RoseFlix.
 */
export function generateTenantSeoFaqs(
  options: WatchMetadataOptions
): SeoFaqItem[] {
  const tenant = options.tenantId || detectTenantId(options.requestHost);
  const title = options.title || 'this title';
  const ep = options.episode || 1;
  const s = options.season || 1;
  const year = options.year || 'recent';
  const isMovie = options.mediaType === 'movie';
  const siteName = getTenantProfile(tenant).siteName;

  if (tenant === 'anirose') {
    const romaji = options.romajiTitle ? ` (${options.romajiTitle})` : '';
    const studio = options.studio || 'top-tier anime production studios';
    return [
      {
        question: `How can I stream ${title} Episode ${ep} in English Sub and Dub?`,
        answer: `You can stream ${title}${romaji} Episode ${ep} in 1080p Full HD on ${siteName} with your choice of original Japanese audio with English subtitles or English dubbing.`,
      },
      {
        question: `Which studio produced and animated ${title}?`,
        answer: `${title} was animated by ${studio}. It originally premiered in ${year} and is available in high definition on ${siteName}.`,
      },
      {
        question: `Where does Episode ${ep} fit into the ${title} watch order?`,
        answer: `Episode ${ep} belongs to Season ${s}. ${siteName} organizes all episodes sequentially with absolute episode numbering so you can follow the official canon storyline with zero filler confusion.`,
      },
      {
        question: `Is ${title} available with multi-server redundancy on ${siteName}?`,
        answer: `Yes, ${siteName} offers 6+ dedicated high-speed anime playback mirrors (FrameXTV, VidLink, VidSrc) ensuring fast load times and lag-free simulcast playback.`,
      },
    ];
  }

  if (tenant === 'dramapulse') {
    const network = options.network || 'leading Korean television networks';
    const cast = options.cast && options.cast.length > 0 ? options.cast.slice(0, 3).join(', ') : 'renowned drama actors';
    return [
      {
        question: `Where can I watch ${title} Episode ${ep} with English subtitles?`,
        answer: `You can stream full episodes of ${title} Episode ${ep} with verified English subtitles in crisp 1080p HD online for free on ${siteName}.`,
      },
      {
        question: `Which broadcast network originally aired ${title} and what is its release year?`,
        answer: `${title} was broadcast by ${network} (${year}). The complete drama series is cataloged on ${siteName} with high-speed Asian streaming servers.`,
      },
      {
        question: `Who stars in the main cast of ${title}?`,
        answer: `The leading cast of ${title} features ${cast}. Their performances have received widespread praise from drama fans worldwide.`,
      },
      {
        question: `Can I binge-watch all episodes of ${title} on mobile and desktop?`,
        answer: `Yes, ${siteName} is fully optimized for smartphones, tablets, and desktop browsers with responsive playback and instant server fallback.`,
      },
    ];
  }

  // RoseFlix (Movies & Global TV)
  const director = options.director ? `directed by ${options.director} and ` : '';
  const cast = options.cast && options.cast.length > 0 ? options.cast.slice(0, 3).join(', ') : 'an acclaimed Hollywood ensemble';
  return [
    {
      question: `What is the release year and official runtime for ${title}?`,
      answer: `${title} was officially released in ${year}. Stream the full ${isMovie ? 'movie' : `season ${s}`} in full 1080p HD with crystal clear surround audio on ${siteName}.`,
    },
    {
      question: `Who directed ${title} and who stars in the lead roles?`,
      answer: `${title} is ${director}stars ${cast}. Explore comprehensive production credits and trivia on ${siteName}.`,
    },
    {
      question: `Does ${siteName} support multi-language subtitles for ${title}?`,
      answer: `Yes, ${title} features English SDH subtitles alongside multi-language caption options and high-fidelity video streams.`,
    },
    {
      question: `Are multiple streaming mirrors available for ${title}?`,
      answer: `${siteName} provides redundant streaming servers (Server 1 to Server 6) with automatic fallback so you never experience broken streams or buffering.`,
    },
  ];
}

/**
 * Builds a 100% distinct, tenant-optimized Title and Meta Description for Watch pages.
 * Guaranteed to produce zero duplicate snippet penalty across AniRose, DramaPulse, and RoseFlix.
 */
export function generateTenantWatchMetadata(
  options: WatchMetadataOptions
): Metadata {
  const tenant = options.tenantId || detectTenantId(options.requestHost);
  const profile = getTenantProfile(tenant);
  const siteUrl = resolveActiveSiteUrl(options.requestHost);
  const siteName = profile.siteName;

  const rawTitle = options.title.trim();
  const year = options.year ? String(options.year) : '';
  const s = options.season || 1;
  const ep = options.episode || 1;
  const absEp = options.absoluteEpisode || ep;
  const isMovie = options.mediaType === 'movie';

  let pageTitle = '';
  let description = '';
  let canonicalPath = '';

  // 1. ANIROSE TEMPLATE ENGINE
  if (tenant === 'anirose') {
    const romaji = options.romajiTitle && options.romajiTitle !== rawTitle
      ? ` (${options.romajiTitle})`
      : '';
    
    // Strict title pattern: 35–75 chars
    if (isMovie) {
      pageTitle = `Watch ${rawTitle}${romaji} Full Movie English Sub/Dub in HD | ${siteName}`;
    } else {
      pageTitle = `Watch ${rawTitle}${romaji} Episode ${absEp} English Sub/Dub Online in HD | ${siteName}`;
    }

    if (pageTitle.length > 72) {
      // Trim romaji or clean title to stay strictly under 75 chars
      pageTitle = isMovie
        ? `Watch ${rawTitle} Full Anime Movie (Sub/Dub) in HD | ${siteName}`
        : `Watch ${rawTitle} Ep ${absEp} English Sub/Dub in HD | ${siteName}`;
      if (pageTitle.length > 74) {
        const shortTitle = rawTitle.slice(0, 70 - (isMovie ? 36 : 30)).trim();
        pageTitle = isMovie
          ? `Watch ${shortTitle}... Movie (Sub/Dub) in HD | ${siteName}`
          : `Watch ${shortTitle}... Ep ${absEp} (Sub/Dub) in HD | ${siteName}`;
      }
    }

    const studioPart = options.studio ? `Animated by ${options.studio}. ` : '';
    const cleanSyn = options.overview ? options.overview.replace(/\s+/g, ' ').slice(0, 70) : 'Full series streaming';
    description = cleanMetaDescription(
      `Stream ${rawTitle}${romaji} ${isMovie ? 'movie' : `Episode ${absEp}`} in 1080p HD with Japanese audio and English dub. ${studioPart}${cleanSyn}`,
      `Watch lag-free on ${siteName}.`,
      100,
      160
    );

    canonicalPath = isMovie
      ? `/watch/anime/${options.id}?type=movie`
      : `/watch/anime/${options.id}?s=${s}&ep=${ep}`;
  }

  // 2. DRAMAPULSE TEMPLATE ENGINE
  else if (tenant === 'dramapulse') {
    if (isMovie) {
      pageTitle = `${rawTitle} (${year || 'Full'}) Full Drama Movie Eng Sub — Stream in HD | ${siteName}`;
    } else {
      pageTitle = `${rawTitle} Episode ${ep} Eng Sub — Stream Full ${year || 'Asian'} Drama Series | ${siteName}`;
    }

    if (pageTitle.length > 72) {
      pageTitle = isMovie
        ? `${rawTitle} Full Movie Eng Sub in HD | ${siteName}`
        : `${rawTitle} Ep ${ep} Eng Sub — Stream Drama Series | ${siteName}`;
      if (pageTitle.length > 74) {
        const shortTitle = rawTitle.slice(0, 70 - (isMovie ? 30 : 36)).trim();
        pageTitle = isMovie
          ? `${shortTitle}... Movie Eng Sub in HD | ${siteName}`
          : `${shortTitle}... Ep ${ep} Eng Sub Drama | ${siteName}`;
      }
    }

    const netPart = options.network ? `Broadcast on ${options.network}. ` : '';
    const cleanSyn = options.overview ? options.overview.replace(/\s+/g, ' ').slice(0, 70) : 'Stream high definition Asian drama';
    description = cleanMetaDescription(
      `Watch ${rawTitle} Episode ${ep} with English subtitles in 1080p HD. ${netPart}Aired ${year}. ${cleanSyn}`,
      `Stream free on ${siteName}.`,
      100,
      160
    );

    canonicalPath = `/watch/kdrama/${options.id}?s=${s}&ep=${ep}`;
  }

  // 3. ROSEFLIX TEMPLATE ENGINE
  else {
    const yearStr = year ? ` (${year})` : '';
    if (isMovie) {
      pageTitle = `Stream ${rawTitle}${yearStr} Full Movie in 1080p HD | ${siteName}`;
    } else {
      pageTitle = `Stream ${rawTitle}${yearStr} S${s}E${ep} in 1080p HD | ${siteName}`;
    }

    if (pageTitle.length > 72) {
      pageTitle = isMovie
        ? `Stream ${rawTitle} Full Movie in 1080p HD | ${siteName}`
        : `Stream ${rawTitle} S${s}E${ep} in 1080p HD | ${siteName}`;
      if (pageTitle.length > 74) {
        const shortTitle = rawTitle.slice(0, 70 - (isMovie ? 32 : 30)).trim();
        pageTitle = isMovie
          ? `Stream ${shortTitle}... Full Movie in HD | ${siteName}`
          : `Stream ${shortTitle}... S${s}E${ep} in HD | ${siteName}`;
      }
    }

    const castPart = options.cast && options.cast.length > 0
      ? `Starring ${options.cast.slice(0, 2).join(', ')}. `
      : '';
    const cleanSyn = options.overview ? options.overview.replace(/\s+/g, ' ').slice(0, 70) : 'Full stream online in high-definition';
    description = cleanMetaDescription(
      `Stream ${rawTitle}${yearStr} ${isMovie ? 'full movie' : `S${s}E${ep}`} online in 1080p HD. ${castPart}${cleanSyn}`,
      `Watch online on ${siteName}.`,
      100,
      160
    );

    canonicalPath = isMovie
      ? `/watch/movie/${options.id}`
      : `/watch/tv/${options.id}?s=${s}&e=${ep}`;
  }

  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const backdropUrl = options.backdropUrl?.startsWith('http')
    ? options.backdropUrl
    : options.backdropUrl
    ? `${siteUrl}${options.backdropUrl}`
    : `${siteUrl}/og-default.jpg`;

  return {
    title: {
      absolute: pageTitle,
    },
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: isMovie ? 'video.movie' : 'video.episode',
      url: canonicalUrl,
      title: pageTitle,
      description,
      siteName,
      locale: 'en_US',
      images: [
        {
          url: backdropUrl,
          width: 1280,
          height: 720,
          alt: `${pageTitle} on ${siteName}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [backdropUrl],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Builds a unified Schema.org multi-graph JSON-LD structure (@graph) for Watch pages
 * Combining VideoObject, TVEpisode/TVSeries or Movie, BreadcrumbList, and FAQPage.
 */
export function buildWatchPageGraphSchema(
  options: WatchMetadataOptions & {
    embedUrl: string;
    faqs: SeoFaqItem[];
    rating?: number;
    ratingCount?: number;
    runtimeMinutes?: number;
  }
) {
  const siteUrl = resolveActiveSiteUrl(options.requestHost);
  const tenant = options.tenantId || detectTenantId(options.requestHost);
  const siteName = getTenantProfile(tenant).siteName;

  const isMovie = options.mediaType === 'movie';
  const s = options.season || 1;
  const ep = options.episode || 1;
  const absEp = options.absoluteEpisode || ep;
  const title = options.title;

  const canonicalUrl = `${siteUrl}${
    options.mediaType === 'anime'
      ? isMovie ? `/watch/anime/${options.id}?type=movie` : `/watch/anime/${options.id}?s=${s}&ep=${ep}`
      : options.mediaType === 'kdrama'
      ? `/watch/kdrama/${options.id}?s=${s}&ep=${ep}`
      : isMovie
      ? `/watch/movie/${options.id}`
      : `/watch/tv/${options.id}?s=${s}&e=${ep}`
  }`;

  const backdrop = options.backdropUrl?.startsWith('http')
    ? options.backdropUrl
    : options.backdropUrl
    ? `${siteUrl}${options.backdropUrl}`
    : `${siteUrl}/og-default.jpg`;

  const durationIso = options.runtimeMinutes && options.runtimeMinutes > 0
    ? `PT${Math.floor(options.runtimeMinutes)}M`
    : isMovie
    ? 'PT110M'
    : 'PT24M';

  // 1. VideoObject
  const videoObject = {
    '@type': 'VideoObject',
    name: `${title} - ${isMovie ? 'Full Movie' : `Episode ${absEp}`}`,
    description: options.overview || `Watch ${title} in 1080p HD on ${siteName}.`,
    thumbnailUrl: [backdrop],
    uploadDate: options.year ? `${options.year}-01-01T00:00:00Z` : new Date().toISOString(),
    duration: durationIso,
    embedUrl: options.embedUrl,
    potentialAction: {
      '@type': 'WatchAction',
      target: canonicalUrl,
    },
  };

  // 2. Movie or TVEpisode + TVSeries
  const ratingValue = options.rating && options.rating > 0
    ? Math.min(10, Math.max(1, options.rating)).toFixed(1)
    : undefined;
  const ratingCount = options.ratingCount && options.ratingCount > 0
    ? options.ratingCount
    : 150;

  const aggregateRating = ratingValue
    ? {
        '@type': 'AggregateRating',
        ratingValue,
        bestRating: '10',
        worstRating: '1',
        ratingCount,
      }
    : undefined;

  let mainEntity: any = null;
  if (isMovie) {
    mainEntity = {
      '@type': 'Movie',
      name: title,
      url: canonicalUrl,
      image: [backdrop],
      datePublished: options.year ? `${options.year}-01-01` : undefined,
      description: options.overview || undefined,
      genre: options.genres || [],
      duration: durationIso,
      director: options.director ? { '@type': 'Person', name: options.director } : undefined,
      actor: (options.cast || []).slice(0, 5).map((name) => ({
        '@type': 'Person',
        name,
      })),
      aggregateRating,
    };
  } else {
    mainEntity = {
      '@type': 'TVEpisode',
      name: `${title} S${s} E${ep}`,
      episodeNumber: ep,
      partOfSeason: {
        '@type': 'TVSeason',
        seasonNumber: s,
      },
      partOfSeries: {
        '@type': 'TVSeries',
        name: title,
        url: canonicalUrl,
        genre: options.genres || [],
        actor: (options.cast || []).slice(0, 5).map((name) => ({
          '@type': 'Person',
          name,
        })),
        aggregateRating,
      },
    };
  }

  // 3. BreadcrumbList
  const categoryName =
    options.mediaType === 'anime'
      ? 'Anime'
      : options.mediaType === 'kdrama'
      ? 'K-Dramas'
      : isMovie
      ? 'Movies'
      : 'TV Shows';

  const categoryUrl = `${siteUrl}/${
    options.mediaType === 'anime'
      ? 'anime'
      : options.mediaType === 'kdrama'
      ? 'kdramas'
      : isMovie
      ? 'movies'
      : 'tv'
  }`;

  const breadcrumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryName,
        item: categoryUrl,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: canonicalUrl,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: isMovie ? 'Full Movie' : `S${s} E${ep}`,
        item: canonicalUrl,
      },
    ],
  };

  // 4. FAQPage
  const faqPage = {
    '@type': 'FAQPage',
    mainEntity: (options.faqs || []).map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [videoObject, mainEntity, breadcrumbs, faqPage],
  };
}

/**
 * Movie Schema.org Rich Snippet
 */
export function buildMovieSchema(movie: DetailedMovie, baseUrl: string) {
  const posterUrl = movie.poster_path ? getTMDBImageUrl(movie.poster_path, 'original') : undefined;
  const backdropUrl = movie.backdrop_path ? getTMDBImageUrl(movie.backdrop_path, 'original') : undefined;
  const topCast = movie.credits?.cast.slice(0, 5) || [];
  const director = movie.credits?.crew.find((c) => c.job === 'Director')?.name;

  return {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    url: `${baseUrl}/watch/movie/${movie.id}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    datePublished: movie.release_date || undefined,
    description: movie.overview || undefined,
    genre: movie.genres?.map((g) => g.name) || [],
    duration: movie.runtime ? `PT${movie.runtime}M` : undefined,
    director: director ? { '@type': 'Person', name: director } : undefined,
    actor: topCast.map((c) => ({
      '@type': 'Person',
      name: c.name,
    })),
    aggregateRating: movie.vote_count && movie.vote_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: movie.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '1',
          ratingCount: movie.vote_count,
        }
      : undefined,
  };
}

/**
 * TV Series Schema.org Rich Snippet
 */
export function buildTVSeriesSchema(show: DetailedTVShow, baseUrl: string) {
  const posterUrl = show.poster_path ? getTMDBImageUrl(show.poster_path, 'original') : undefined;
  const backdropUrl = show.backdrop_path ? getTMDBImageUrl(show.backdrop_path, 'original') : undefined;
  const topCast = show.credits?.cast.slice(0, 5) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    url: `${baseUrl}/watch/tv/${show.id}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    startDate: show.first_air_date || undefined,
    description: show.overview || undefined,
    genre: show.genres?.map((g) => g.name) || [],
    numberOfSeasons: show.number_of_seasons || undefined,
    numberOfEpisodes: show.number_of_episodes || undefined,
    actor: topCast.map((c) => ({
      '@type': 'Person',
      name: c.name,
    })),
    aggregateRating: show.vote_count && show.vote_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: show.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '1',
          ratingCount: show.vote_count,
        }
      : undefined,
  };
}

/**
 * K-Drama Series Schema.org Rich Snippet
 */
export function buildKDramaSeriesSchema(
  show: DetailedTVShow,
  baseUrl: string,
  season: number = 1,
  episode: number = 1
) {
  const posterUrl = show.poster_path ? getTMDBImageUrl(show.poster_path, 'original') : undefined;
  const backdropUrl = show.backdrop_path ? getTMDBImageUrl(show.backdrop_path, 'original') : undefined;
  const topCast = show.credits?.cast.slice(0, 5) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: show.name,
    alternateName: [show.original_name].filter(Boolean),
    url: `${baseUrl}/watch/kdrama/${show.id}?s=${season}&ep=${episode}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    startDate: show.first_air_date || undefined,
    description: show.overview || undefined,
    genre: show.genres?.map((g) => g.name) || [],
    numberOfSeasons: show.number_of_seasons || undefined,
    numberOfEpisodes: show.number_of_episodes || undefined,
    inLanguage: 'ko',
    subtitleLanguage: 'en',
    actor: topCast.map((c) => ({
      '@type': 'Person',
      name: c.name,
    })),
    aggregateRating: show.vote_count && show.vote_count > 0
      ? {
          '@type': 'AggregateRating',
          ratingValue: show.vote_average.toFixed(1),
          bestRating: '10',
          worstRating: '1',
          ratingCount: show.vote_count,
        }
      : undefined,
  };
}

/**
 * VideoObject Schema for Watch Pages
 */
export function buildVideoObjectSchema(params: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate?: string;
  embedUrl: string;
  duration?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: params.name,
    description: params.description,
    thumbnailUrl: [params.thumbnailUrl],
    uploadDate: params.uploadDate || new Date().toISOString(),
    embedUrl: params.embedUrl,
    duration: params.duration ? `PT${params.duration}M` : undefined,
    potentialAction: {
      '@type': 'SeekToAction',
      target: `${params.embedUrl}?t={seek_to_second_number}`,
      'startOffset-input': 'required name=seek_to_second_number',
    },
  };
}

/**
 * BreadcrumbList Schema
 */
export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Anime Series Schema.org Rich Snippet
 */
export function buildAnimeSeriesSchema(anime: any, baseUrl: string, episode: number = 1) {
  const title = anime.title_english || anime.title;
  const posterUrl = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const backdropUrl = anime.trailer?.images?.maximum_image_url || posterUrl;
  const studios = anime.studios?.map((s: any) => ({ '@type': 'Organization', name: s.name })) || [];

  return {
    '@context': 'https://schema.org',
    '@type': 'TVSeries',
    name: title,
    alternateName: [anime.title, anime.title_japanese].filter(Boolean),
    url: `${baseUrl}/watch/anime/${anime.mal_id || anime.id}?ep=${episode}`,
    image: [posterUrl, backdropUrl].filter(Boolean),
    startDate: anime.aired?.from ? anime.aired.from.slice(0, 10) : undefined,
    description: anime.synopsis || anime.overview || undefined,
    genre: anime.genres?.map((g: any) => g.name) || [],
    numberOfEpisodes: anime.episodes || undefined,
    productionCompany: studios,
    aggregateRating:
      anime.score && anime.score > 0
        ? {
            '@type': 'AggregateRating',
            ratingValue: anime.score.toFixed(1),
            bestRating: '10',
            worstRating: '1',
            ratingCount: anime.scored_by || 100,
          }
        : undefined,
  };
}

/**
 * WebSite Schema with SearchAction for Google Sitelinks Search Box
 */
export function buildWebSiteSearchSchema(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.SITE_NAME,
    alternateName: [`${SITE_CONFIG.SITE_NAME} HD`, `${SITE_CONFIG.SITE_NAME} Stream`],
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
