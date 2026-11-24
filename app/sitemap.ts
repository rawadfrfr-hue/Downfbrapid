import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo-data';
import { getActiveLanguagesCached } from '@/lib/cms-store';

interface RouteTemplate {
  subPath: string;
  changeFrequency: 'daily' | 'monthly';
  priority: number;
}

const SITEMAP_ROUTES: RouteTemplate[] = [
  { subPath: '', changeFrequency: 'daily', priority: 1.0 },
  { subPath: '/facebook', changeFrequency: 'daily', priority: 0.9 },
  { subPath: '/youtube', changeFrequency: 'daily', priority: 0.9 },
  { subPath: '/youtube-transcript', changeFrequency: 'daily', priority: 0.9 },
  { subPath: '/instagram', changeFrequency: 'daily', priority: 0.9 },
  { subPath: '/tiktok', changeFrequency: 'daily', priority: 0.9 },
  { subPath: '/privacy-policy', changeFrequency: 'monthly', priority: 0.5 },
  { subPath: '/terms-of-service', changeFrequency: 'monthly', priority: 0.5 },
  { subPath: '/dmca', changeFrequency: 'monthly', priority: 0.5 },
];

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const activeLanguages = await getActiveLanguagesCached();
  const entries: MetadataRoute.Sitemap = [];
  const lastModified = new Date();

  for (const route of SITEMAP_ROUTES) {
    const languages: Record<string, string> = {};
    for (const lang of activeLanguages) {
      const prefix = lang.code === 'en' ? '' : `/${lang.code}`;
      languages[lang.hreflang] = `${SITE_URL}${prefix}${route.subPath}`;
    }
    languages['x-default'] = `${SITE_URL}${route.subPath}`;

    for (const lang of activeLanguages) {
      const prefix = lang.code === 'en' ? '' : `/${lang.code}`;
      entries.push({
        url: `${SITE_URL}${prefix}${route.subPath}`,
        lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: { languages },
      });
    }
  }

  return entries;
}
