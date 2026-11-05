/**
 * AniList & MyAnimeList Bridge Resolver
 *
 * Bridges TMDB IDs with AniList IDs, MyAnimeList (MAL) IDs, and clean URL slugs.
 * Used to ensure 100% embed uptime across specialized anime streaming mirrors
 * (VidLink, VidSrc CC, AutoEmbed, Embed.su, 2Anime).
 */

export interface AnimeBridgeIds {
  tmdbId: number;
  anilistId: number;
  malId: number;
  slug: string;
  slugRomaji?: string;
  slugEnglish?: string;
  titleRomaji?: string;
  titleEnglish?: string;
  titleNative?: string;
}

export function slugify(text: string): string {
  if (!text) return 'anime';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'anime';
}

/**
 * Built-in instant lookup dictionary for top anime series.
 * Keyed by TMDB ID as string.
 * Season-specific variants are supported via key format `${tmdbId}_s${season}`.
 */
interface StaticAnimeEntry {
  anilistId: number;
  malId: number;
  slug: string;
  titleRomaji: string;
  titleEnglish: string;
  seasons?: Record<number, { anilistId: number; malId: number; slug: string }>;
}

const STATIC_ANIME_MAP: Record<number, StaticAnimeEntry> = {
  // Jujutsu Kaisen
  95479: {
    anilistId: 113415,
    malId: 40748,
    slug: 'jujutsu-kaisen',
    titleRomaji: 'Jujutsu Kaisen',
    titleEnglish: 'Jujutsu Kaisen',
    seasons: {
      1: { anilistId: 113415, malId: 40748, slug: 'jujutsu-kaisen' },
      2: { anilistId: 145064, malId: 51009, slug: 'jujutsu-kaisen-2nd-season' },
    },
  },
  // Solo Leveling
  127532: {
    anilistId: 151807,
    malId: 52299,
    slug: 'solo-leveling',
    titleRomaji: 'Ore dake Level Up na Ken',
    titleEnglish: 'Solo Leveling',
    seasons: {
      1: { anilistId: 151807, malId: 52299, slug: 'solo-leveling' },
      2: { anilistId: 176274, malId: 58567, slug: 'solo-leveling-season-2-arise-from-the-shadow' },
    },
  },
  // One Piece
  37854: {
    anilistId: 21,
    malId: 21,
    slug: 'one-piece',
    titleRomaji: 'One Piece',
    titleEnglish: 'One Piece',
  },
  // Demon Slayer: Kimetsu no Yaiba
  85937: {
    anilistId: 101922,
    malId: 38000,
    slug: 'demon-slayer-kimetsu-no-yaiba',
    titleRomaji: 'Kimetsu no Yaiba',
    titleEnglish: 'Demon Slayer: Kimetsu no Yaiba',
    seasons: {
      1: { anilistId: 101922, malId: 38000, slug: 'kimetsu-no-yaiba' },
      2: { anilistId: 129874, malId: 47778, slug: 'kimetsu-no-yaiba-yuukaku-hen' },
      3: { anilistId: 145139, malId: 51019, slug: 'kimetsu-no-yaiba-katanakaji-no-sato-hen' },
      4: { anilistId: 166240, malId: 55701, slug: 'kimetsu-no-yaiba-hashira-geiko-hen' },
    },
  },
  // Attack on Titan
  1429: {
    anilistId: 16498,
    malId: 16498,
    slug: 'shingeki-no-kyojin',
    titleRomaji: 'Shingeki no Kyojin',
    titleEnglish: 'Attack on Titan',
    seasons: {
      1: { anilistId: 16498, malId: 16498, slug: 'shingeki-no-kyojin' },
      2: { anilistId: 20958, malId: 25777, slug: 'shingeki-no-kyojin-season-2' },
      3: { anilistId: 99147, malId: 35760, slug: 'shingeki-no-kyojin-season-3' },
      4: { anilistId: 110277, malId: 40028, slug: 'shingeki-no-kyojin-the-final-season' },
    },
  },
  // Frieren: Beyond Journey's End
  209867: {
    anilistId: 154587,
    malId: 52991,
    slug: 'sousou-no-frieren',
    titleRomaji: 'Sousou no Frieren',
    titleEnglish: "Frieren: Beyond Journey's End",
  },
  // Chainsaw Man
  114410: {
    anilistId: 127230,
    malId: 44511,
    slug: 'chainsaw-man',
    titleRomaji: 'Chainsaw Man',
    titleEnglish: 'Chainsaw Man',
  },
  // Dandadan
  240411: {
    anilistId: 171018,
    malId: 57334,
    slug: 'dandadan',
    titleRomaji: 'Dandadan',
    titleEnglish: 'DAN DA DAN',
  },
  // Naruto
  46260: {
    anilistId: 20,
    malId: 20,
    slug: 'naruto',
    titleRomaji: 'Naruto',
    titleEnglish: 'Naruto',
  },
  // Naruto Shippuden
  31910: {
    anilistId: 1735,
    malId: 1735,
    slug: 'naruto-shippuuden',
    titleRomaji: 'Naruto: Shippuuden',
    titleEnglish: 'Naruto: Shippuden',
  },
  // Bleach
  30984: {
    anilistId: 269,
    malId: 269,
    slug: 'bleach',
    titleRomaji: 'Bleach',
    titleEnglish: 'Bleach',
    seasons: {
      1: { anilistId: 269, malId: 269, slug: 'bleach' },
      2: { anilistId: 114446, malId: 41467, slug: 'bleach-sennen-kessen-hen' },
    },
  },
  // Death Note
  13916: {
    anilistId: 1535,
    malId: 1535,
    slug: 'death-note',
    titleRomaji: 'Death Note',
    titleEnglish: 'Death Note',
  },
  // Blue Lock
  135123: {
    anilistId: 137822,
    malId: 49596,
    slug: 'blue-lock',
    titleRomaji: 'Blue Lock',
    titleEnglish: 'BLUELOCK',
    seasons: {
      1: { anilistId: 137822, malId: 49596, slug: 'blue-lock' },
      2: { anilistId: 163146, malId: 54865, slug: 'blue-lock-vs-u-20-japan' },
    },
  },
  // Spy x Family
  120089: {
    anilistId: 140960,
    malId: 50265,
    slug: 'spy-x-family',
    titleRomaji: 'SPY x FAMILY',
    titleEnglish: 'SPY x FAMILY',
    seasons: {
      1: { anilistId: 140960, malId: 50265, slug: 'spy-x-family' },
      2: { anilistId: 158870, malId: 53887, slug: 'spy-x-family-season-2' },
    },
  },
  // Oshi no Ko
  203737: {
    anilistId: 150672,
    malId: 52034,
    slug: 'oshi-no-ko',
    titleRomaji: '【OSHI NO KO】',
    titleEnglish: 'Oshi no Ko',
    seasons: {
      1: { anilistId: 150672, malId: 52034, slug: 'oshi-no-ko' },
      2: { anilistId: 166531, malId: 55791, slug: 'oshi-no-ko-2nd-season' },
    },
  },
  // Hunter x Hunter (2011)
  46298: {
    anilistId: 11061,
    malId: 11061,
    slug: 'hunter-x-hunter-2011',
    titleRomaji: 'Hunter x Hunter (2011)',
    titleEnglish: 'Hunter x Hunter',
  },
  // Fullmetal Alchemist: Brotherhood
  31845: {
    anilistId: 5114,
    malId: 5114,
    slug: 'fullmetal-alchemist-brotherhood',
    titleRomaji: 'Hagane no Renkinjutsushi: Fullmetal Alchemist',
    titleEnglish: 'Fullmetal Alchemist: Brotherhood',
  },
  // My Hero Academia
  65930: {
    anilistId: 21459,
    malId: 31964,
    slug: 'boku-no-hero-academia',
    titleRomaji: 'Boku no Hero Academia',
    titleEnglish: 'My Hero Academia',
    seasons: {
      1: { anilistId: 21459, malId: 31964, slug: 'boku-no-hero-academia' },
      2: { anilistId: 21856, malId: 33486, slug: 'boku-no-hero-academia-2nd-season' },
      3: { anilistId: 100166, malId: 36456, slug: 'boku-no-hero-academia-3rd-season' },
      4: { anilistId: 104276, malId: 38408, slug: 'boku-no-hero-academia-4th-season' },
      5: { anilistId: 117193, malId: 41587, slug: 'boku-no-hero-academia-5th-season' },
      6: { anilistId: 136430, malId: 49918, slug: 'boku-no-hero-academia-6th-season' },
      7: { anilistId: 163139, malId: 54857, slug: 'boku-no-hero-academia-7th-season' },
    },
  },
  // Sword Art Online
  45782: {
    anilistId: 11757,
    malId: 11757,
    slug: 'sword-art-online',
    titleRomaji: 'Sword Art Online',
    titleEnglish: 'Sword Art Online',
  },
  // Tokyo Ghoul
  61374: {
    anilistId: 20605,
    malId: 22319,
    slug: 'tokyo-ghoul',
    titleRomaji: 'Tokyo Ghoul',
    titleEnglish: 'Tokyo Ghoul',
  },
  // Mob Psycho 100
  67075: {
    anilistId: 21507,
    malId: 32182,
    slug: 'mob-psycho-100',
    titleRomaji: 'Mob Psycho 100',
    titleEnglish: 'Mob Psycho 100',
    seasons: {
      1: { anilistId: 21507, malId: 32182, slug: 'mob-psycho-100' },
      2: { anilistId: 101338, malId: 37510, slug: 'mob-psycho-100-ii' },
      3: { anilistId: 140439, malId: 50172, slug: 'mob-psycho-100-iii' },
    },
  },
  // Assassination Classroom
  65733: {
    anilistId: 20755,
    malId: 24833,
    slug: 'ansatsu-kyoushitsu',
    titleRomaji: 'Ansatsu Kyoushitsu',
    titleEnglish: 'Assassination Classroom',
    seasons: {
      1: { anilistId: 20755, malId: 24833, slug: 'ansatsu-kyoushitsu' },
      2: { anilistId: 21170, malId: 30654, slug: 'ansatsu-kyoushitsu-2nd-season' },
    },
  },
  // Haikyuu!!
  60625: {
    anilistId: 20464,
    malId: 20583,
    slug: 'haikyuu',
    titleRomaji: 'Haikyuu!!',
    titleEnglish: 'Haikyu!!',
  },
  // Vinland Saga
  87693: {
    anilistId: 101348,
    malId: 37521,
    slug: 'vinland-saga',
    titleRomaji: 'Vinland Saga',
    titleEnglish: 'Vinland Saga',
    seasons: {
      1: { anilistId: 101348, malId: 37521, slug: 'vinland-saga' },
      2: { anilistId: 136430, malId: 49387, slug: 'vinland-saga-season-2' },
    },
  },
  // Cyberpunk: Edgerunners
  105248: {
    anilistId: 120377,
    malId: 42364,
    slug: 'cyberpunk-edgerunners',
    titleRomaji: 'Cyberpunk: Edgerunners',
    titleEnglish: 'Cyberpunk: Edgerunners',
  },
  // Kaiju No. 8
  207347: {
    anilistId: 153288,
    malId: 52588,
    slug: 'kaijuu-8-gou',
    titleRomaji: 'Kaijuu 8-gou',
    titleEnglish: 'Kaiju No.8',
  },
  // Hell's Paradise
  116766: {
    anilistId: 128893,
    malId: 46569,
    slug: 'jigokuraku',
    titleRomaji: 'Jigokuraku',
    titleEnglish: "Hell's Paradise",
  },
  // Wind Breaker
  222384: {
    anilistId: 163270,
    malId: 54970,
    slug: 'wind-breaker',
    titleRomaji: 'WIND BREAKER',
    titleEnglish: 'WIND BREAKER',
  },
  // Black Clover
  74204: {
    anilistId: 97940,
    malId: 34572,
    slug: 'black-clover',
    titleRomaji: 'Black Clover',
    titleEnglish: 'Black Clover',
  },
  // Steins;Gate
  42206: {
    anilistId: 9253,
    malId: 9253,
    slug: 'steinsgate',
    titleRomaji: 'Steins;Gate',
    titleEnglish: 'Steins;Gate',
  },
  // Classroom of the Elite
  72636: {
    anilistId: 98659,
    malId: 35507,
    slug: 'youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e',
    titleRomaji: 'Youkoso Jitsuryoku Shijou Shugi no Kyoushitsu e',
    titleEnglish: 'Classroom of the Elite',
  },
};

