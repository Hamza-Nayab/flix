#!/usr/bin/env node

/**
 * End-to-End Production Readiness & Endpoint Verification Script
 * Validates Core Pages, Watch Routes, API Handlers, and Resolvers.
 */

const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3002;
const BASE_URL = `http://localhost:${PORT}`;

async function fetchRoute(routePath, options = {}) {
  const url = `${BASE_URL}${routePath}`;
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    const duration = Date.now() - start;
    const isJson = res.headers.get('content-type')?.includes('application/json');
    let data = null;
    let text = '';
    if (isJson) {
      data = await res.json();
    } else {
      text = await res.text();
    }
    return {
      path: routePath,
      status: res.status,
      ok: res.ok,
      duration,
      data,
      textLength: text.length,
      contentType: res.headers.get('content-type') || '',
    };
  } catch (err) {
    return {
      path: routePath,
      status: 0,
      ok: false,
      duration: Date.now() - start,
      error: err.message,
    };
  }
}

async function runAudit() {
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING FULL PRODUCTION READINESS AUDIT ON ${BASE_URL}`);
  console.log(`======================================================\n`);

  const results = [];

  // 1. Core Pages & Metadata
  const coreRoutes = [
    '/',
    '/movies',
    '/tv',
    '/anime',
    '/kdramas',
    '/search?q=one+piece',
    '/robots.txt',
    '/sitemap.xml',
  ];

  console.log(`--- [1/4] Auditing Core Pages & Metadata ---`);
  for (const p of coreRoutes) {
    const res = await fetchRoute(p);
    const pass = res.status === 200;
    results.push({ category: 'Core Page', target: p, status: res.status, duration: `${res.duration}ms`, pass });
    console.log(`  ${pass ? '✅' : '❌'} [${res.status}] ${p} (${res.duration}ms)`);
  }

  // 2. Watch Route Verification
  const watchRoutes = [
    '/watch/anime/37854?ep=1096', // One Piece
    '/watch/anime/95479?s=1&ep=1', // Jujutsu Kaisen
    '/watch/anime/85937?s=2&ep=1', // Demon Slayer S2
    '/watch/anime/65733?ep=1',    // Attack on Titan
    '/watch/movie/550',           // Fight Club
    '/watch/tv/93405?s=1&ep=1',   // Squid Game
    '/watch/kdrama/93405?s=1&ep=1', // Squid Game K-Drama
  ];

  console.log(`\n--- [2/4] Auditing Watch Streaming Routes ---`);
  for (const p of watchRoutes) {
    const res = await fetchRoute(p);
    const pass = res.status === 200;
    results.push({ category: 'Watch Route', target: p, status: res.status, duration: `${res.duration}ms`, pass });
    console.log(`  ${pass ? '✅' : '❌'} [${res.status}] ${p} (${res.duration}ms)`);
  }

  // 3. API Handlers & Upstream Resolvers
  const apiRoutes = [
    { path: '/api/health', method: 'GET' },
    { path: '/api/anime/21/1096/sub?fallback=true', method: 'GET' },
    { path: '/api/anime/metadata?id=37854&season=1', method: 'GET' },
    { path: '/api/anime/resolve?tmdbId=37854&season=1', method: 'GET' },
    { path: '/api/search?q=demon+slayer', method: 'GET' },
    { path: '/api/tv/93405/season/1', method: 'GET' },
  ];

  console.log(`\n--- [3/4] Auditing Internal API Routes ---`);
  let animeServerList = [];
  for (const item of apiRoutes) {
    const res = await fetchRoute(item.path, { method: item.method });
    const pass = res.status === 200 && res.data;
    if (item.path.includes('/api/anime/21/1096/sub') && res.data?.servers) {
      animeServerList = res.data.servers;
    }
    results.push({ category: 'API Route', target: item.path, status: res.status, duration: `${res.duration}ms`, pass });
    console.log(`  ${pass ? '✅' : '❌'} [${res.status}] ${item.path} (${res.duration}ms)`);
  }

  // Party Room API Test (POST /api/party)
  const partyCreate = await fetchRoute('/api/party', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: {
      media: {
        tmdbId: 37854,
        type: 'anime',
        title: 'One Piece',
        season: 1,
        episode: 1096,
      },
      hostName: 'AuditBot',
    },
  });
  const partyPass = partyCreate.status === 200 && partyCreate.data?.roomId;
  results.push({
    category: 'API Route',
    target: '/api/party (POST Create Room)',
    status: partyCreate.status,
    duration: `${partyCreate.duration}ms`,
    pass: Boolean(partyPass),
  });
  console.log(`  ${partyPass ? '✅' : '❌'} [${partyCreate.status}] /api/party (Room: ${partyCreate.data?.roomId || 'none'}) (${partyCreate.duration}ms)`);

  // 4. Resolvers Quality Assurance (Zero undefined / NaN in URLs)
  console.log(`\n--- [4/4] Auditing Resolvers Matrix & Fallback URLs ---`);
  let resolversValid = true;

  if (animeServerList.length > 0) {
    for (const s of animeServerList) {
      if (!s.url || s.url.includes('undefined') || s.url.includes('NaN') || s.url.includes('null')) {
        resolversValid = false;
        console.error(`  ❌ Server ${s.id} generated invalid URL: ${s.url}`);
      } else {
        console.log(`  ✅ Server [${s.id}] -> ${s.url.slice(0, 65)}...`);
      }
    }
  } else {
    resolversValid = false;
  }

  // Check static source code of resolvers for safety
  const resolversSource = fs.readFileSync(path.resolve(__dirname, '../src/lib/resolvers.ts'), 'utf8');
  const hasFrameXTV = resolversSource.includes('framextv.xyz');
  const hasVidLink = resolversSource.includes('vidlink.pro');
  const hasVidSrc = resolversSource.includes('vidsrc.to') || resolversSource.includes('vidsrc.cc');
  const sourceChecksPass = hasFrameXTV && hasVidLink && hasVidSrc;

  results.push({
    category: 'Resolvers',
    target: 'FrameXTV / VidLink / MultiEmbed Matrix',
    status: sourceChecksPass && resolversValid ? 200 : 500,
    duration: '0ms',
    pass: sourceChecksPass && resolversValid,
  });

  // Final Summary Table
  console.log(`\n======================================================`);
  console.log(`📊 FINAL PRODUCTION AUDIT RESULTS`);
  console.log(`======================================================`);
  console.table(results);

  const allPassed = results.every((r) => r.pass);
  if (allPassed) {
    console.log(`\n🎉 ALL CHECKS PASSED: Application is 100% production ready!\n`);
    process.exit(0);
  } else {
    console.error(`\n⚠️ AUDIT FAILED: Some routes did not return HTTP 200 OK.\n`);
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
