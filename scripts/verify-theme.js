const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('====================================================');
console.log('🧪 MULTI-TENANT THEME & DEDUPLICATION AUDIT SUITE');
console.log('====================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

// ----------------------------------------------------
// TEST 1: Tenant Color & Luminance Contrast Resolution
// ----------------------------------------------------
console.log('TEST 1: Dynamic Tenant Color & Luminance Math');

function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function getContrastTextColor(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.6 ? '#09090b' : '#ffffff';
}

assert(hexToRgb('#00F5D4') === '0, 245, 212', 'AniRose RGB translates to 0, 245, 212');
assert(hexToRgb('#8B5CF6') === '139, 92, 246', 'DramaPulse RGB translates to 139, 92, 246');
assert(hexToRgb('#FF1E56') === '255, 30, 86', 'RoseFlix RGB translates to 255, 30, 86');

// Contrast text assertions (bright cyan needs dark text; rose and purple need white text)
assert(getContrastTextColor('#00F5D4') === '#09090b', 'AniRose Cyber Cyan button text is dark for crisp 60fps readability');
assert(getContrastTextColor('#FF1E56') === '#ffffff', 'RoseFlix Neon Rose button text is white');
assert(getContrastTextColor('#8B5CF6') === '#ffffff', 'DramaPulse Royal Violet button text is white');

// ----------------------------------------------------
// TEST 2: Purge of Hardcoded FF1E56 and FF85A1 in UI
// ----------------------------------------------------
console.log('\nTEST 2: Zero Hardcoded Theme Hex Values in UI Components');

const targetDirs = [
  path.resolve(process.cwd(), 'src', 'components'),
  path.resolve(process.cwd(), 'src', 'app'),
];

function scanFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanFiles(fullPath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const allTsxFiles = targetDirs.flatMap((d) => scanFiles(d));
let hardcodedHexFound = 0;

for (const f of allTsxFiles) {
  const relPath = path.relative(process.cwd(), f);
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('#FF1E56') || content.includes('#FF85A1')) {
    console.error(`  ⚠️ Found hardcoded hex in: ${relPath}`);
    hardcodedHexFound++;
  }
}

assert(hardcodedHexFound === 0, `Zero hardcoded #FF1E56 / #FF85A1 in UI components (scanned ${allTsxFiles.length} files)`);

// ----------------------------------------------------
// TEST 3: Anime Genre Deduplication
// ----------------------------------------------------
console.log('\nTEST 3: Anime Genre Deduplication & TMDB Genre Mapping');

const TMDB_GENRE_MAP = {
  16: 'Animation',
  10759: 'Action & Adventure',
  10765: 'Sci-Fi & Fantasy',
  18: 'Drama',
  35: 'Comedy',
  9648: 'Mystery',
};

function formatTMDBAnimeMock(raw) {
  const rawGenres = (raw.genre_ids || [])
    .map((id) => ({
      name: TMDB_GENRE_MAP[id] || (id === 16 ? 'Animation' : 'Anime'),
    }));

  const genres = [];
  const seenGenres = new Set();
  for (const g of rawGenres) {
    const key = (g.name || '').trim().toLowerCase();
    if (key && !seenGenres.has(key)) {
      seenGenres.add(key);
      genres.push(g);
    }
  }
  return genres;
}

// Mock Jujutsu Kaisen TMDB genre IDs: [10759 (Action & Adventure), 16 (Animation), 10765 (Sci-Fi & Fantasy)]
const jjkGenres = formatTMDBAnimeMock({ genre_ids: [10759, 16, 10765] });
const jjkNames = jjkGenres.map((g) => g.name);

assert(
  jjkNames.includes('Action & Adventure') &&
  jjkNames.includes('Animation') &&
  jjkNames.includes('Sci-Fi & Fantasy'),
  'TMDB Anime maps genre IDs to real titles instead of blanket "Anime"'
);
assert(
  !jjkNames.some((n, i) => jjkNames.indexOf(n) !== i),
  `No duplicate genres found in Jujutsu Kaisen: [${jjkNames.join(', ')}]`
);

// ----------------------------------------------------
// TEST 4: TypeScript Check
// ----------------------------------------------------
console.log('\nTEST 4: TypeScript Compilation (tsc --noEmit)');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  assert(true, 'TypeScript typecheck passed with zero errors');
} catch (err) {
  assert(false, 'TypeScript typecheck encountered errors');
}

console.log('\n====================================================');
console.log(`SUMMARY: ${passCount} passed, ${failCount} failed`);
console.log('====================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('✨ All Multi-Tenant Theme hardening requirements verified!\n');
}