// Bidirectional In-Memory Indexes for Instant 0ms Static Offline Lookups
export const STATIC_MAL_MAP = new Map<number, { tmdbId: number; entry: StaticAnimeEntry }>();
export const STATIC_ANILIST_MAP = new Map<number, { tmdbId: number; entry: StaticAnimeEntry }>();
export const STATIC_SLUG_MAP = new Map<string, { tmdbId: number; entry: StaticAnimeEntry }>();

for (const [idStr, entry] of Object.entries(STATIC_ANIME_MAP)) {
  const tmdbId = Number(idStr);
  if (entry.malId) {
    STATIC_MAL_MAP.set(entry.malId, { tmdbId, entry });
  }
  if (entry.anilistId) {
    STATIC_ANILIST_MAP.set(entry.anilistId, { tmdbId, entry });
  }
  if (entry.slug) {
    STATIC_SLUG_MAP.set(entry.slug.toLowerCase(), { tmdbId, entry });
  }
  if (entry.titleRomaji) {
    STATIC_SLUG_MAP.set(slugify(entry.titleRomaji), { tmdbId, entry });
  }
  if (entry.titleEnglish) {
    STATIC_SLUG_MAP.set(slugify(entry.titleEnglish), { tmdbId, entry });
  }
  if (entry.seasons) {
    for (const sData of Object.values(entry.seasons)) {
      if (sData.malId) {
        STATIC_MAL_MAP.set(sData.malId, { tmdbId, entry });
      }
      if (sData.anilistId) {
        STATIC_ANILIST_MAP.set(sData.anilistId, { tmdbId, entry });
      }
      if (sData.slug) {
        STATIC_SLUG_MAP.set(sData.slug.toLowerCase(), { tmdbId, entry });
      }
    }
  }
}

