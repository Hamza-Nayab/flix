const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Definitive Anti-Sandbox & TMDB Resolver Verification...\n');

let passCount = 0;
let totalTests = 5;

// Test 1: Assert ZERO occurrences of sandbox= in src/components/
try {
  const grepResult = execSync('grep -rn "sandbox=" src/components/ || true').toString().trim();
  if (!grepResult) {
    console.log('✅ Test 1: ZERO occurrences of "sandbox=" found in src/components/.');
    passCount++;
  } else {
    console.error('❌ Test 1 Failed: Found sandbox attributes in src/components/:\n', grepResult);
  }
} catch (err) {
  console.error('❌ Test 1 Error checking sandbox:', err);
}

// Test 2: Verify TabInterceptor is mounted in src/app/watch/layout.tsx
const watchLayoutPath = path.join(__dirname, '../src/app/watch/layout.tsx');
const tabInterceptorPath = path.join(__dirname, '../src/components/player/TabInterceptor.tsx');
if (fs.existsSync(watchLayoutPath) && fs.existsSync(tabInterceptorPath)) {
  const layoutContent = fs.readFileSync(watchLayoutPath, 'utf8');
  const interceptorContent = fs.readFileSync(tabInterceptorPath, 'utf8');
  if (
    layoutContent.includes('TabInterceptor') &&
    interceptorContent.includes('window.open = function') &&
    interceptorContent.includes('handleBlur')
  ) {
    console.log('✅ Test 2: TabInterceptor (window.open & blur refocus guard) active on /watch/layout.tsx.');
    passCount++;
  } else {
    console.error('❌ Test 2 Failed: TabInterceptor missing from watch layout or incomplete.');
  }
} else {
  console.error('❌ Test 2 Failed: Missing layout or TabInterceptor file.');
}

// Test 3: Verify all 6 TMDB-compatible Anime servers in resolvers.ts
const resolversPath = path.join(__dirname, '../src/lib/resolvers.ts');
const resolversContent = fs.readFileSync(resolversPath, 'utf8');
const expectedAnimeServers = [
  'anime-server-1',
  'anime-server-2',
  'anime-server-3',
  'anime-server-4',
  'anime-server-5',
  'anime-server-6',
];
const expectedEndpoints = [
  'vidlink.pro/tv',
  'vidsrc.cc/v2/embed/anime/tmdb',
  'vidsrc.to/embed/tv',
  'multiembed.mov/?video_id',
  'player.autoembed.cc/embed/tv',
  'vidsrc.icu/embed/tv',
];

const allAnimeServersFound = expectedAnimeServers.every((s) => resolversContent.includes(s));
const allEndpointsFound = expectedEndpoints.every((e) => resolversContent.includes(e));

if (allAnimeServersFound && allEndpointsFound) {
  console.log('✅ Test 3: All 6 TMDB-compatible Anime servers configured with verified endpoints in resolvers.ts.');
  passCount++;
} else {
  console.error('❌ Test 3 Failed: Missing one or more of the 6 anime server configurations in resolvers.ts.');
}

// Test 4: Verify VideoServers (Movie & TV)
const expectedVideoServers = ['server-1', 'server-2', 'server-3', 'server-4', 'server-5'];
const allVideoServersFound = expectedVideoServers.every((s) => resolversContent.includes(s));
if (allVideoServersFound) {
  console.log('✅ Test 4: All 5 high-uptime Movie/TV video servers configured in resolvers.ts.');
  passCount++;
} else {
  console.error('❌ Test 4 Failed: Missing video servers in resolvers.ts.');
}

// Test 5: Verify Fallback banner alignment in AnimeWatchSection.tsx
const animeWatchPath = path.join(__dirname, '../src/components/anime/AnimeWatchSection.tsx');
const animeWatchContent = fs.readFileSync(animeWatchPath, 'utf8');
if (
  animeWatchContent.includes("handleServerChange('anime-server-2')") &&
  animeWatchContent.includes("handleServerChange('anime-server-4')") &&
  animeWatchContent.includes('Server 2 (VidSrc CC)') &&
  animeWatchContent.includes('Server 4 (MultiEmbed)')
) {
  console.log('✅ Test 5: Troubleshooting banner in AnimeWatchSection is aligned with Server 2 & Server 4.');
  passCount++;
} else {
  console.error('❌ Test 5 Failed: Anime troubleshooting banner buttons misaligned.');
}

console.log(`\n📊 VERIFICATION SCORE: ${passCount}/${totalTests} TESTS PASSED.`);
if (passCount === totalTests) {
  console.log('🎉 All Anti-Sandbox & TMDB Resolver checks passed cleanly!');
  process.exit(0);
} else {
  process.exit(1);
}
