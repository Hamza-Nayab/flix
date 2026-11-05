export type PrimaryNiche = 'movies' | 'anime' | 'kdrama';
export type AdPhase = 'clean' | 'hybrid' | 'aggressive';
export type TenantId = 'anirose' | 'dramapulse' | 'roseflix';

export interface TenantSeoProfile {
  id: TenantId;
  name: string;
  siteName: string;
  domain: string;
  defaultUrl: string;
  niche: PrimaryNiche;
  primaryColor: string;
  primaryColorHex: string;
  primaryRgb: string;
  primaryContrastText: string;
  primaryGradientTo: string;
  tagline: string;
  keywords: string[];
  focusDescription: string;
}

export interface SiteConfig {
  NAME: string;
  SITE_NAME: string;
  SITE_URL: string;
  PRIMARY_COLOR: string;
  PRIMARY_COLOR_HEX: string;
  PRIMARY_RGB: string;
  PRIMARY_CONTRAST_TEXT: string;
  PRIMARY_GRADIENT_TO: string;
  PRIMARY_NICHE: PrimaryNiche;
  AD_PHASE: AdPhase;
  POPUNDER_COOLDOWN_MINUTES: number;
  TENANT_ID: TenantId;
}

export const TENANT_PROFILES: Record<TenantId, TenantSeoProfile> = {
  anirose: {
    id: 'anirose',
    name: 'AniRose',
    siteName: 'AniRose',
    domain: 'anirose.to',
    defaultUrl: 'https://anirose.to',
    niche: 'anime',
    primaryColor: '#00F5D4',
    primaryColorHex: '00F5D4',
    primaryRgb: '0, 245, 212',
    primaryContrastText: '#09090b',
    primaryGradientTo: '#00BB9C',
    tagline: 'Watch Anime Online in Full HD (English Sub & Dub)',
    keywords: [
      'watch anime online',
      'anime english sub and dub',
      'simulcast anime hd',
      'stream anime free',
      'anirose anime',
      '1080p anime stream',
      'myanimelist anime',
      'anilist episodes',
      'unlimited anime streaming',
    ],
    focusDescription:
      'Stream thousands of anime series, movies, and simulcasts in full 1080p HD with Japanese audio, English subtitles, and English dubbing on AniRose.',
  },
  dramapulse: {
    id: 'dramapulse',
    name: 'DramaPulse',
    siteName: 'DramaPulse',
    domain: 'dramapulse.to',
    defaultUrl: 'https://dramapulse.to',
    niche: 'kdrama',
    primaryColor: '#8B5CF6',
    primaryColorHex: '8B5CF6',
    primaryRgb: '139, 92, 246',
    primaryContrastText: '#FFFFFF',
    primaryGradientTo: '#6D28D9',
    tagline: 'Watch Korean & Asian Dramas Online with English Subtitles',
    keywords: [
      'watch kdrama online',
      'korean drama english sub',
      'asian drama streaming',
      'dramapulse kdrama',
      'tvn jtbc streaming',
      'k-drama full episodes',
      'korean series 1080p',
      'free kdrama streaming',
    ],
    focusDescription:
      'Watch popular Korean and Asian dramas online in 1080p Full HD with fast English subtitles, multi-server reliability, and zero buffering on DramaPulse.',
  },
  roseflix: {
    id: 'roseflix',
    name: 'RoseFlix',
    siteName: 'RoseFlix',
    domain: 'roseflix.top',
    defaultUrl: 'https://roseflix.top',
    niche: 'movies',
    primaryColor: '#FF1E56',
    primaryColorHex: 'FF1E56',
    primaryRgb: '255, 30, 86',
    primaryContrastText: '#FFFFFF',
    primaryGradientTo: '#D90429',
    tagline: 'Stream Full Movies & TV Series in 1080p HD',
    keywords: [
      'watch movies online',
      'stream full movies free',
      'watch tv series hd',
      'roseflix streaming',
      '1080p movies online',
      'cinema releases full hd',
      'free series streaming',
      'hollywood movies streaming',
    ],
    focusDescription:
      'Stream box-office movies, theatrical releases, and trending TV shows online in crisp 1080p HD with redundant servers and multi-language subtitles on RoseFlix.',
  },
};

