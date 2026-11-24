import { z } from 'zod';

export const PAGE_SLUGS = [
  'home',
  'facebook',
  'youtube',
  'instagram',
  'tiktok',
  'youtube-transcript',
] as const;

export type CmsPageSlug = (typeof PAGE_SLUGS)[number];

export const PLATFORM_KEYS = ['facebook', 'youtube', 'instagram', 'tiktok'] as const;
export type CmsPlatformKey = (typeof PLATFORM_KEYS)[number];

export interface CmsFeatureItem {
  title: string;
  description: string;
}

export interface CmsHowToStep {
  title: string;
  description: string;
}

export interface CmsFaqItem {
  question: string;
  answer: string;
}

export interface CmsLanguageRecord {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  hreflang: string;
  direction: 'ltr' | 'rtl';
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
}

export interface CmsPageContentRecord {
  id: string;
  languageCode: string;
  pageSlug: CmsPageSlug;
  heroTitle: string;
  heroSubtitle: string;
  placeholder: string;
  featuresSubtitle: string;
  features: CmsFeatureItem[];
  guideBadge: string;
  guideTitle: string;
  guideParagraphs: string[];
  supportedFormats: string[];
  howToSteps: CmsHowToStep[];
  faqs: CmsFaqItem[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImageUrl: string;
  updatedAt: string;
}

export interface CmsDownloadLogRecord {
  id: string;
  platform: CmsPlatformKey;
  videoUrl: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage: string | null;
  errorCode: string | null;
  quality: string | null;
  locale: string;
  createdAt: string;
}

export interface CmsPlatformConfigRecord {
  platform: CmsPlatformKey;
  isEnabled: boolean;
  cookies: string;
  hasCookies?: boolean;
  proxyUrl: string;
  userAgent: string;
  statusNote: string;
  updatedAt: string;
}

export interface CmsGlobalSettingsRecord {
  siteName: string;
  logoUrl: string;
  faviconUrl: string;
  defaultOgImage: string;
  headScripts: string;
  bodyScripts: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  updatedAt: string;
}

export interface DashboardMetricsResponse {
  todayDownloads: number;
  totalDownloads: number;
  todayFailed: number;
  totalFailed: number;
  successRate: number;
  platformBreakdown: Array<{
    platform: CmsPlatformKey;
    label: string;
    total: number;
    today: number;
    success: number;
    failed: number;
    isEnabled: boolean;
  }>;
  failedLogs: CmsDownloadLogRecord[];
  recentLogs: CmsDownloadLogRecord[];
}

export const languageCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}(-[a-z]{2,4})?$/, 'Use a valid ISO code like en, bn, id, es, or pt-br'),
  name: z.string().trim().min(1).max(60),
  nativeName: z.string().trim().min(1).max(60),
  hreflang: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}(-[a-z]{2,4})?$/, 'Use a valid hreflang code'),
  direction: z.enum(['ltr', 'rtl']).default('ltr'),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(999).default(10),
});

export const languageUpdateSchema = z.object({
  code: z.string().trim().toLowerCase().min(2).max(12),
  name: z.string().trim().min(1).max(60).optional(),
  nativeName: z.string().trim().min(1).max(60).optional(),
  hreflang: z.string().trim().toLowerCase().min(2).max(12).optional(),
  direction: z.enum(['ltr', 'rtl']).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const pageContentSaveSchema = z.object({
  languageCode: z.string().trim().toLowerCase().min(2).max(12),
  pageSlug: z.enum(PAGE_SLUGS),
  heroTitle: z.string().trim().min(1).max(200),
  heroSubtitle: z.string().trim().min(1).max(1200),
  placeholder: z.string().trim().min(1).max(240),
  featuresSubtitle: z.string().trim().max(500).default(''),
  features: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(120),
        description: z.string().trim().min(1).max(600),
      })
    )
    .max(6)
    .default([]),
  guideBadge: z.string().trim().max(120).default(''),
  guideTitle: z.string().trim().max(240).default(''),
  guideParagraphs: z.array(z.string().trim().min(1).max(2500)).max(10).default([]),
  supportedFormats: z.array(z.string().trim().min(1).max(240)).max(15).default([]),
  howToSteps: z
    .array(
      z.object({
        title: z.string().trim().min(1).max(140),
        description: z.string().trim().min(1).max(600),
      })
    )
    .max(8)
    .default([]),
  faqs: z
    .array(
      z.object({
        question: z.string().trim().min(1).max(280),
        answer: z.string().trim().min(1).max(1500),
      })
    )
    .max(20)
    .default([]),
  seoTitle: z.string().trim().min(1).max(180),
  seoDescription: z.string().trim().min(1).max(400),
  seoKeywords: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
  ogTitle: z.string().trim().min(1).max(180),
  ogDescription: z.string().trim().min(1).max(400),
  ogImageUrl: z.string().trim().max(500).default('/og-image.png'),
});

export const platformConfigUpdateSchema = z.object({
  platform: z.enum(PLATFORM_KEYS),
  isEnabled: z.boolean(),
  cookies: z.string().max(50000).optional(),
  clearCookies: z.boolean().optional(),
  proxyUrl: z.string().trim().max(500).default(''),
  userAgent: z.string().trim().max(500).default(''),
  statusNote: z.string().trim().max(300).default(''),
});

export const globalSettingsUpdateSchema = z.object({
  siteName: z.string().trim().min(1).max(100),
  logoUrl: z.string().trim().min(1).max(500),
  faviconUrl: z.string().trim().min(1).max(500),
  defaultOgImage: z.string().trim().min(1).max(500),
  headScripts: z.string().max(30000).default(''),
  bodyScripts: z.string().max(30000).default(''),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().trim().min(1).max(600),
});
