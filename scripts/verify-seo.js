#!/usr/bin/env node

/**
 * Multi-Domain SEO & Anti-Duplicate Content Verification Suite
 * Simulates Googlebot, Bingbot, and Discordbot crawlers.
 * Verifies Titles, Descriptions, Canonical URLs, Multi-Graph JSON-LD, FAQs, Robots, and Sitemaps.
 */

const http = require('http');

const PORT = process.env.PORT || 3002;
const BASE_URL = `http://localhost:${PORT}`;

const BOT_USER_AGENTS = {
  Googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  Bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  Discordbot: 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
};

async function fetchHtml(routePath, userAgent = BOT_USER_AGENTS.Googlebot, customHost = null) {
  const url = `${BASE_URL}${routePath}`;
  const start = Date.now();
  const headers = {
    'User-Agent': userAgent,
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  };
  if (customHost) {
    headers['x-forwarded-host'] = customHost;
    headers['Host'] = customHost;
  }

  try {
    const res = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    const duration = Date.now() - start;
    const text = await res.text();
    return {
      path: routePath,
      status: res.status,
      ok: res.ok,
      duration,
      html: text,
    };
  } catch (err) {
    return {
      path: routePath,
      status: 0,
      ok: false,
      duration: Date.now() - start,
      error: err.message,
      html: '',
    };
  }
}

function extractTagContent(html, regex) {
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

function extractAllJsonLd(html) {
  const regex = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const list = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      list.push(parsed);
    } catch (e) {
      list.push({ __parseError: e.message, raw: match[1] });
    }
  }
  return list;
}