// In-Memory Cache with 2-Hour TTL
const bridgeCache = new Map<string, { data: AnimeBridgeIds; expiry: number }>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

const ANILIST_GRAPHQL_ENDPOINT = 'https://graphql.anilist.co';

const ANILIST_SEARCH_QUERY = `
query ($search: String) {
  Media(search: $search, type: ANIME) {
    id
    idMal
    title {
      romaji
      english
      native
    }
    synonyms
    format
    episodes
  }
}
`;

export interface ResolveAnimeOptions {
  tmdbId: number | string;
  malId?: number | string;
  title?: string;
  originalTitle?: string;
  season?: number;
}

/**
 * Synchronous static bridge resolver for top anime titles.
 * Resolves AniList ID, MAL ID, and URL slug from built-in offline maps with 0 latency & 0 network calls.
 */
export function resolveAnimeIdsSync(options: ResolveAnimeOptions): AnimeBridgeIds | null {
  const tmdbIdNum = typeof options.tmdbId === 'string' ? parseInt(options.tmdbId, 10) : Number(options.tmdbId);
  const explicitMalId = options.malId ? (typeof options.malId === 'string' ? parseInt(options.malId, 10) : Number(options.malId)) : undefined;
  const seasonNum = options.season && options.season > 0 ? options.season : 1;
  const rawTitle = options.title?.trim() || options.originalTitle?.trim() || `Anime ${tmdbIdNum || explicitMalId || ''}`.trim();
  const baseSlug = slugify(rawTitle);

  // 1. Check static map by TMDB ID
  let staticMatch: { tmdbId: number; entry: StaticAnimeEntry } | undefined;
  if (!isNaN(tmdbIdNum) && tmdbIdNum > 0 && STATIC_ANIME_MAP[tmdbIdNum]) {
    staticMatch = { tmdbId: tmdbIdNum, entry: STATIC_ANIME_MAP[tmdbIdNum] };
  }

  // 2. Check static map by explicit MAL ID or if tmdbId is a MAL ID (e.g. 21 -> One Piece)
  if (!staticMatch) {
    if (explicitMalId && STATIC_MAL_MAP.has(explicitMalId)) {
      staticMatch = STATIC_MAL_MAP.get(explicitMalId);
    } else if (!isNaN(tmdbIdNum) && STATIC_MAL_MAP.has(tmdbIdNum)) {
      staticMatch = STATIC_MAL_MAP.get(tmdbIdNum);
    }
  }

  // 3. Check static map by AniList ID
  if (!staticMatch && !isNaN(tmdbIdNum) && STATIC_ANILIST_MAP.has(tmdbIdNum)) {
    staticMatch = STATIC_ANILIST_MAP.get(tmdbIdNum);
  }

  // 4. Check static map by slug or title match (e.g. 'one-piece')
  if (!staticMatch) {
    if (STATIC_SLUG_MAP.has(baseSlug)) {
      staticMatch = STATIC_SLUG_MAP.get(baseSlug);
    } else if (STATIC_SLUG_MAP.has(slugify(rawTitle))) {
      staticMatch = STATIC_SLUG_MAP.get(slugify(rawTitle));
    }
  }

  if (staticMatch) {
    const { tmdbId, entry } = staticMatch;
    const seasonData = entry.seasons?.[seasonNum];
    const anilistId = seasonData?.anilistId || entry.anilistId;
    const malId = seasonData?.malId || entry.malId;
    const slug = seasonData?.slug || entry.slug;

    return {
      tmdbId,
      anilistId,
      malId,
      slug,
      slugRomaji: entry.slug,
      slugEnglish: slugify(entry.titleEnglish),
      titleRomaji: entry.titleRomaji,
      titleEnglish: entry.titleEnglish,
    };
  }

  return null;
}

