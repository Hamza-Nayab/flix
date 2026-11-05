import { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/movies', '/tv', '/anime', '/kdramas', '/watch/*'],
        disallow: ['/api/', '/party/'],
      },
      {
        userAgent: 'Googlebot',
        allow: ['/', '/movies', '/tv', '/anime', '/kdramas', '/watch/*'],
        disallow: ['/api/', '/party/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
