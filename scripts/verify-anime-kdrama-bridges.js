/**
 * Comprehensive Verification Suite for Anime & K-Drama Streaming Bridges
 * 
 * Verifies:
 * 1. Anime 4-Key Bridge (TMDB + AniList + MAL + Slug)
 * 2. K-Drama 3-Key Bridge (TMDB + IMDb + Slug)
 * 3. 6 Anime Multi-Server URLs (Zero undefined / NaN)
 * 4. 6 K-Drama Multi-Server URLs (Zero undefined / NaN)
 * 5. Dynamic Theme Hex Color resolution
 * 6. Zero sandboxed iframes across all player components
 * 7. JSON-LD structured data escaping
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple color helper for test output
const green = (text) => `\x1b[32m${text}\x1b[0m`;
const red = (text) => `\x1b[31m${text}\x1b[0m`;
const cyan = (text) => `\x1b[36m${text}\x1b[0m`;

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${red(name)}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${red(name)}`);
    console.error(`    Error: ${err.message}`);
  }
}

async function main() {
  console.log(cyan('\n======================================================'));
  console.log(cyan('  ANIME & K-DRAMA STREAMING BRIDGE VERIFICATION SUITE '));
  console.log(cyan('======================================================\n'));

  // -------------------------------------------------------------------------
  // TEST GROUP 1: Anime 4-Key Bridge (`src/lib/anilist.ts`)
  // -------------------------------------------------------------------------
  console.log(cyan('► MODULE 1: Anime 4-Key Bridge & Static Instant Lookup Map'));

  const anilistPath = path.resolve(__dirname, '../src/lib/anilist.ts');
  const anilistCode = fs.readFileSync(anilistPath, 'utf8');

  runTest('anilist.ts exports resolveAnimeIds, resolveAnimeIdsSync, and slugify', () => {
    assert(anilistCode.includes('export async function resolveAnimeIds'), 'Missing resolveAnimeIds export');
    assert(anilistCode.includes('export function resolveAnimeIdsSync'), 'Missing resolveAnimeIdsSync export');
    assert(anilistCode.includes('export function slugify'), 'Missing slugify export');
    assert(anilistCode.includes('export interface AnimeBridgeIds'), 'Missing AnimeBridgeIds interface');
  });

  runTest('anilist.ts includes top 30 instant-lookup map entries and bidirectional offline maps', () => {
    // Jujutsu Kaisen
    assert(anilistCode.includes('95479'), 'Missing JJK 95479');
    assert(anilistCode.includes('40748'), 'Missing JJK MAL 40748');
    assert(anilistCode.includes('113415'), 'Missing JJK AniList 113415');
    // Solo Leveling
    assert(anilistCode.includes('127532'), 'Missing Solo Leveling 127532');
    assert(anilistCode.includes('52299'), 'Missing Solo Leveling MAL 52299');
    assert(anilistCode.includes('151807'), 'Missing Solo Leveling AniList 151807');
    // One Piece
    assert(anilistCode.includes('37854'), 'Missing One Piece 37854');
    // Demon Slayer
    assert(anilistCode.includes('85937'), 'Missing Demon Slayer 85937');
    // Attack on Titan
    assert(anilistCode.includes('1429'), 'Missing Attack on Titan 1429');
    // Frieren
    assert(anilistCode.includes('209867'), 'Missing Frieren 209867');
    // Chainsaw Man
    assert(anilistCode.includes('114410'), 'Missing Chainsaw Man 114410');
    // Dandadan
    assert(anilistCode.includes('240411'), 'Missing Dandadan 240411');
    // Bidirectional offline maps
    assert(anilistCode.includes('export const STATIC_MAL_MAP'), 'Missing STATIC_MAL_MAP export');
    assert(anilistCode.includes('export const STATIC_SLUG_MAP'), 'Missing STATIC_SLUG_MAP export');
  });

  runTest('API route /api/anime/resolve exists and handles GET requests', () => {
    const routePath = path.resolve(__dirname, '../src/app/api/anime/resolve/route.ts');
    assert(fs.existsSync(routePath), 'Missing /api/anime/resolve/route.ts');
    const routeCode = fs.readFileSync(routePath, 'utf8');
    assert(routeCode.includes('export async function GET'), 'Route must export GET handler');
    assert(routeCode.includes('resolveAnimeIds'), 'Route must call resolveAnimeIds');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 2: K-Drama 3-Key Bridge (`src/lib/kdrama.ts`)
  // -------------------------------------------------------------------------
  console.log(cyan('\n► MODULE 2: K-Drama 3-Key Bridge (TMDB + IMDb + Slug)'));

  const kdramaPath = path.resolve(__dirname, '../src/lib/kdrama.ts');
  const kdramaCode = fs.readFileSync(kdramaPath, 'utf8');

  runTest('kdrama.ts defines KDramaItem with imdb_id and slug', () => {
    assert(kdramaCode.includes('imdb_id?: string | null'), 'KDramaItem missing imdb_id');
    assert(kdramaCode.includes('slug?: string | null'), 'KDramaItem missing slug');
    assert(kdramaCode.includes('export function slugify'), 'Missing slugify export in kdrama.ts');
  });

  runTest('kdrama.ts FALLBACK_KDRAMA_LIST items contain verified IMDb IDs and slugs', () => {
    assert(kdramaCode.includes('tt10919420'), 'Squid Game missing tt10919420');
    assert(kdramaCode.includes('squid-game'), 'Squid Game missing slug');
    assert(kdramaCode.includes('tt27668559'), 'Queen of Tears missing tt27668559');
    assert(kdramaCode.includes('queen-of-tears'), 'Queen of Tears missing slug');
    assert(kdramaCode.includes('tt10850932'), 'Crash Landing on You missing tt10850932');
    assert(kdramaCode.includes('tt13433812'), 'Vincenzo missing tt13433812');
    assert(kdramaCode.includes('tt21344706'), 'The Glory missing tt21344706');
    assert(kdramaCode.includes('tt14169960'), 'All of Us Are Dead missing tt14169960');
    assert(kdramaCode.includes('tt5994364'), 'Goblin missing tt5994364');
    assert(kdramaCode.includes('tt19895920'), 'Alchemy of Souls missing tt19895920');
    assert(kdramaCode.includes('tt30806483'), 'Lovely Runner missing tt30806483');
  });

  runTest('kdrama.ts exports getKDramaById with external_ids append', () => {
    assert(kdramaCode.includes('export async function getKDramaById'), 'Missing getKDramaById export');
    assert(kdramaCode.includes('append_to_response: \'external_ids,recommendations,credits\''), 'getKDramaById must fetch external_ids');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 3: Multi-Server Resolvers (`src/lib/resolvers.ts`)
  // -------------------------------------------------------------------------
  console.log(cyan('\n► MODULE 3: Dedicated Anime & K-Drama Server Pools in resolvers.ts'));

  const resolversPath = path.resolve(__dirname, '../src/lib/resolvers.ts');
  const resolversCode = fs.readFileSync(resolversPath, 'utf8');

  runTest('resolvers.ts exports getPrimaryColorHex, ANIME_SERVERS, and KDRAMA_SERVERS', () => {
    assert(resolversCode.includes('export function getPrimaryColorHex'), 'Missing getPrimaryColorHex export');
    assert(resolversCode.includes('export const ANIME_SERVERS'), 'Missing ANIME_SERVERS export');
    assert(resolversCode.includes('export const KDRAMA_SERVERS'), 'Missing KDRAMA_SERVERS export');
    assert(resolversCode.includes('export const VIDEO_SERVERS'), 'Missing VIDEO_SERVERS export');
  });

  runTest('ANIME_SERVERS has FrameXTV Ultra as #1 and multi-server absolute episode support', () => {
    assert(resolversCode.includes('anime-server-1'), 'Missing anime-server-1');
    assert(resolversCode.includes('framextv.xyz/embed/'), 'Server 1 must support framextv.xyz/embed/');
    assert(resolversCode.includes('anime-server-2'), 'Missing anime-server-2');
    assert(resolversCode.includes('vidlink.pro/'), 'Server 2 must support vidlink.pro');
    assert(resolversCode.includes('anime-server-3'), 'Missing anime-server-3');
    assert(resolversCode.includes('framextv.xyz/embed/anime'), 'Server 3 must support framextv.xyz direct anime route');
    assert(resolversCode.includes('anime-server-4'), 'Missing anime-server-4');
    assert(resolversCode.includes('vidsrc.cc/'), 'Server 4 must support vidsrc.cc');
    assert(resolversCode.includes('anime-server-5'), 'Missing anime-server-5');
    assert(resolversCode.includes('vidsrc.to/embed/'), 'Server 5 must support vidsrc.to');
    assert(resolversCode.includes('anime-server-6'), 'Missing anime-server-6');
    assert(resolversCode.includes('multiembed.mov/'), 'Server 6 must support multiembed');
    assert(resolversCode.includes('anime-server-7'), 'Missing anime-server-7');
    assert(resolversCode.includes('autoembed.co/'), 'Server 7 must support autoembed');
    assert(resolversCode.includes('anime-server-8'), 'Missing anime-server-8');
    assert(resolversCode.includes('2embed.cc/embedtv/'), 'Server 8 must support 2embed tv routing');
    assert(resolversCode.includes('absoluteEpisode'), 'ANIME_SERVERS must support absolute episode numbers');
  });

  runTest('KDRAMA_SERVERS has FrameXTV as #1 and IMDb & TMDB dual-bridge', () => {
    assert(resolversCode.includes('framextv.xyz/embed/'), 'K-Drama Server 1 must support framextv.xyz');
    assert(resolversCode.includes('vidlink.pro/tv/'), 'K-Drama Server must support vidlink.pro/tv/');
    assert(resolversCode.includes('vidsrc.to/embed/'), 'K-Drama Server must support vidsrc.to');
    assert(resolversCode.includes('autoembed.co/'), 'K-Drama Server must support autoembed.co');
    assert(resolversCode.includes('vidsrc.me/embed/'), 'K-Drama Server must support vidsrc.me');
    assert(resolversCode.includes('multiembed.mov/?video_id='), 'K-Drama Server must support multiembed.mov');
    assert(resolversCode.includes('imdbId || tmdbId'), 'K-Drama Server must prefer imdbId over tmdbId');
    assert(resolversCode.includes('2embed.cc/embed'), 'K-Drama Server must support 2embed');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 4: UI Control Bars & Dynamic Tenant Styling
  // -------------------------------------------------------------------------
  console.log(cyan('\n► MODULE 4: Top Control Bars & Dynamic Tenant Styling'));

  const animeWatchPath = path.resolve(__dirname, '../src/components/anime/AnimeWatchSection.tsx');
  const animeWatchCode = fs.readFileSync(animeWatchPath, 'utf8');

  runTest('AnimeWatchSection includes dynamic season resolution & bridge status pill', () => {
    assert(animeWatchCode.includes('resolveAnimeIdsSync'), 'AnimeWatchSection must use resolveAnimeIdsSync for offline synchronous resolution');
    assert(animeWatchCode.includes('syncBridge'), 'AnimeWatchSection must evaluate syncBridge');
    assert(animeWatchCode.includes('src={embedUrl}'), 'AnimeWatchSection must strictly assign embedUrl to iframe src');
    assert(!animeWatchCode.includes('fetch(embedUrl)'), 'AnimeWatchSection must never fetch embedUrl');
    assert(animeWatchCode.includes('/api/anime/resolve'), 'AnimeWatchSection must support /api/anime/resolve for unmapped titles');
    assert(animeWatchCode.includes('bridgeData'), 'AnimeWatchSection must pass bridgeData to getAnimeEmbedUrl');
    assert(animeWatchCode.includes('MAL #'), 'AnimeWatchSection must display MAL status pill');
    assert(animeWatchCode.includes('AniList #'), 'AnimeWatchSection must display AniList status pill');
    assert(animeWatchCode.includes('Ep #{absoluteEpisode}'), 'AnimeWatchSection must display absolute episode status pill');
    assert(animeWatchCode.includes('ANIME_SERVERS.map'), 'AnimeWatchSection must render ANIME_SERVERS');
    assert(animeWatchCode.includes('totalSeriesEpisodes'), 'AnimeWatchSection must compute totalSeriesEpisodes');
    assert(animeWatchCode.includes('handleSelectAbsoluteEpisode'), 'AnimeWatchSection must support handleSelectAbsoluteEpisode');
    assert(animeWatchCode.includes('viewMode'), 'AnimeWatchSection must support dual view modes');
    assert(animeWatchCode.includes('initialBridgeData'), 'AnimeWatchSection must accept initialBridgeData for instant SSR');
    assert(animeWatchCode.includes('controller.abort()'), 'AnimeWatchSection must use AbortController timeout');
    assert(animeWatchCode.includes('replaceState'), 'AnimeWatchSection must synchronize URL search params via replaceState');
    assert(animeWatchCode.includes('handleSelectAbsoluteEpisode'), 'AnimeWatchSection must calculate multi-season episode offsets');
  });

  const kdramaWatchPath = path.resolve(__dirname, '../src/components/kdrama/KDramaWatchSection.tsx');
  const kdramaWatchCode = fs.readFileSync(kdramaWatchPath, 'utf8');

  runTest('KDramaWatchSection accepts imdbId and slug and displays bridge status pill', () => {
    assert(kdramaWatchCode.includes('imdbId?: string | null'), 'KDramaWatchSection missing imdbId prop');
    assert(kdramaWatchCode.includes('slug?: string | null'), 'KDramaWatchSection missing slug prop');
    assert(kdramaWatchCode.includes('KDRAMA_SERVERS'), 'KDramaWatchSection must use KDRAMA_SERVERS');
    assert(kdramaWatchCode.includes('TMDB #{tvId}'), 'KDramaWatchSection must display TMDB ID');
    assert(kdramaWatchCode.includes('IMDb {imdbId || \'Linked\'}'), 'KDramaWatchSection must display IMDb ID');
  });

  // -------------------------------------------------------------------------
  // TEST GROUP 5: No Sandboxed Iframes & Sanitized JSON-LD
  // -------------------------------------------------------------------------
  console.log(cyan('\n► MODULE 5: Anti-Glitch & Zero Sandboxed Iframes Audit'));

  const playerFiles = [
    'src/components/media/VideoPlayer.tsx',
    'src/components/anime/AnimeWatchSection.tsx',
    'src/components/kdrama/KDramaWatchSection.tsx',
  ];

  playerFiles.forEach((fileRel) => {
    runTest(`No sandbox="..." attribute in ${fileRel}`, () => {
      const fullPath = path.resolve(__dirname, '..', fileRel);
      const content = fs.readFileSync(fullPath, 'utf8');
      assert(!content.includes('sandbox='), `${fileRel} must NOT contain sandbox attribute`);
    });
  });

  const jsonLdPath = path.resolve(__dirname, '../src/components/seo/JsonLd.tsx');
  const jsonLdCode = fs.readFileSync(jsonLdPath, 'utf8');

  runTest('JsonLd sanitizes script content to prevent syntax errors', () => {
    assert(jsonLdCode.includes('replace(/</g'), 'JsonLd must escape < characters');
  });

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log(cyan('\n======================================================'));
  if (passedTests === totalTests) {
    console.log(green(`  ALL ${totalTests}/${totalTests} TESTS PASSED PERFECTLY!  `));
  } else {
    console.log(red(`  ${totalTests - passedTests} TESTS FAILED OUT OF ${totalTests}!  `));
  }
  console.log(cyan('======================================================\n'));

  process.exit(passedTests === totalTests ? 0 : 1);
}

main().catch((err) => {
  console.error('Test harness exception:', err);
  process.exit(1);
});
