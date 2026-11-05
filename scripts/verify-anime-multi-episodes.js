const http = require('http');

async function testUrl(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const iframes = [...html.matchAll(/<iframe[^>]*src=[\"']([^\"']*)[\"']/gi)].map(m => m[1]);
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    return {
      status: res.status,
      title: titleMatch ? titleMatch[1] : 'No Title',
      iframe: iframes[0] || 'No iframe',
      hasAdscore: html.includes('adsco.re'),
      hasLocalhost8080: html.includes('localhost:8080'),
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function runVerification() {
  console.log('=====================================================');
  console.log('🎥 COMPREHENSIVE ANIME MULTI-EPISODE TEST SUITE');
  console.log('=====================================================\n');

  const testPages = [
    { label: 'One Piece Ep 1096 (via S22 E8)', url: 'http://localhost:3002/watch/anime/37854?s=22&ep=8' },
    { label: 'One Piece Ep 1096 (via ?ep=1096)', url: 'http://localhost:3002/watch/anime/37854?ep=1096' },
    { label: 'One Piece Ep 1096 (via MAL ID 21)', url: 'http://localhost:3002/watch/anime/21?ep=1096' },
    { label: 'One Piece Ep 597 (S15 E17 Punk Hazard)', url: 'http://localhost:3002/watch/anime/37854?s=15&ep=17' },
    { label: 'One Piece Ep 460 (S13 E39 Marineford)', url: 'http://localhost:3002/watch/anime/37854?s=13&ep=39' },
    { label: 'One Piece Ep 1 (S1 E1 East Blue)', url: 'http://localhost:3002/watch/anime/37854?s=1&ep=1' },
    { label: 'Jujutsu Kaisen S2 E1 (Ep 25)', url: 'http://localhost:3002/watch/anime/95479?s=2&ep=1' },
    { label: 'Jujutsu Kaisen S1 E1', url: 'http://localhost:3002/watch/anime/95479?s=1&ep=1' },
    { label: 'Demon Slayer S4 E1 (Hashira Training)', url: 'http://localhost:3002/watch/anime/85937?s=4&ep=1' },
    { label: 'Demon Slayer S2 E1 (Entertainment District)', url: 'http://localhost:3002/watch/anime/85937?s=2&ep=1' },
    { label: 'Solo Leveling S1 Ep 12 (Finale)', url: 'http://localhost:3002/watch/anime/127532?s=1&ep=12' },
    { label: 'Attack on Titan S4 E1 (The Final Season)', url: 'http://localhost:3002/watch/anime/1429?s=4&ep=1' },
    { label: 'Attack on Titan S1 E1', url: 'http://localhost:3002/watch/anime/1429?s=1&ep=1' },
    { label: 'Bleach S1 Ep 366 (Thousand Year Prelude)', url: 'http://localhost:3002/watch/anime/30984?s=1&ep=366' },
    { label: 'Dan Da Dan S1 E1', url: 'http://localhost:3002/watch/anime/240411?s=1&ep=1' },
  ];

  let passed = 0;
  let failed = 0;

  for (const t of testPages) {
    const result = await testUrl(t.url);
    if (result.error) {
      console.log(`❌ ${t.label}: Failed to fetch (${result.error})`);
      failed++;
      continue;
    }

    const is200 = result.status === 200;
    const hasCleanIframe = result.iframe && (result.iframe.includes('framextv.xyz') || result.iframe.includes('framextv.cc'));
    const zeroTrackers = !result.hasAdscore && !result.hasLocalhost8080;

    if (is200 && hasCleanIframe && zeroTrackers) {
      console.log(`✅ [200 OK] ${t.label}`);
      console.log(`   Page Title : ${result.title.slice(0, 65)}...`);
      console.log(`   Iframe Src : ${result.iframe}\n`);
      passed++;
    } else {
      console.log(`⚠️ [ISSUE] ${t.label}`);
      console.log(`   Status: ${result.status}, Iframe: ${result.iframe}\n`);
      failed++;
    }
  }

  console.log('=====================================================');
  console.log(`📊 RESULTS: ${passed}/${testPages.length} tests passed successfully (${failed} failed)`);
  console.log('=====================================================');
}

runVerification();

