export type PrimaryNiche = 'movies' | 'anime' | 'kdrama';
export type AdPhase = 'clean' | 'hybrid' | 'aggressive';

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
}

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
  if (clean === '00f5d4') return '#00BB9C'; // Deep Emerald Teal for AniRose
  if (clean === '8b5cf6') return '#6D28D9'; // Deep Royal Violet for DramaPulse
  return '#D90429'; // Deep Crimson for RoseFlix
}

function resolvePrimaryColor(): string {
  const envColor = process.env.NEXT_PUBLIC_PRIMARY_COLOR?.replace(/['"]+/g, '').trim();
  if (envColor && envColor.startsWith('#')) {
    return envColor;
  }
  if (envColor && /^[0-9A-Fa-f]{3,6}$/.test(envColor)) {
    return `#${envColor}`;
  }

  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || '').toLowerCase();
  const niche = (process.env.NEXT_PUBLIC_PRIMARY_NICHE || '').toLowerCase();

  if (siteName.includes('anirose') || niche === 'anime') {
    return '#00F5D4';
  }
  if (siteName.includes('dramapulse') || niche === 'kdrama' || niche === 'kdramas') {
    return '#8B5CF6';
  }
  return '#FF1E56';
}

function resolveSiteName(): string {
  if (process.env.NEXT_PUBLIC_SITE_NAME?.trim()) {
    return process.env.NEXT_PUBLIC_SITE_NAME.trim();
  }
  const niche = (process.env.NEXT_PUBLIC_PRIMARY_NICHE || '').toLowerCase();
  if (niche === 'anime') return 'AniRose';
  if (niche === 'kdrama' || niche === 'kdramas') return 'DramaPulse';
  return 'RoseFlix';
}

function resolvePrimaryNiche(): PrimaryNiche {
  const niche = (process.env.NEXT_PUBLIC_PRIMARY_NICHE || '').toLowerCase();
  if (niche === 'anime') return 'anime';
  if (niche === 'kdrama' || niche === 'kdramas') return 'kdrama';
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || '').toLowerCase();
  if (siteName.includes('anirose')) return 'anime';
  if (siteName.includes('dramapulse')) return 'kdrama';
  return 'movies';
}

const primaryColor = resolvePrimaryColor();
const primaryHex = primaryColor.replace(/^#/, '');

function resolveSiteUrl(): string {
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
  const niche = (process.env.NEXT_PUBLIC_PRIMARY_NICHE || '').toLowerCase();
  const siteName = (process.env.NEXT_PUBLIC_SITE_NAME || '').toLowerCase();
  if (siteName.includes('anirose') || niche === 'anime') return 'https://anirose.to';
  if (siteName.includes('dramapulse') || niche === 'kdrama' || niche === 'kdramas') return 'https://dramapulse.to';
  return 'https://roseflix.top';
}

export const SITE_CONFIG: SiteConfig = {
  NAME: resolveSiteName(),
  SITE_NAME: resolveSiteName(),
  SITE_URL: resolveSiteUrl(),
  PRIMARY_COLOR: primaryColor,
  PRIMARY_COLOR_HEX: primaryHex,
  PRIMARY_RGB: hexToRgb(primaryColor),
  PRIMARY_CONTRAST_TEXT: getContrastTextColor(primaryColor),
  PRIMARY_GRADIENT_TO: getGradientToColor(primaryColor),
  PRIMARY_NICHE: resolvePrimaryNiche(),
  AD_PHASE: ((process.env.NEXT_PUBLIC_AD_PHASE as AdPhase) || 'clean'),
  POPUNDER_COOLDOWN_MINUTES: Number(process.env.NEXT_PUBLIC_POPUNDER_COOLDOWN_MINUTES || 30),
};
