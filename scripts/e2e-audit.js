const http = require('http');

const BASE = 'http://localhost:3000';

const endpoints = [
  { name: 'Homepage (GET /)', path: '/', expectStatus: 200, checks: ['html', 'RoseFlix'] },
  { name: 'Movies Hub (GET /movies)', path: '/movies', expectStatus: 200, checks: ['html'] },
  { name: 'TV Hub (GET /tv)', path: '/tv', expectStatus: 200, checks: ['html'] },
  { name: 'Anime Hub (GET /anime)', path: '/anime', expectStatus: 200, checks: ['html'] },
  { name: 'K-Drama Hub (GET /kdramas)', path: '/kdramas', expectStatus: 200, checks: ['html'] },
  { name: 'Movie Watch (GET /watch/movie/550)', path: '/watch/movie/550', expectStatus: 200, checks: ['html', 'application/ld+json'] },
  { name: 'TV Watch (GET /watch/tv/1399)', path: '/watch/tv/1399', expectStatus: 200, checks: ['html'] },
  { name: 'Anime Watch (GET /watch/anime/52991)', path: '/watch/anime/52991', expectStatus: 200, checks: ['html'] },
  { name: 'K-Drama Watch (GET /watch/kdrama/93405)', path: '/watch/kdrama/93405', expectStatus: 200, checks: ['html'] },
  { name: 'Unified Search (GET /api/search?q=solo)', path: '/api/search?q=solo', expectStatus: 200, checks: ['results'] },
  { name: 'Sitemap (GET /sitemap.xml)', path: '/sitemap.xml', expectStatus: 200, checks: ['urlset'] },
  { name: 'Robots (GET /robots.txt)', path: '/robots.txt', expectStatus: 200, checks: ['User-Agent', 'Allow: /kdramas', 'Sitemap:'] },
];

async function run() {
  console.log('=====================================================');
  console.log('   🚀 RUNNING PRODUCTION RUNTIME E2E SMOKE TESTS     ');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE}${ep.path}`);
      const text = await res.text();
      const statusOk = res.status === ep.expectStatus;
      const contentOk = ep.checks.every(c => text.includes(c));

      if (statusOk && contentOk) {
        console.log(`[PASS] ${ep.name.padEnd(42)} -> HTTP ${res.status} (Verified content)`);
        passed++;
      } else {
        console.error(`[FAIL] ${ep.name.padEnd(42)} -> HTTP ${res.status} (Status OK: ${statusOk}, Content OK: ${contentOk})`);
        failed++;
      }
    } catch (err) {
      console.error(`[ERR ] ${ep.name.padEnd(42)} -> Error: ${err.message}`);
      failed++;
    }
  }

  // Test Watch Party API & SSE Stream
  try {
    console.log('\n--- Testing Watch Party Creation & SSE Stream ---');
    const createRes = await fetch(`${BASE}/api/party`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hostName: 'TestHost',
        media: {
          tmdbId: 93405,
          type: 'kdrama',
          title: 'Squid Game S1E1',
          season: 1,
          episode: 1,
        },
        server: 'vidlink',
      }),
    });

    const partyData = await createRes.json();
    if (createRes.ok && partyData.roomId && partyData.hostToken) {
      console.log(`[PASS] Create Party (POST /api/party)             -> HTTP 200 (Room: ${partyData.roomId})`);
      passed++;

      // Verify Party View
      const viewRes = await fetch(`${BASE}/api/party/${partyData.roomId}`);
      const viewData = await viewRes.json();
      if (viewRes.ok && viewData.roomId === partyData.roomId) {
        console.log(`[PASS] Party State (GET /api/party/[roomId])      -> HTTP 200 (Host: ${viewData.hostName})`);
        passed++;
      } else {
        console.error(`[FAIL] Party State (GET /api/party/[roomId])      -> HTTP ${viewRes.status}`);
        failed++;
      }

      // Verify SSE Stream Headers
      const streamRes = await fetch(`${BASE}/api/party/${partyData.roomId}/stream`, {
        headers: { Accept: 'text/event-stream' },
      });
      const contentType = streamRes.headers.get('content-type') || '';
      const cacheControl = streamRes.headers.get('cache-control') || '';
      if (streamRes.ok && contentType.includes('text/event-stream') && cacheControl.includes('no-cache')) {
        console.log(`[PASS] SSE Stream (GET /api/party/[roomId]/stream) -> HTTP 200 (${contentType}, ${cacheControl})`);
        passed++;
      } else {
        console.error(`[FAIL] SSE Stream headers: content-type=${contentType}, cache-control=${cacheControl}`);
        failed++;
      }
    } else {
      console.error(`[FAIL] Create Party failed: ${JSON.stringify(partyData)}`);
      failed++;
    }
  } catch (err) {
    console.error(`[ERR ] Watch Party Test Error: ${err.message}`);
    failed++;
  }

  console.log('\n=====================================================');
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

run();