/**
 * Resolves AniList ID, MAL ID, and URL slug for an anime title.
 * Checks in-memory cache and static map first (by TMDB ID, MAL ID, AniList ID, or slug/title).
 * Falls back to AniList GraphQL with strict timeout, and direct mathematical offline fallback.
 */
export async function resolveAnimeIds(options: ResolveAnimeOptions): Promise<AnimeBridgeIds> {
  const tmdbIdNum = typeof options.tmdbId === 'string' ? parseInt(options.tmdbId, 10) : Number(options.tmdbId);
  const explicitMalId = options.malId ? (typeof options.malId === 'string' ? parseInt(options.malId, 10) : Number(options.malId)) : undefined;
  const seasonNum = options.season && options.season > 0 ? options.season : 1;
  const rawTitle = options.title?.trim() || options.originalTitle?.trim() || `Anime ${tmdbIdNum || explicitMalId || ''}`.trim();
  const baseSlug = slugify(rawTitle);

  const cacheKey = `${tmdbIdNum}_${explicitMalId || 0}_s${seasonNum}_${baseSlug}`;
  const cached = bridgeCache.get(cacheKey);
  const now = Date.now();
  if (cached && now < cached.expiry) {
    return cached.data;
  }

  // 1. Instant check via synchronous static resolver
  const syncMatch = resolveAnimeIdsSync(options);
  if (syncMatch) {
    bridgeCache.set(cacheKey, { data: syncMatch, expiry: now + CACHE_TTL_MS });
    return syncMatch;
  }

  // 5. Query AniList GraphQL API with 2000ms timeout (for unmapped titles)
  const cleanSearchQuery = rawTitle
    .replace(/\s*\(TV\)/i, '')
    .replace(/\s*Season \d+/i, '')
    .trim();

  if (cleanSearchQuery && cleanSearchQuery !== 'Anime' && !cleanSearchQuery.startsWith('Anime ')) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);

      const response = await fetch(ANILIST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          query: ANILIST_SEARCH_QUERY,
          variables: { search: cleanSearchQuery },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.ok) {
        const json = await response.json();
        const media = json?.data?.Media;

        if (media && media.id) {
          const anilistId = media.id;
          const malId = media.idMal || media.id;
          const titleRomaji = media.title?.romaji || rawTitle;
          const titleEnglish = media.title?.english || titleRomaji;
          const titleNative = media.title?.native;
          const slug = slugify(titleRomaji);

          const result: AnimeBridgeIds = {
            tmdbId: isNaN(tmdbIdNum) || tmdbIdNum === 0 ? anilistId : tmdbIdNum,
            anilistId,
            malId,
            slug,
            slugRomaji: slugify(titleRomaji),
            slugEnglish: slugify(titleEnglish),
            titleRomaji,
            titleEnglish,
            titleNative,
          };

          bridgeCache.set(cacheKey, { data: result, expiry: now + CACHE_TTL_MS });
          return result;
        }
      }
    } catch {
      // Graceful fallback on network timeout or abort
    }
  }

  // 6. Graceful Offline Fallback: Zero network dependency, direct calculation
  const fallbackId = (!isNaN(tmdbIdNum) && tmdbIdNum > 0) ? tmdbIdNum : (explicitMalId || 1);
  const fallbackResult: AnimeBridgeIds = {
    tmdbId: fallbackId,
    anilistId: fallbackId,
    malId: fallbackId,
    slug: baseSlug,
    slugRomaji: baseSlug,
    slugEnglish: baseSlug,
    titleRomaji: rawTitle,
    titleEnglish: rawTitle,
  };

  bridgeCache.set(cacheKey, { data: fallbackResult, expiry: now + CACHE_TTL_MS });
  return fallbackResult;
}

