import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  const allowedBots = [
    '*',
    'Googlebot',
    'Googlebot-Video',
    'Googlebot-Image',
    'Bingbot',
    'Slurp',
    'DuckDuckBot',
    'Yandex',
    'Baiduspider',
    'Applebot',
    'Discordbot',
    'TelegramBot',
    'Twitterbot',
    'facebookexternalhit',
    'OAI-SearchBot',
    'PerplexityBot',
  ];

  return {
    rules: allowedBots.map((bot) => ({
      userAgent: bot,
      allow: ['/', '/movies', '/tv', '/anime', '/kdramas', '/watch/*'],
      disallow: ['/api/', '/party/', '/_next/data/'],
    })),
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
