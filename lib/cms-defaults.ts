import {
  CmsGlobalSettingsRecord,
  CmsLanguageRecord,
  CmsPageContentRecord,
  CmsPageSlug,
  CmsPlatformConfigRecord,
  PAGE_SLUGS,
  PLATFORM_KEYS,
} from './cms-types';
import { HOME_PLATFORM_CONFIG, PLATFORMS, PagePlatform } from './platforms';
import { BN_PLATFORM_COPY } from './platforms-bn';
import { OG_IMAGE_URL, SEO_DATA, SITE_URL, TRANSCRIPT_SEO } from './seo-data';
import { getBnSeoData, getBnTranscriptSeo } from './seo-data-bn';

export function buildDefaultLanguages(): CmsLanguageRecord[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'lang-en',
      code: 'en',
      name: 'English',
      nativeName: 'English',
      hreflang: 'en',
      direction: 'ltr',
      isDefault: true,
      isActive: true,
      sortOrder: 0,
      updatedAt: now,
    },
    {
      id: 'lang-bn',
      code: 'bn',
      name: 'Bengali',
      nativeName: 'বাংলা',
      hreflang: 'bn',
      direction: 'ltr',
      isDefault: false,
      isActive: true,
      sortOrder: 1,
      updatedAt: now,
    },
  ];
}

export function buildDefaultPageContent(
  languageCode: string,
  pageSlug: CmsPageSlug
): CmsPageContentRecord {
  const now = new Date().toISOString();
  const bnSeoMap = getBnSeoData(SITE_URL);
  const bnTranscript = getBnTranscriptSeo(SITE_URL);

  if (pageSlug === 'youtube-transcript') {
    const isBn = languageCode === 'bn';
    const base = isBn ? bnTranscript : TRANSCRIPT_SEO;
    return {
      id: `content-${languageCode}-${pageSlug}`,
      languageCode,
      pageSlug,
      heroTitle: isBn
        ? 'ইউটিউব ভিডিও ট্রান্সক্রিপ্ট ও সাবটাইটেল ডাউনলোডার'
        : 'YouTube Transcript & Subtitle Downloader',
      heroSubtitle: isBn
        ? 'যেকোনো পাবলিক ইউটিউব ভিডিও বা শর্টস থেকে টাইমস্ট্যাম্পসহ ট্রান্সক্রিপ্ট বের করুন, ৪০+ ভাষায় অনুবাদ করুন এবং TXT, SRT, VTT, PDF বা CSV ফরম্যাটে সেভ করুন।'
        : 'Extract time-synced transcripts from any public YouTube video or Short, translate into 40+ languages, and export as TXT, SRT, VTT, PDF, or CSV.',
      placeholder: isBn
        ? 'ইউটিউব ভিডিও বা শর্টস লিংক এখানে পেস্ট করুন...'
        : 'Paste YouTube video or Shorts URL here...',
      featuresSubtitle: base.description,
      features: [],
      guideBadge: isBn ? 'ইউটিউব ট্রান্সক্রিপ্ট টুল' : 'YouTube Transcript Extractor',
      guideTitle: base.title,
      guideParagraphs: [],
      supportedFormats: ['TXT', 'SRT', 'VTT', 'PDF', 'CSV'],
      howToSteps: base.howToSteps,
      faqs: base.faqs,
      seoTitle: base.title,
      seoDescription: base.description,
      seoKeywords: isBn
        ? bnTranscript.keywords
        : ['YouTube transcript downloader', 'YouTube subtitle extractor', 'SRT VTT TXT export'],
      ogTitle: base.ogTitle,
      ogDescription: base.ogDescription,
      ogImageUrl: OG_IMAGE_URL,
      updatedAt: now,
    };
  }

  const platformKey = pageSlug as PagePlatform;
  const enPlatform =
    platformKey === 'home' ? HOME_PLATFORM_CONFIG : PLATFORMS[platformKey] || HOME_PLATFORM_CONFIG;
  const isBn = languageCode === 'bn';
  const seoSource = isBn
    ? bnSeoMap[platformKey] || bnSeoMap.home
    : SEO_DATA[platformKey] || SEO_DATA.home;
  const bnCopy = BN_PLATFORM_COPY[platformKey] || BN_PLATFORM_COPY.home;

  return {
    id: `content-${languageCode}-${pageSlug}`,
    languageCode,
    pageSlug,
    heroTitle: isBn ? bnCopy.heroTitle : enPlatform.heroTitle,
    heroSubtitle: isBn ? bnCopy.heroSubtitle : enPlatform.heroSubtitle,
    placeholder: isBn ? bnCopy.placeholder : enPlatform.placeholder,
    featuresSubtitle: seoSource.featuresSubtitle,
    features: seoSource.features.map((f) => ({ ...f })),
    guideBadge: seoSource.guideBadge,
    guideTitle: seoSource.guideTitle,
    guideParagraphs: [...seoSource.guideParagraphs],
    supportedFormats: [...seoSource.supportedFormats],
    howToSteps: seoSource.howToSteps.map((s) => ({ ...s })),
    faqs: seoSource.faqs.map((f) => ({ ...f })),
    seoTitle: seoSource.title,
    seoDescription: seoSource.description,
    seoKeywords: [...seoSource.keywords],
    ogTitle: seoSource.ogTitle,
    ogDescription: seoSource.ogDescription,
    ogImageUrl: OG_IMAGE_URL,
    updatedAt: now,
  };
}

export function buildAllDefaultContents(): CmsPageContentRecord[] {
  const list: CmsPageContentRecord[] = [];
  for (const lang of ['en', 'bn']) {
    for (const slug of PAGE_SLUGS) {
      list.push(buildDefaultPageContent(lang, slug));
    }
  }
  return list;
}

export function buildDefaultPlatformConfigs(): CmsPlatformConfigRecord[] {
  const now = new Date().toISOString();
  return PLATFORM_KEYS.map((platform) => ({
    platform,
    isEnabled: true,
    cookies: '',
    hasCookies: false,
    proxyUrl: '',
    userAgent: '',
    statusNote: '',
    updatedAt: now,
  }));
}

export function buildDefaultGlobalSettings(): CmsGlobalSettingsRecord {
  return {
    siteName: 'Save Vibe',
    logoUrl: '/favicons/search-logo-96.png',
    faviconUrl: '/favicon.ico',
    defaultOgImage: OG_IMAGE_URL,
    headScripts: '',
    bodyScripts: '',
    maintenanceMode: false,
    maintenanceMessage:
      'Save Vibe is currently undergoing scheduled maintenance for faster downloads. Please check back in a few minutes.',
    updatedAt: new Date().toISOString(),
  };
}