async function runSeoAudit() {
  console.log(`\n======================================================`);
  console.log(`🔍 RUNNING MULTI-DOMAIN SEO & ANTI-DUPLICATE AUDIT`);
  console.log(`   Target Server: ${BASE_URL}`);
  console.log(`======================================================\n`);

  const auditResults = [];

  // -------------------------------------------------------------------------
  // 1. Multi-Bot Crawl Simulation on Key Watch Pages
  // -------------------------------------------------------------------------
  console.log(`--- [1/5] Simulating Search & Social Crawlers ---`);
  const testWatchRoutes = [
    { path: '/watch/anime/37854?ep=1096', name: 'One Piece Ep 1096 (Anime)' },
    { path: '/watch/anime/95479?s=1&ep=1', name: 'Jujutsu Kaisen S1 E1 (Anime)' },
    { path: '/watch/kdrama/93405?s=1&ep=1', name: 'Squid Game S1 E1 (K-Drama)' },
    { path: '/watch/movie/550', name: 'Fight Club (Movie)' },
    { path: '/watch/tv/93405?s=1&e=1', name: 'Squid Game TV (Series)' },
  ];

  for (const item of testWatchRoutes) {
    for (const [botName, botUa] of Object.entries(BOT_USER_AGENTS)) {
      const res = await fetchHtml(item.path, botUa);
      const pass = res.status === 200 && res.html.length > 5000;
      auditResults.push({
        module: 'Crawler SSR',
        target: `${item.name} [${botName}]`,
        status: res.status,
        duration: `${res.duration}ms`,
        pass,
      });
      console.log(`  ${pass ? '✅' : '❌'} [${res.status}] ${item.name} (${botName}) - ${res.duration}ms`);
    }
  }

  // -------------------------------------------------------------------------
  // 2. Title, Description, and Canonical URL Assertions
  // -------------------------------------------------------------------------
  console.log(`\n--- [2/5] Validating Title, Meta Description & Canonical Integrity ---`);
  for (const item of testWatchRoutes) {
    const res = await fetchHtml(item.path);
    const title = extractTagContent(res.html, /<title[^>]*>([^<]+)<\/title>/i);
    const description = extractTagContent(res.html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    const canonical = extractTagContent(res.html, /<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);

    const titleValid = title && title.length >= 30 && title.length <= 80 && !title.includes('undefined') && !title.includes('NaN');
    const descValid = description && description.length >= 80 && description.length <= 180 && !description.includes('undefined');
    const canonicalValid = canonical && canonical.startsWith('http') && !canonical.includes('undefined');

    const pass = Boolean(titleValid && descValid && canonicalValid);
    auditResults.push({
      module: 'Meta Tags',
      target: item.name,
      status: pass ? 200 : 500,
      duration: `${title?.length || 0}c / ${description?.length || 0}c`,
      pass,
    });

    console.log(`  ${pass ? '✅' : '❌'} ${item.name}`);
    console.log(`     Title (${title?.length} chars): "${title}"`);
    console.log(`     Desc  (${description?.length} chars): "${description?.slice(0, 75)}..."`);
    console.log(`     Canonical: ${canonical}`);
  }

  // -------------------------------------------------------------------------
  // 3. Multi-Graph JSON-LD & SSR FAQ Validation
  // -------------------------------------------------------------------------
  console.log(`\n--- [3/5] Validating Multi-Graph JSON-LD (@graph) & SSR FAQ Accordion ---`);
  for (const item of testWatchRoutes) {
    const res = await fetchHtml(item.path);
    const jsonLdBlocks = extractAllJsonLd(res.html);

    let hasVideoObject = false;
    let hasBreadcrumbs = false;
    let hasFaqPage = false;
    let zeroErrors = jsonLdBlocks.length > 0 && !jsonLdBlocks.some((b) => b.__parseError);

    for (const block of jsonLdBlocks) {
      const graph = block['@graph'] || [block];
      for (const entity of graph) {
        if (entity['@type'] === 'VideoObject') hasVideoObject = true;
        if (entity['@type'] === 'BreadcrumbList') hasBreadcrumbs = true;
        if (entity['@type'] === 'FAQPage') hasFaqPage = true;
      }
    }

    const hasSsrFaqMarkup = res.html.includes('Frequently Asked Questions') && res.html.includes('<details');
    const pass = zeroErrors && hasVideoObject && hasBreadcrumbs && hasFaqPage && hasSsrFaqMarkup;

    auditResults.push({
      module: 'JSON-LD & FAQs',
      target: item.name,
      status: pass ? 200 : 500,
      duration: `${jsonLdBlocks.length} blocks`,
      pass,
    });

    console.log(`  ${pass ? '✅' : '❌'} ${item.name}`);
    console.log(`     VideoObject: ${hasVideoObject ? '✅' : '❌'}, BreadcrumbList: ${hasBreadcrumbs ? '✅' : '❌'}, FAQPage: ${hasFaqPage ? '✅' : '❌'}, SSR Accordion: ${hasSsrFaqMarkup ? '✅' : '❌'}`);
  }

  // -------------------------------------------------------------------------
  // 4. Cross-Tenant Uniqueness Check (Zero Duplicate Content Penalty)
  // -------------------------------------------------------------------------
  console.log(`\n--- [4/5] Testing Live Cross-Tenant Permutation & Uniqueness ---`);

  const aniroseRes = await fetchHtml('/watch/anime/37854?ep=1096', BOT_USER_AGENTS.Googlebot, 'anirose.to');
  const dramapulseRes = await fetchHtml('/watch/anime/37854?ep=1096', BOT_USER_AGENTS.Googlebot, 'dramapulse.to');
  const roseflixRes = await fetchHtml('/watch/anime/37854?ep=1096', BOT_USER_AGENTS.Googlebot, 'roseflix.top');

  const aniroseTitle = extractTagContent(aniroseRes.html, /<title[^>]*>([^<]+)<\/title>/i);
  const dramapulseTitle = extractTagContent(dramapulseRes.html, /<title[^>]*>([^<]+)<\/title>/i);
  const roseflixTitle = extractTagContent(roseflixRes.html, /<title[^>]*>([^<]+)<\/title>/i);

  const titlesDistinct =
    aniroseTitle &&
    dramapulseTitle &&
    roseflixTitle &&
    aniroseTitle !== dramapulseTitle &&
    aniroseTitle !== roseflixTitle &&
    dramapulseTitle !== roseflixTitle;

  const aniroseDesc = extractTagContent(aniroseRes.html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const dramapulseDesc = extractTagContent(dramapulseRes.html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const roseflixDesc = extractTagContent(roseflixRes.html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);

  const descsDistinct =
    aniroseDesc &&
    dramapulseDesc &&
    roseflixDesc &&
    aniroseDesc !== dramapulseDesc &&
    aniroseDesc !== roseflixDesc &&
    dramapulseDesc !== roseflixDesc;

  const aniroseHasFaq = aniroseRes.html.includes('How can I stream') || aniroseRes.html.includes('AniRose');
  const dramapulseHasFaq = dramapulseRes.html.includes('DramaPulse') || dramapulseRes.html.includes('Asian');
  const roseflixHasFaq = roseflixRes.html.includes('RoseFlix') || roseflixRes.html.includes('1080p');

  const tenantPass = Boolean(titlesDistinct && descsDistinct && aniroseHasFaq && dramapulseHasFaq && roseflixHasFaq);
  auditResults.push({
    module: 'Multi-Tenant Uniqueness',
    target: 'AniRose vs DramaPulse vs RoseFlix',
    status: tenantPass ? 200 : 500,
    duration: '3 live hosts',
    pass: tenantPass,
  });

  console.log(`  ${titlesDistinct ? '✅' : '❌'} Titles 100% Distinct across tenants:`);
  console.log(`     AniRose   : "${aniroseTitle}"`);
  console.log(`     DramaPulse: "${dramapulseTitle}"`);
  console.log(`     RoseFlix  : "${roseflixTitle}"`);
  console.log(`  ${descsDistinct ? '✅' : '❌'} Meta Descriptions 100% Distinct across tenants:`);
  console.log(`     AniRose   : "${aniroseDesc?.slice(0, 65)}..."`);
  console.log(`     DramaPulse: "${dramapulseDesc?.slice(0, 65)}..."`);
  console.log(`     RoseFlix  : "${roseflixDesc?.slice(0, 65)}..."`);
  console.log(`  ${aniroseHasFaq && dramapulseHasFaq && roseflixHasFaq ? '✅' : '❌'} Dynamic Tenant FAQs verified across all 3 domains`);

  // -------------------------------------------------------------------------
  // 5. Robots.txt, Sitemap.xml & IndexNow Verification
  // -------------------------------------------------------------------------
  console.log(`\n--- [5/5] Auditing Robots.txt, Sitemap.xml & IndexNow API ---`);

  // Robots
  const robotsRes = await fetchHtml('/robots.txt');
  const hasGooglebot = robotsRes.html.includes('Googlebot');
  const hasBingbot = robotsRes.html.includes('Bingbot');
  const hasDiscordbot = robotsRes.html.includes('Discordbot');
  const hasSitemapDirective = robotsRes.html.includes('Sitemap:');
  const hasHostDirective = robotsRes.html.includes('Host:');
  const robotsPass = robotsRes.status === 200 && hasGooglebot && hasBingbot && hasDiscordbot && hasSitemapDirective && hasHostDirective;

  auditResults.push({
    module: 'Robots.txt',
    target: '/robots.txt (Multi-Bot & Host)',
    status: robotsRes.status,
    duration: `${robotsRes.duration}ms`,
    pass: robotsPass,
  });
  console.log(`  ${robotsPass ? '✅' : '❌'} /robots.txt: Multi-Bot directives, Sitemap & Host verified`);

  // Sitemap
  const sitemapRes = await fetchHtml('/sitemap.xml');
  const hasUrlset = sitemapRes.html.includes('<urlset') && sitemapRes.html.includes('<url>');
  const noBrokenPorts = !sitemapRes.html.includes(':8080');
  const sitemapPass = sitemapRes.status === 200 && hasUrlset && noBrokenPorts;

  auditResults.push({
    module: 'Sitemap.xml',
    target: '/sitemap.xml (Niche Priority)',
    status: sitemapRes.status,
    duration: `${sitemapRes.duration}ms`,
    pass: sitemapPass,
  });
  console.log(`  ${sitemapPass ? '✅' : '❌'} /sitemap.xml: Valid XML and zero broken port references`);

  // IndexNow Endpoint
  const indexNowRes = await fetch(`${BASE_URL}/api/seo/indexnow`);
  const indexNowData = await indexNowRes.json().catch(() => ({}));
  const indexNowPass = indexNowRes.status === 200 && indexNowData.success === true;

  auditResults.push({
    module: 'IndexNow API',
    target: '/api/seo/indexnow (Instant Ping)',
    status: indexNowRes.status,
    duration: `${indexNowData.urlCount || 0} urls`,
    pass: indexNowPass,
  });
  console.log(`  ${indexNowPass ? '✅' : '❌'} /api/seo/indexnow: Active and ready for instant search engine submission`);

  // Summary Table
  console.log(`\n======================================================`);
  console.log(`📊 FINAL SEO AUDIT RESULTS`);
  console.log(`======================================================`);
  console.table(auditResults);

  const allPassed = auditResults.every((r) => r.pass);
  if (allPassed) {
    console.log(`\n🎉 ALL MULTI-DOMAIN SEO CHECKS PASSED: Anti-duplicate architecture verified!\n`);
    process.exit(0);
  } else {
    console.error(`\n⚠️ SEO AUDIT FAILED: Some criteria did not meet standards.\n`);
    process.exit(1);
  }
}

runSeoAudit().catch((err) => {
  console.error('Fatal SEO verification failure:', err);
  process.exit(1);
});
