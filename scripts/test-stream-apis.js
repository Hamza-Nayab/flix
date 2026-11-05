/**
 * Diagnostic Live Endpoint Reachability Test Script
 * Tests streaming provider embed URLs for One Piece (Ep 460, Ep 1, Ep 1097, Season 5, Season 6).
 */

const https = require('https');
const http = require('http');

const testCases = [
  // User specified tests for Episode 460 (S13 E39)
  { name: 'VidLink Anime (MAL 21 Ep 460)', url: 'https://vidlink.pro/anime/21/460/sub?fallback=true' },
  { name: 'VidLink TV (TMDB 37854 S13 E39)', url: 'https://vidlink.pro/tv/37854/13/39' },
  { name: 'VidSrc CC Anime (AniList 21 Ep 460)', url: 'https://vidsrc.cc/v2/embed/anime/ani21/460/sub' },
  { name: 'VidSrc CC Anime (TMDB 37854 S13 E39)', url: 'https://vidsrc.cc/v2/embed/anime/tmdb37854/13/39/sub' },
  { name: 'VidSrc To TV (TMDB 37854 S13 E39)', url: 'https://vidsrc.to/embed/tv/37854/13/39' },
  { name: 'Embed.su TV (TMDB 37854 S13 E39)', url: 'https://embed.su/embed/tv/37854/13/39' },
  { name: 'AutoEmbed Co TV (TMDB 37854 S13 E39)', url: 'https://autoembed.co/tv/tmdb/37854-13-39' },
  { name: 'AutoEmbed CC Player (TMDB 37854 S13 E39)', url: 'https://player.autoembed.cc/embed/tv/37854/13/39' },
  { name: '2Embed Anime Slug (One Piece Ep 460)', url: 'https://www.2embed.cc/embedanime/one-piece-episode-460' },
  { name: '2Embed TV (TMDB 37854 S13 E39)', url: 'https://www.2embed.cc/embedtv/37854&s=13&e=39' },
  { name: 'MultiEmbed Mov (TMDB 37854 S13 E39)', url: 'https://multiembed.mov/?video_id=37854&tmdb=1&s=13&e=39' },

  // Season 5 (S5 E1 = Absolute Ep 131)
  { name: 'VidLink Anime (Season 5 - Ep 131)', url: 'https://vidlink.pro/anime/21/131/sub?fallback=true' },
  { name: 'VidLink TV (Season 5 - S5 E1)', url: 'https://vidlink.pro/tv/37854/5/1' },
  { name: 'VidSrc CC Anime (Season 5 - Ep 131)', url: 'https://vidsrc.cc/v2/embed/anime/ani21/131/sub' },
  { name: 'VidSrc To TV (Season 5 - S5 E1)', url: 'https://vidsrc.to/embed/tv/37854/5/1' },
  { name: 'AutoEmbed Co TV (Season 5 - S5 E1)', url: 'https://autoembed.co/tv/tmdb/37854-5-1' },
  { name: '2Embed Anime Slug (Season 5 - Ep 131)', url: 'https://www.2embed.cc/embedanime/one-piece-episode-131' },
  { name: '2Embed TV (Season 5 - S5 E1)', url: 'https://www.2embed.cc/embedtv/37854&s=5&e=1' },
  { name: 'MultiEmbed Mov (Season 5 - S5 E1)', url: 'https://multiembed.mov/?video_id=37854&tmdb=1&s=5&e=1' },

  // Season 6 (S6 E1 = Absolute Ep 144)
  { name: 'VidLink Anime (Season 6 - Ep 144)', url: 'https://vidlink.pro/anime/21/144/sub?fallback=true' },
  { name: 'VidLink TV (Season 6 - S6 E1)', url: 'https://vidlink.pro/tv/37854/6/1' },
  { name: 'VidSrc CC Anime (Season 6 - Ep 144)', url: 'https://vidsrc.cc/v2/embed/anime/ani21/144/sub' },
  { name: 'VidSrc To TV (Season 6 - S6 E1)', url: 'https://vidsrc.to/embed/tv/37854/6/1' },
  { name: 'AutoEmbed Co TV (Season 6 - S6 E1)', url: 'https://autoembed.co/tv/tmdb/37854-6-1' },
  { name: '2Embed Anime Slug (Season 6 - Ep 144)', url: 'https://www.2embed.cc/embedanime/one-piece-episode-144' },
  { name: '2Embed TV (Season 6 - S6 E1)', url: 'https://www.2embed.cc/embedtv/37854&s=6&e=1' },
  { name: 'MultiEmbed Mov (Season 6 - S6 E1)', url: 'https://multiembed.mov/?video_id=37854&tmdb=1&s=6&e=1' },

  // Episode 1 (S1 E1)
  { name: 'VidLink Anime (Ep 1)', url: 'https://vidlink.pro/anime/21/1/sub?fallback=true' },
  { name: 'VidSrc To TV (Ep 1 - S1 E1)', url: 'https://vidsrc.to/embed/tv/37854/1/1' },
  { name: 'MultiEmbed Mov (Ep 1 - S1 E1)', url: 'https://multiembed.mov/?video_id=37854&tmdb=1&s=1&e=1' },

  // Episode 1097 (S22 E9 = Absolute Ep 1097)
  { name: 'VidLink Anime (Ep 1097)', url: 'https://vidlink.pro/anime/21/1097/sub?fallback=true' },
  { name: 'VidSrc To TV (Ep 1097 - S22 E9)', url: 'https://vidsrc.to/embed/tv/37854/22/9' },
  { name: 'MultiEmbed Mov (Ep 1097 - S22 E9)', url: 'https://multiembed.mov/?video_id=37854&tmdb=1&s=22&e=9' },

  // Episode 597 (S15 E17 = Absolute Ep 597)
  { name: 'VidLink Anime (MAL 21 Ep 597)', url: 'https://vidlink.pro/anime/21/597/sub?fallback=true' },
  { name: 'VidLink TV (TMDB 37854 S15 E17)', url: 'https://vidlink.pro/tv/37854/15/17' },
  { name: 'VidSrc To TV (TMDB 37854 S15 E17)', url: 'https://vidsrc.to/embed/tv/37854/15/17' },
  { name: 'MultiEmbed Mov (TMDB 37854 S15 E17)', url: 'https://multiembed.mov/?video_id=37854&tmdb=1&s=15&e=17' },
  { name: '2Embed TV (TMDB 37854 S15 E17)', url: 'https://www.2embed.cc/embedtv/37854&s=15&e=17' },
];

