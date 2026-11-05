import { NextRequest, NextResponse } from 'next/server';
import { getSiteUrl } from '@/lib/seo';
import { detectTenantId, getTenantProfile } from '@/lib/siteConfig';

export const dynamic = 'force-dynamic';

interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

export async function GET(request: NextRequest) {
  return handleIndexNowSubmission(request);
}

export async function POST(request: NextRequest) {
  return handleIndexNowSubmission(request);
}

async function handleIndexNowSubmission(request: NextRequest) {
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const baseUrl = getSiteUrl(hostHeader);
  const host = new URL(baseUrl).host;

  const tenant = detectTenantId(host);
  const profile = getTenantProfile(tenant);

  const indexNowKey = process.env.INDEXNOW_KEY?.trim() || request.nextUrl.searchParams.get('key')?.trim();

  let customUrls: string[] = [];
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      if (Array.isArray(body.urls)) {
        customUrls = body.urls;
      }
    } catch {}
  }

  // Default to top canonical URLs if none provided
  const targetUrls =
    customUrls.length > 0
      ? customUrls.map((u) => (u.startsWith('http') ? u : `${baseUrl}${u}`))
      : [
          `${baseUrl}/`,
          `${baseUrl}/movies`,
          `${baseUrl}/tv`,
          `${baseUrl}/anime`,
          `${baseUrl}/kdramas`,
          `${baseUrl}/search`,
        ];

  if (!indexNowKey) {
    return NextResponse.json({
      success: true,
      message: 'IndexNow submission simulated. Configure INDEXNOW_KEY environment variable to ping Bing/Yandex indexers.',
      tenant: profile.id,
      host,
      urlCount: targetUrls.length,
      urls: targetUrls,
      pinged: false,
    });
  }

  const payload: IndexNowPayload = {
    host,
    key: indexNowKey,
    keyLocation: `${baseUrl}/${indexNowKey}.txt`,
    urlList: targetUrls,
  };

  try {
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      tenant: profile.id,
      host,
      urlCount: targetUrls.length,
      pinged: true,
      message: res.ok ? 'Successfully notified IndexNow search engines.' : 'IndexNow rejected request.',
    });
  } catch (error: any) {
    console.error('[IndexNow Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Failed to ping IndexNow API',
        host,
      },
      { status: 502 }
    );
  }
}
