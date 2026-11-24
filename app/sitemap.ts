import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo-data';

const LAST_MODIFIED = new Date('2026-11-23T00:00:00.000Z');

interface BilingualRouteEntry {
  enPath: string;
  bnPath: string;
  changeFrequency: 'daily' | 'monthly';
  priorityEn: number;
  priorityBn: number;
}

const SITEMAP_ROUTES: BilingualRouteEntry[] = [
  {
    enPath: '',
    bnPath: '/bn',
    changeFrequency: 'daily',
    priorityEn: 1.0,
    priorityBn: 1.0,
  },
  {
    enPath: '/facebook',
    bnPath: '/bn/facebook',
    changeFrequency: 'daily',
    priorityEn: 0.9,
    priorityBn: 0.9,
  },
  {
    enPath: '/youtube',
    bnPath: '/bn/youtube',
    changeFrequency: 'daily',
    priorityEn: 0.9,
    priorityBn: 0.9,
  },
  {
    enPath: '/youtube-transcript',
    bnPath: '/bn/youtube-transcript',
    changeFrequency: 'daily',
    priorityEn: 0.9,
    priorityBn: 0.9,
  },
  {
    enPath: '/instagram',
    bnPath: '/bn/instagram',
    changeFrequency: 'daily',
    priorityEn: 0.9,
    priorityBn: 0.9,
  },
  {
    enPath: '/tiktok',
    bnPath: '/bn/tiktok',
    changeFrequency: 'daily',
    priorityEn: 0.9,
    priorityBn: 0.9,
  },
  {
    enPath: '/privacy-policy',
    bnPath: '/bn/privacy-policy',
    changeFrequency: 'monthly',
    priorityEn: 0.5,
    priorityBn: 0.5,
  },
  {
    enPath: '/terms-of-service',
    bnPath: '/bn/terms-of-service',
    changeFrequency: 'monthly',
    priorityEn: 0.5,
    priorityBn: 0.5,
  },
  {
    enPath: '/dmca',
    bnPath: '/bn/dmca',
    changeFrequency: 'monthly',
    priorityEn: 0.5,
    priorityBn: 0.5,
  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of SITEMAP_ROUTES) {
    const enUrl = `${SITE_URL}${route.enPath}`;
    const bnUrl = `${SITE_URL}${route.bnPath}`;
    const languages = {
      en: enUrl,
      bn: bnUrl,
      'x-default': enUrl,
    };

    entries.push({
      url: enUrl,
      lastModified: LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priorityEn,
      alternates: { languages },
    });

    entries.push({
      url: bnUrl,
      lastModified: LAST_MODIFIED,
      changeFrequency: route.changeFrequency,
      priority: route.priorityBn,
      alternates: { languages },
    });
  }

  return entries;
}