async function checkUrl(test) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(test.url);
      const req = https.get(
        urlObj,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            Referer: 'https://google.com',
          },
          timeout: 6000,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => {
            if (data.length < 500) data += chunk.toString();
          });
          res.on('end', () => {
            const redirectLocation = res.headers.location || null;
            const isNoInput = data.includes('No input file specified');
            const isCfChallenge = data.includes('Cloudflare') && data.includes('Attention Required');
            resolve({
              name: test.name,
              url: test.url,
              status: res.statusCode,
              redirect: redirectLocation,
              isNoInput,
              isCfChallenge,
              sample: data.slice(0, 100).replace(/\s+/g, ' ').trim(),
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        resolve({ name: test.name, url: test.url, status: 'TIMEOUT', error: 'Connection timed out' });
      });

      req.on('error', (err) => {
        resolve({ name: test.name, url: test.url, status: 'ERROR', error: err.message });
      });
    } catch (err) {
      resolve({ name: test.name, url: test.url, status: 'ERR', error: err.message });
    }
  });
}

async function run() {
  console.log('======================================================================');
  console.log('   STREAMING PROVIDER LIVE ENDPOINT REACHABILITY AUDIT               ');
  console.log('======================================================================\n');

  const results = [];
  for (const test of testCases) {
    const res = await checkUrl(test);
    results.push(res);

    let statusDisplay = `${res.status}`;
    if (res.status === 200) {
      if (res.isNoInput) {
        statusDisplay = '❌ 200 (NO INPUT FILE SPECIFIED)';
      } else if (res.isCfChallenge) {
        statusDisplay = '⚠️  200 (Cloudflare Screen)';
      } else {
        statusDisplay = '✅ 200 OK';
      }
    } else if (res.status === 301 || res.status === 302) {
      statusDisplay = `🔄 ${res.status} Redirect -> ${res.redirect || ''}`;
    } else if (res.status === 404) {
      statusDisplay = '❌ 404 NOT FOUND';
    } else {
      statusDisplay = `⚠️  ${res.status} (${res.error || ''})`;
    }

    console.log(`[${statusDisplay}] ${res.name}`);
    console.log(`   URL: ${res.url}`);
    if (res.sample && !res.isCfChallenge) {
      console.log(`   Sample: "${res.sample}"`);
    }
    console.log('');
  }

  console.log('\n======================================================================');
  console.log('   SUMMARY OF WORKING VS DEAD PROVIDERS                               ');
  console.log('======================================================================');

  const working = results.filter((r) => (r.status === 200 && !r.isNoInput) || r.status === 301 || r.status === 302);
  const dead = results.filter((r) => r.isNoInput || r.status === 404 || r.status === 'TIMEOUT' || r.status === 'ERROR');

  console.log(`\n✅ Working Endpoints (${working.length}):`);
  working.forEach((w) => console.log(`  - ${w.name}: ${w.status}`));

  console.log(`\n❌ Dead / Failing Endpoints (${dead.length}):`);
  dead.forEach((d) => console.log(`  - ${d.name}: ${d.status} (${d.error || (d.isNoInput ? 'No input file specified' : '')})`));
}

run();

