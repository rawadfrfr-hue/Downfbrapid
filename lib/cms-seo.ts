import type { Metadata } from 'next';
import {
  getActiveLanguagesCached,
  getGlobalSettingsCached,
  getPageContentCached,
} from './cms-store';
import type { CmsLanguageRecord, CmsPageContentRecord, CmsPageSlug } from './cms-types';
import { PLATFORMS, PagePlatform } from './platforms';
import { SITE_URL, OG_IMAGE_URL } from './seo-data';

function buildSlugPath(langCode: string, slug: CmsPageSlug): string {
  const base = slug === 'home' ? '' : `/${slug}`;
  if (langCode === 'en') {
    return base || '/';
  }
  return `/${langCode}${base}`;
}

export async function generateCmsPageMetadata(
  slug: CmsPageSlug,
  langCode: string
): Promise<Metadata> {
  const [content, activeLanguages, globalSettings] = await Promise.all([
    getPageContentCached(langCode, slug),
    getActiveLanguagesCached(),
    getGlobalSettingsCached(),
  ]);

  const currentPath = buildSlugPath(langCode, slug);
  const canonicalUrl = `${SITE_URL}${currentPath === '/' ? '/' : currentPath}`;

  const languages: Record<string, string> = {};
  for (const lang of activeLanguages) {
    const p = buildSlugPath(lang.code, slug);
    languages[lang.hreflang] = `${SITE_URL}${p === '/' ? '/' : p}`;
  }
  const defaultLang = activeLanguages.find((l) => l.isDefault) || activeLanguages[0];
  if (defaultLang) {
    const defPath = buildSlugPath(defaultLang.code, slug);
    languages['x-default'] = `${SITE_URL}${defPath === '/' ? '/' : defPath}`;
  } else {
    languages['x-default'] = `${SITE_URL}${buildSlugPath('en', slug)}`;
  }

  const ogImage = content.ogImageUrl?.trim() || globalSettings.defaultOgImage || OG_IMAGE_URL;
  const resolvedOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;
  const siteName = globalSettings.siteName || 'Save Vibe';
  const platformConfig =
    slug !== 'home' && slug !== 'youtube-transcript'
      ? PLATFORMS[slug as Exclude<PagePlatform, 'home'>]
      : null;

  return {
    title: {
      absolute: content.seoTitle,
    },
    description: content.seoDescription,
    keywords: content.seoKeywords,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    icons: platformConfig
      ? {
          icon: [
            { url: platformConfig.faviconPath, type: 'image/svg+xml' },
            { url: globalSettings.faviconUrl || '/favicons/search-logo-96.png' },
          ],
          shortcut: globalSettings.faviconUrl || '/favicon.ico',
          apple: '/favicons/apple-touch-icon.png',
        }
      : {
          icon: [
            { url: globalSettings.logoUrl || '/favicons/search-logo-96.png', sizes: '96x96', type: 'image/png' },
            { url: '/favicons/search-logo-192.png', sizes: '192x192', type: 'image/png' },
          ],
          shortcut: globalSettings.faviconUrl || '/favicon.ico',
          apple: '/favicons/apple-touch-icon.png',
        },
    openGraph: {
      title: content.ogTitle || content.seoTitle,
      description: content.ogDescription || content.seoDescription,
      url: canonicalUrl,
      siteName,
      type: 'website',
      locale: langCode,
      images: [
        {
          url: resolvedOgImage,
          width: 1200,
          height: 630,
          alt: content.ogTitle || content.seoTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: content.ogTitle || content.seoTitle,
      description: content.ogDescription || content.seoDescription,
      images: [resolvedOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function buildCmsJsonLdSchemas(
  content: CmsPageContentRecord,
  siteName: string = 'Save Vibe'
) {
  const pagePath = buildSlugPath(content.languageCode, content.pageSlug);
  const pageUrl = `${SITE_URL}${pagePath}`;
  const homePath = buildSlugPath(content.languageCode, 'home');
  const homeUrl = `${SITE_URL}${homePath}`;

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: siteName,
    description: content.seoDescription,
    inLanguage: content.languageCode,
  };

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: content.seoTitle,
    description: content.seoDescription,
    inLanguage: content.languageCode,
    isPartOf: { '@id': `${SITE_URL}/#website` },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement:
      content.pageSlug === 'home'
        ? [
            {
              '@type': 'ListItem',
              position: 1,
              name: siteName,
              item: homeUrl,
            },
          ]
        : [
            {
              '@type': 'ListItem',
              position: 1,
              name: siteName,
              item: homeUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: content.heroTitle,
              item: pageUrl,
            },
          ],
  };

  const faqSchema =
    content.faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          inLanguage: content.languageCode,
          mainEntity: content.faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  const howToSchema =
    content.howToSteps.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          inLanguage: content.languageCode,
          name: content.heroTitle,
          description: content.seoDescription,
          step: content.howToSteps.map((step, idx) => ({
            '@type': 'HowToStep',
            position: idx + 1,
            name: step.title,
            text: step.description,
          })),
        }
      : null;

  return [websiteSchema, webPageSchema, breadcrumbSchema, faqSchema, howToSchema].filter(Boolean);
}

export async function getPublicPageBootstrap(langCode: string, slug: CmsPageSlug): Promise<{
  content: CmsPageContentRecord;
  activeLanguages: CmsLanguageRecord[];
  siteName: string;
  logoUrl: string;
}> {
  const [content, activeLanguages, globalSettings] = await Promise.all([
    getPageContentCached(langCode, slug),
    getActiveLanguagesCached(),
    getGlobalSettingsCached(),
  ]);
  return {
    content,
    activeLanguages,
    siteName: globalSettings.siteName || 'Save Vibe',
    logoUrl: globalSettings.logoUrl || '/favicons/search-logo-96.png',
  };
}
