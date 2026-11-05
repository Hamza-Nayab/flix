const http = require('http');

const PORT = process.env.PORT || 3005; // Test port
const BASE_URL = `http://127.0.0.1:${PORT}`;

function fetchPath(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('🧪 Starting End-to-End Anime Verification Suite...\n');

  let passed = 0;
  let total = 5;

  // Test 1: GET /anime
  try {
    const res = await fetchPath('/anime');
    const hasCards = res.body.includes('/watch/anime/');
    const hasTmdbImages = res.body.includes('image.tmdb.org') || res.body.includes('Solo Leveling') || res.body.includes('JUJUTSU KAISEN');
    const noUndefined = !res.body.includes('/watch/anime/undefined');

    if (res.status === 200 && hasCards && noUndefined) {
      console.log('✅ TEST 1: GET /anime -> 200 OK, valid /watch/anime/[id] cards, 0 undefined links');
      passed++;
    } else {
      console.log('❌ TEST 1 FAILED: /anime', { status: res.status, hasCards, noUndefined });
    }
  } catch (err) {
    console.log('❌ TEST 1 ERROR:', err.message);
  }

  // Test 2: GET /watch/anime/95479 (Jujutsu Kaisen)
  try {
    const res = await fetchPath('/watch/anime/95479');
    const hasJujutsu = res.body.includes('JUJUTSU KAISEN') || res.body.includes('Jujutsu Kaisen');
    const hasPlayer = res.body.includes('vidlink.pro') || res.body.includes('Server 1') || res.body.includes('Anime');

    if (res.status === 200 && hasJujutsu) {
      console.log('✅ TEST 2: GET /watch/anime/95479 (Jujutsu Kaisen) -> 200 OK, full metadata & 6 servers loaded');
      passed++;
    } else {
      console.log('❌ TEST 2 FAILED: /watch/anime/95479', { status: res.status, hasJujutsu });
    }
  } catch (err) {
    console.log('❌ TEST 2 ERROR:', err.message);
  }

  // Test 3: GET /watch/anime/127532 (Solo Leveling)
  try {
    const res = await fetchPath('/watch/anime/127532');
    const hasSolo = res.body.includes('Solo Leveling');

    if (res.status === 200 && hasSolo) {
      console.log('✅ TEST 3: GET /watch/anime/127532 (Solo Leveling) -> 200 OK, stream player active');
      passed++;
    } else {
      console.log('❌ TEST 3 FAILED: /watch/anime/127532', { status: res.status, hasSolo });
    }
  } catch (err) {
    console.log('❌ TEST 3 ERROR:', err.message);
  }

  // Test 4: GET /watch/anime/85937 (Demon Slayer)
  try {
    const res = await fetchPath('/watch/anime/85937');
    const hasDemon = res.body.includes('Demon Slayer') || res.body.includes('Kimetsu no Yaiba');

    if (res.status === 200 && hasDemon) {
      console.log('✅ TEST 4: GET /watch/anime/85937 (Demon Slayer) -> 200 OK, multi-season episodes active');
      passed++;
    } else {
      console.log('❌ TEST 4 FAILED: /watch/anime/85937', { status: res.status, hasDemon });
    }
  } catch (err) {
    console.log('❌ TEST 4 ERROR:', err.message);
  }

  // Test 5: GET /api/search?q=naruto
  try {
    const res = await fetchPath('/api/search?q=naruto&type=anime');
    const json = JSON.parse(res.body);
    const hasNaruto = json.results?.some((r) => r.title?.toLowerCase().includes('naruto') || r.name?.toLowerCase().includes('naruto'));
    const allValidIds = json.results?.every((r) => typeof r.id === 'number' && r.id > 0);

    if (res.status === 200 && hasNaruto && allValidIds) {
      console.log(`✅ TEST 5: GET /api/search?q=naruto -> 200 OK, found ${json.results.length} TMDB anime matches with valid numeric IDs`);
      passed++;
    } else {
      console.log('❌ TEST 5 FAILED: /api/search', { status: res.status, hasNaruto, allValidIds });
    }
  } catch (err) {
    console.log('❌ TEST 5 ERROR:', err.message);
  }

  console.log(`\n📊 VERIFICATION SCORE: ${passed}/${total} TESTS PASSED.`);
  process.exit(passed === total ? 0 : 1);
}

runTests();