export function hexToRgb(hex: string): string {
  const clean = hex.replace(/^#/, '');
  const bigint = parseInt(
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean,
    16
  );
  if (isNaN(bigint)) return '255, 30, 86';
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

export function getContrastTextColor(hex: string): string {
  const clean = hex.replace(/^#/, '');
  const bigint = parseInt(
    clean.length === 3
      ? clean.split('').map((c) => c + c).join('')
      : clean,
    16
  );
  if (isNaN(bigint)) return '#FFFFFF';
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#09090b' : '#FFFFFF';
}

export function getGradientToColor(hex: string): string {
  const clean = hex.replace(/^#/, '').toLowerCase();
  if (clean === '00f5d4') return '#00BB9C'; // Emerald Teal for AniRose
  if (clean === '8b5cf6') return '#6D28D9'; // Royal Violet for DramaPulse
  return '#D90429'; // Crimson for RoseFlix
}

export function detectTenantId(hostOrIdentifier?: string | null): TenantId {
  const target = (hostOrIdentifier || '').toLowerCase();
  if (target.includes('anirose') || target.includes('anime')) return 'anirose';
  if (target.includes('dramapulse') || target.includes('kdrama')) return 'dramapulse';
  if (target.includes('roseflix') || target.includes('movies') || target.includes('flix')) return 'roseflix';

  // Environment variables fallback
  const envName = (
    process.env.NEXT_PUBLIC_SITE_NAME ||
    process.env.NEXT_PUBLIC_SITE_ID ||
    ''
  ).toLowerCase();
  if (envName.includes('anirose')) return 'anirose';
  if (envName.includes('dramapulse')) return 'dramapulse';
  if (envName.includes('roseflix')) return 'roseflix';

  const envNiche = (process.env.NEXT_PUBLIC_PRIMARY_NICHE || '').toLowerCase();
  if (envNiche === 'anime') return 'anirose';
  if (envNiche === 'kdrama' || envNiche === 'kdramas') return 'dramapulse';

  return 'roseflix';
}

export function getTenantProfile(hostOrIdentifier?: string | null): TenantSeoProfile {
  const tenantId = detectTenantId(hostOrIdentifier);
  return TENANT_PROFILES[tenantId];
}

export function resolveActiveSiteUrl(requestHost?: string | null): string {
  if (requestHost) {
    const cleanHost = requestHost.split(':')[0].trim();
    if (cleanHost && cleanHost !== 'localhost' && cleanHost !== '127.0.0.1') {
      const protocol = requestHost.includes('localhost') ? 'http' : 'https';
      return `${protocol}://${requestHost.trim()}`.replace(/\/+$/, '');
    }
    if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
      return `http://${requestHost.trim()}`.replace(/\/+$/, '');
    }
  }

  if (process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/+$/, '');
  }
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.NEXT_PUBLIC_API_URL?.trim()) {
    return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  const tenant = detectTenantId(requestHost);
  return TENANT_PROFILES[tenant].defaultUrl;
}

function resolvePrimaryColor(): string {
  const envColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR?.replace(/['"]+/g, '').trim();
  if (envColor && envColor.startsWith('#')) {
    return envColor;
  }
  if (envColor && /^[0-9A-Fa-f]{3,6}$/.test(envColor)) {
    return `#${envColor}`;
  }

  const tenant = detectTenantId();
  return TENANT_PROFILES[tenant].primaryColor;
}

function resolveSiteName(): string {
  if (process.env.NEXT_PUBLIC_SITE_NAME?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_NAME.trim();
  }
  const tenant = detectTenantId();
  return TENANT_PROFILES[tenant].siteName;
}

function resolvePrimaryNiche(): PrimaryNiche {
  const tenant = detectTenantId();
  return TENANT_PROFILES[tenant].niche;
}

const primaryColor = resolvePrimaryColor();
const primaryHex = primaryColor.replace(/^#/, '');

export const SITE_CONFIG: SiteConfig = {
  NAME: resolveSiteName(),
  SITE_NAME: resolveSiteName(),
  SITE_URL: resolveActiveSiteUrl(),
  PRIMARY_COLOR: primaryColor,
  PRIMARY_COLOR_HEX: primaryHex,
  PRIMARY_RGB: hexToRgb(primaryColor),
  PRIMARY_CONTRAST_TEXT: getContrastTextColor(primaryColor),
  PRIMARY_GRADIENT_TO: getGradientToColor(primaryColor),
  PRIMARY_NICHE: resolvePrimaryNiche(),
  AD_PHASE: ((process.env.NEXT_PUBLIC_AD_PHASE as AdPhase) || 'clean'),
  POPUNDER_COOLDOWN_MINUTES: Number(process.env.NEXT_PUBLIC_POPUNDER_COOLDOWN_MINUTES || 30),
  TENANT_ID: detectTenantId(),
};
