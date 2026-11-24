import fs from 'fs';
import path from 'path';
import { revalidatePath, revalidateTag, unstable_cache } from 'next/cache';
import {
  CmsDownloadLogRecord,
  CmsGlobalSettingsRecord,
  CmsLanguageRecord,
  CmsPageContentRecord,
  CmsPageSlug,
  CmsPlatformConfigRecord,
  CmsPlatformKey,
  DashboardMetricsResponse,
  PAGE_SLUGS,
  PLATFORM_KEYS,
} from './cms-types';
import {
  buildAllDefaultContents,
  buildDefaultGlobalSettings,
  buildDefaultLanguages,
  buildDefaultPageContent,
  buildDefaultPlatformConfigs,
} from './cms-defaults';
import { getPrismaClient } from './prisma';

const DATA_DIR = path.resolve(process.cwd(), '.savevibe-data');
const CMS_STORE_FILE = path.resolve(DATA_DIR, 'cms-store.json');

interface FileStoreSchema {
  languages: CmsLanguageRecord[];
  contents: CmsPageContentRecord[];
  platformConfigs: CmsPlatformConfigRecord[];
  globalSettings: CmsGlobalSettingsRecord;
  downloadLogs: CmsDownloadLogRecord[];
}

function ensureStoreFile(): FileStoreSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(CMS_STORE_FILE)) {
    const initial: FileStoreSchema = {
      languages: buildDefaultLanguages(),
      contents: buildAllDefaultContents(),
      platformConfigs: buildDefaultPlatformConfigs(),
      globalSettings: buildDefaultGlobalSettings(),
      downloadLogs: [],
    };
    fs.writeFileSync(CMS_STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(CMS_STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<FileStoreSchema>;
    return {
      languages: Array.isArray(parsed.languages) && parsed.languages.length > 0
        ? parsed.languages
        : buildDefaultLanguages(),
      contents: Array.isArray(parsed.contents) && parsed.contents.length > 0
        ? parsed.contents
        : buildAllDefaultContents(),
      platformConfigs: Array.isArray(parsed.platformConfigs) && parsed.platformConfigs.length > 0
        ? parsed.platformConfigs
        : buildDefaultPlatformConfigs(),
      globalSettings: parsed.globalSettings || buildDefaultGlobalSettings(),
      downloadLogs: Array.isArray(parsed.downloadLogs) ? parsed.downloadLogs : [],
    };
  } catch {
    const fallback: FileStoreSchema = {
      languages: buildDefaultLanguages(),
      contents: buildAllDefaultContents(),
      platformConfigs: buildDefaultPlatformConfigs(),
      globalSettings: buildDefaultGlobalSettings(),
      downloadLogs: [],
    };
    return fallback;
  }
}

function writeStoreFile(store: FileStoreSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(CMS_STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// ---------- Cache Revalidation ----------
export function revalidateCmsCache(extraPaths: string[] = []) {
  revalidateTag('cms-languages');
  revalidateTag('cms-content');
  revalidateTag('platform-settings');
  revalidateTag('global-settings');

  revalidatePath('/', 'layout');
  revalidatePath('/bn', 'layout');
  revalidatePath('/sitemap.xml');
  for (const p of extraPaths) {
    revalidatePath(p, 'layout');
  }
}

// ---------- Languages ----------
export async function listLanguages(): Promise<CmsLanguageRecord[]> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const rows = await prisma.language.findMany({
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.id,
          code: r.code,
          name: r.name,
          nativeName: r.nativeName,
          hreflang: r.hreflang,
          direction: r.direction === 'rtl' ? 'rtl' : 'ltr',
          isDefault: r.isDefault,
          isActive: r.isActive,
          sortOrder: r.sortOrder,
          updatedAt: r.updatedAt.toISOString(),
        }));
      }
      // Auto-seed default languages into empty PostgreSQL table on first boot
      const defaults = buildDefaultLanguages();
      for (const lang of defaults) {
        await prisma.language.upsert({
          where: { code: lang.code },
          update: {},
          create: {
            code: lang.code,
            name: lang.name,
            nativeName: lang.nativeName,
            hreflang: lang.hreflang,
            direction: lang.direction,
            isDefault: lang.isDefault,
            isActive: lang.isActive,
            sortOrder: lang.sortOrder,
          },
        });
      }
      return listLanguages();
    } catch (error) {
      console.error('Prisma listLanguages fallback:', error);
    }
  }
  return ensureStoreFile().languages.sort((a, b) => a.sortOrder - b.sortOrder);
}

export const getActiveLanguagesCached = unstable_cache(
  async (): Promise<CmsLanguageRecord[]> => {
    const all = await listLanguages();
    return all.filter((l) => l.isActive);
  },
  ['cms-active-languages'],
  { tags: ['cms-languages'], revalidate: 3600 }
);

export async function createLanguage(input: {
  code: string;
  name: string;
  nativeName: string;
  hreflang: string;
  direction: 'ltr' | 'rtl';
  isActive: boolean;
  sortOrder: number;
}): Promise<CmsLanguageRecord> {
  const prisma = getPrismaClient();
  const code = input.code.toLowerCase();

  if (prisma) {
    const existing = await prisma.language.findUnique({ where: { code } });
    if (existing) {
      throw new Error(`Language code "${code}" already exists.`);
    }
    const created = await prisma.language.create({
      data: {
        code,
        name: input.name,
        nativeName: input.nativeName,
        hreflang: input.hreflang.toLowerCase(),
        direction: input.direction,
        isDefault: false,
        isActive: input.isActive,
        sortOrder: input.sortOrder,
      },
    });

    // Seed starter page contents for this language based on English template
    for (const slug of PAGE_SLUGS) {
      const starter = buildDefaultPageContent('en', slug);
      await prisma.pageContent.create({
        data: {
          languageId: created.id,
          pageSlug: slug,
          heroTitle: starter.heroTitle,
          heroSubtitle: starter.heroSubtitle,
          placeholder: starter.placeholder,
          featuresSubtitle: starter.featuresSubtitle,
          features: starter.features as unknown as object,
          guideBadge: starter.guideBadge,
          guideTitle: starter.guideTitle,
          guideParagraphs: starter.guideParagraphs as unknown as object,
          supportedFormats: starter.supportedFormats as unknown as object,
          howToSteps: starter.howToSteps as unknown as object,
          faqs: starter.faqs as unknown as object,
          seoTitle: starter.seoTitle,
          seoDescription: starter.seoDescription,
          seoKeywords: starter.seoKeywords as unknown as object,
          ogTitle: starter.ogTitle,
          ogDescription: starter.ogDescription,
          ogImageUrl: starter.ogImageUrl,
        },
      });
    }

    revalidateCmsCache([`/${created.code}`]);
    return {
      id: created.id,
      code: created.code,
      name: created.name,
      nativeName: created.nativeName,
      hreflang: created.hreflang,
      direction: created.direction === 'rtl' ? 'rtl' : 'ltr',
      isDefault: created.isDefault,
      isActive: created.isActive,
      sortOrder: created.sortOrder,
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  const store = ensureStoreFile();
  if (store.languages.some((l) => l.code === code)) {
    throw new Error(`Language code "${code}" already exists.`);
  }
  const now = new Date().toISOString();
  const created: CmsLanguageRecord = {
    id: `lang-${code}-${Date.now()}`,
    code,
    name: input.name,
    nativeName: input.nativeName,
    hreflang: input.hreflang.toLowerCase(),
    direction: input.direction,
    isDefault: false,
    isActive: input.isActive,
    sortOrder: input.sortOrder,
    updatedAt: now,
  };
  store.languages.push(created);

  for (const slug of PAGE_SLUGS) {
    const starter = buildDefaultPageContent('en', slug);
    store.contents.push({
      ...starter,
      id: `content-${code}-${slug}`,
      languageCode: code,
      updatedAt: now,
    });
  }
  writeStoreFile(store);
  revalidateCmsCache([`/${code}`]);
  return created;
}

export async function updateLanguage(input: {
  code: string;
  name?: string;
  nativeName?: string;
  hreflang?: string;
  direction?: 'ltr' | 'rtl';
  isActive?: boolean;
  isDefault?: boolean;
  sortOrder?: number;
}): Promise<CmsLanguageRecord> {
  const code = input.code.toLowerCase();
  const prisma = getPrismaClient();

  if (prisma) {
    const existing = await prisma.language.findUnique({ where: { code } });
    if (!existing) throw new Error(`Language "${code}" not found.`);

    if (input.isDefault) {
      await prisma.language.updateMany({ data: { isDefault: false } });
    }

    const updated = await prisma.language.update({
      where: { code },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.nativeName !== undefined ? { nativeName: input.nativeName } : {}),
        ...(input.hreflang !== undefined ? { hreflang: input.hreflang.toLowerCase() } : {}),
        ...(input.direction !== undefined ? { direction: input.direction } : {}),
        ...(input.isActive !== undefined ? { isActive: existing.isDefault ? true : input.isActive } : {}),
        ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    revalidateCmsCache([`/${code}`]);
    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      nativeName: updated.nativeName,
      hreflang: updated.hreflang,
      direction: updated.direction === 'rtl' ? 'rtl' : 'ltr',
      isDefault: updated.isDefault,
      isActive: updated.isActive,
      sortOrder: updated.sortOrder,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const store = ensureStoreFile();
  const idx = store.languages.findIndex((l) => l.code === code);
  if (idx === -1) throw new Error(`Language "${code}" not found.`);

  if (input.isDefault) {
    store.languages = store.languages.map((l) => ({ ...l, isDefault: l.code === code }));
  }

  const cur = store.languages[idx];
  const updated: CmsLanguageRecord = {
    ...cur,
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.nativeName !== undefined ? { nativeName: input.nativeName } : {}),
    ...(input.hreflang !== undefined ? { hreflang: input.hreflang.toLowerCase() } : {}),
    ...(input.direction !== undefined ? { direction: input.direction } : {}),
    ...(input.isActive !== undefined ? { isActive: cur.isDefault ? true : input.isActive } : {}),
    ...(input.isDefault !== undefined ? { isDefault: input.isDefault } : {}),
    ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    updatedAt: new Date().toISOString(),
  };
  store.languages[idx] = updated;
  writeStoreFile(store);
  revalidateCmsCache([`/${code}`]);
  return updated;
}

export async function deleteLanguage(codeInput: string): Promise<void> {
  const code = codeInput.toLowerCase();
  if (code === 'en') {
    throw new Error('Default English language cannot be deleted.');
  }
  const prisma = getPrismaClient();
  if (prisma) {
    const existing = await prisma.language.findUnique({ where: { code } });
    if (!existing) throw new Error('Language not found.');
    if (existing.isDefault) throw new Error('Cannot delete the default language.');
    await prisma.language.delete({ where: { code } });
    revalidateCmsCache([`/${code}`]);
    return;
  }

  const store = ensureStoreFile();
  const target = store.languages.find((l) => l.code === code);
  if (!target) throw new Error('Language not found.');
  if (target.isDefault) throw new Error('Cannot delete the default language.');

  store.languages = store.languages.filter((l) => l.code !== code);
  store.contents = store.contents.filter((c) => c.languageCode !== code);
  writeStoreFile(store);
  revalidateCmsCache([`/${code}`]);
}

// ---------- Page Content & SEO ----------
export async function getPageContent(
  languageCodeInput: string,
  pageSlug: CmsPageSlug
): Promise<CmsPageContentRecord> {
  const languageCode = languageCodeInput.toLowerCase();
  const prisma = getPrismaClient();

  if (prisma) {
    try {
      const lang = await prisma.language.findUnique({ where: { code: languageCode } });
      if (lang) {
        const found = await prisma.pageContent.findUnique({
          where: { languageId_pageSlug: { languageId: lang.id, pageSlug } },
        });
        if (found) {
          return {
            id: found.id,
            languageCode,
            pageSlug: found.pageSlug as CmsPageSlug,
            heroTitle: found.heroTitle,
            heroSubtitle: found.heroSubtitle,
            placeholder: found.placeholder,
            featuresSubtitle: found.featuresSubtitle,
            features: (found.features as unknown as CmsPageContentRecord['features']) || [],
            guideBadge: found.guideBadge,
            guideTitle: found.guideTitle,
            guideParagraphs: (found.guideParagraphs as unknown as string[]) || [],
            supportedFormats: (found.supportedFormats as unknown as string[]) || [],
            howToSteps: (found.howToSteps as unknown as CmsPageContentRecord['howToSteps']) || [],
            faqs: (found.faqs as unknown as CmsPageContentRecord['faqs']) || [],
            seoTitle: found.seoTitle,
            seoDescription: found.seoDescription,
            seoKeywords: (found.seoKeywords as unknown as string[]) || [],
            ogTitle: found.ogTitle,
            ogDescription: found.ogDescription,
            ogImageUrl: found.ogImageUrl || '/og-image.png',
            updatedAt: found.updatedAt.toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('Prisma getPageContent fallback:', error);
    }
  }

  const store = ensureStoreFile();
  const matched = store.contents.find(
    (c) => c.languageCode === languageCode && c.pageSlug === pageSlug
  );
  if (matched) return matched;
  return buildDefaultPageContent(languageCode === 'bn' ? 'bn' : 'en', pageSlug);
}

export const getPageContentCached = unstable_cache(
  async (languageCode: string, pageSlug: CmsPageSlug) => getPageContent(languageCode, pageSlug),
  ['cms-page-content'],
  { tags: ['cms-content'], revalidate: 3600 }
);

export async function savePageContent(
  input: Omit<CmsPageContentRecord, 'id' | 'updatedAt'>
): Promise<CmsPageContentRecord> {
  const languageCode = input.languageCode.toLowerCase();
  const prisma = getPrismaClient();

  if (prisma) {
    let lang = await prisma.language.findUnique({ where: { code: languageCode } });
    if (!lang) {
      await listLanguages();
      lang = await prisma.language.findUnique({ where: { code: languageCode } });
    }
    if (!lang) {
      throw new Error(`Language "${languageCode}" does not exist.`);
    }

    const saved = await prisma.pageContent.upsert({
      where: {
        languageId_pageSlug: {
          languageId: lang.id,
          pageSlug: input.pageSlug,
        },
      },
      update: {
        heroTitle: input.heroTitle,
        heroSubtitle: input.heroSubtitle,
        placeholder: input.placeholder,
        featuresSubtitle: input.featuresSubtitle,
        features: input.features as unknown as object,
        guideBadge: input.guideBadge,
        guideTitle: input.guideTitle,
        guideParagraphs: input.guideParagraphs as unknown as object,
        supportedFormats: input.supportedFormats as unknown as object,
        howToSteps: input.howToSteps as unknown as object,
        faqs: input.faqs as unknown as object,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoKeywords: input.seoKeywords as unknown as object,
        ogTitle: input.ogTitle,
        ogDescription: input.ogDescription,
        ogImageUrl: input.ogImageUrl,
      },
      create: {
        languageId: lang.id,
        pageSlug: input.pageSlug,
        heroTitle: input.heroTitle,
        heroSubtitle: input.heroSubtitle,
        placeholder: input.placeholder,
        featuresSubtitle: input.featuresSubtitle,
        features: input.features as unknown as object,
        guideBadge: input.guideBadge,
        guideTitle: input.guideTitle,
        guideParagraphs: input.guideParagraphs as unknown as object,
        supportedFormats: input.supportedFormats as unknown as object,
        howToSteps: input.howToSteps as unknown as object,
        faqs: input.faqs as unknown as object,
        seoTitle: input.seoTitle,
        seoDescription: input.seoDescription,
        seoKeywords: input.seoKeywords as unknown as object,
        ogTitle: input.ogTitle,
        ogDescription: input.ogDescription,
        ogImageUrl: input.ogImageUrl,
      },
    });

    const slugPath = input.pageSlug === 'home' ? '' : `/${input.pageSlug}`;
    const targetPath = languageCode === 'en' ? slugPath || '/' : `/${languageCode}${slugPath}`;
    revalidateCmsCache([targetPath]);

    return {
      id: saved.id,
      languageCode,
      pageSlug: saved.pageSlug as CmsPageSlug,
      heroTitle: saved.heroTitle,
      heroSubtitle: saved.heroSubtitle,
      placeholder: saved.placeholder,
      featuresSubtitle: saved.featuresSubtitle,
      features: (saved.features as unknown as CmsPageContentRecord['features']) || [],
      guideBadge: saved.guideBadge,
      guideTitle: saved.guideTitle,
      guideParagraphs: (saved.guideParagraphs as unknown as string[]) || [],
      supportedFormats: (saved.supportedFormats as unknown as string[]) || [],
      howToSteps: (saved.howToSteps as unknown as CmsPageContentRecord['howToSteps']) || [],
      faqs: (saved.faqs as unknown as CmsPageContentRecord['faqs']) || [],
      seoTitle: saved.seoTitle,
      seoDescription: saved.seoDescription,
      seoKeywords: (saved.seoKeywords as unknown as string[]) || [],
      ogTitle: saved.ogTitle,
      ogDescription: saved.ogDescription,
      ogImageUrl: saved.ogImageUrl || '/og-image.png',
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  const store = ensureStoreFile();
  const idx = store.contents.findIndex(
    (c) => c.languageCode === languageCode && c.pageSlug === input.pageSlug
  );
  const record: CmsPageContentRecord = {
    ...input,
    id: idx >= 0 ? store.contents[idx].id : `content-${languageCode}-${input.pageSlug}`,
    languageCode,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    store.contents[idx] = record;
  } else {
    store.contents.push(record);
  }
  writeStoreFile(store);

  const slugPath = input.pageSlug === 'home' ? '' : `/${input.pageSlug}`;
  const targetPath = languageCode === 'en' ? slugPath || '/' : `/${languageCode}${slugPath}`;
  revalidateCmsCache([targetPath]);
  return record;
}

// ---------- Platform Configs (Toggles, Cookies, Proxy) ----------
export async function listPlatformConfigs(options?: { maskSecrets?: boolean }): Promise<CmsPlatformConfigRecord[]> {
  const maskSecrets = options?.maskSecrets ?? false;
  const prisma = getPrismaClient();

  let records: CmsPlatformConfigRecord[];

  if (prisma) {
    try {
      const rows = await prisma.platformConfig.findMany();
      const map = new Map(rows.map((r) => [r.platform, r]));
      const defaults = buildDefaultPlatformConfigs();
      records = defaults.map((def) => {
        const found = map.get(def.platform);
        if (!found) return def;
        return {
          platform: found.platform as CmsPlatformKey,
          isEnabled: found.isEnabled,
          cookies: found.cookies || '',
          hasCookies: Boolean(found.cookies && found.cookies.trim().length > 0),
          proxyUrl: found.proxyUrl || '',
          userAgent: found.userAgent || '',
          statusNote: found.statusNote || '',
          updatedAt: found.updatedAt.toISOString(),
        };
      });
    } catch (error) {
      console.error('Prisma listPlatformConfigs fallback:', error);
      records = ensureStoreFile().platformConfigs;
    }
  } else {
    records = ensureStoreFile().platformConfigs;
  }

  if (!maskSecrets) return records;
  return records.map((r) => ({
    ...r,
    hasCookies: Boolean(r.cookies && r.cookies.trim().length > 0),
    cookies: r.cookies ? '•••••••• (Configured — enter new cookies to replace)' : '',
  }));
}

export const getPlatformConfigsCached = unstable_cache(
  async () => listPlatformConfigs({ maskSecrets: false }),
  ['cms-platform-configs'],
  { tags: ['platform-settings'], revalidate: 300 }
);

export async function updatePlatformConfig(input: {
  platform: CmsPlatformKey;
  isEnabled: boolean;
  cookies?: string;
  clearCookies?: boolean;
  proxyUrl: string;
  userAgent: string;
  statusNote: string;
}): Promise<CmsPlatformConfigRecord> {
  const prisma = getPrismaClient();
  const isSentinelMasked = Boolean(input.cookies && input.cookies.startsWith('••••••••'));

  if (prisma) {
    const existing = await prisma.platformConfig.findUnique({
      where: { platform: input.platform },
    });

    const nextCookies = input.clearCookies
      ? null
      : input.cookies !== undefined && !isSentinelMasked
      ? input.cookies
      : existing?.cookies ?? null;

    const updated = await prisma.platformConfig.upsert({
      where: { platform: input.platform },
      update: {
        isEnabled: input.isEnabled,
        cookies: nextCookies,
        proxyUrl: input.proxyUrl || null,
        userAgent: input.userAgent || null,
        statusNote: input.statusNote || null,
      },
      create: {
        platform: input.platform,
        isEnabled: input.isEnabled,
        cookies: nextCookies,
        proxyUrl: input.proxyUrl || null,
        userAgent: input.userAgent || null,
        statusNote: input.statusNote || null,
      },
    });

    revalidateCmsCache([`/${input.platform}`, `/bn/${input.platform}`]);
    return {
      platform: updated.platform as CmsPlatformKey,
      isEnabled: updated.isEnabled,
      cookies: updated.cookies ? '•••••••• (Configured — enter new cookies to replace)' : '',
      hasCookies: Boolean(updated.cookies && updated.cookies.trim().length > 0),
      proxyUrl: updated.proxyUrl || '',
      userAgent: updated.userAgent || '',
      statusNote: updated.statusNote || '',
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  const store = ensureStoreFile();
  const idx = store.platformConfigs.findIndex((p) => p.platform === input.platform);
  const prev = idx >= 0 ? store.platformConfigs[idx] : buildDefaultPlatformConfigs()[0];

  const nextCookies = input.clearCookies
    ? ''
    : input.cookies !== undefined && !isSentinelMasked
    ? input.cookies
    : prev.cookies;

  const updated: CmsPlatformConfigRecord = {
    platform: input.platform,
    isEnabled: input.isEnabled,
    cookies: nextCookies,
    hasCookies: Boolean(nextCookies && nextCookies.trim().length > 0),
    proxyUrl: input.proxyUrl,
    userAgent: input.userAgent,
    statusNote: input.statusNote,
    updatedAt: new Date().toISOString(),
  };
  if (idx >= 0) {
    store.platformConfigs[idx] = updated;
  } else {
    store.platformConfigs.push(updated);
  }
  writeStoreFile(store);
  revalidateCmsCache([`/${input.platform}`, `/bn/${input.platform}`]);

  return {
    ...updated,
    cookies: updated.cookies ? '•••••••• (Configured — enter new cookies to replace)' : '',
  };
}

// ---------- Global Site Settings ----------
export async function getGlobalSettings(): Promise<CmsGlobalSettingsRecord> {
  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const row = await prisma.globalSettings.findUnique({ where: { id: 'singleton' } });
      if (row) {
        return {
          siteName: row.siteName,
          logoUrl: row.logoUrl,
          faviconUrl: row.faviconUrl,
          defaultOgImage: row.defaultOgImage,
          headScripts: row.headScripts,
          bodyScripts: row.bodyScripts,
          maintenanceMode: row.maintenanceMode,
          maintenanceMessage: row.maintenanceMessage,
          updatedAt: row.updatedAt.toISOString(),
        };
      }
      const def = buildDefaultGlobalSettings();
      await prisma.globalSettings.create({
        data: {
          id: 'singleton',
          siteName: def.siteName,
          logoUrl: def.logoUrl,
          faviconUrl: def.faviconUrl,
          defaultOgImage: def.defaultOgImage,
          headScripts: def.headScripts,
          bodyScripts: def.bodyScripts,
          maintenanceMode: def.maintenanceMode,
          maintenanceMessage: def.maintenanceMessage,
        },
      });
      return def;
    } catch (error) {
      console.error('Prisma getGlobalSettings fallback:', error);
    }
  }
  return ensureStoreFile().globalSettings;
}

export const getGlobalSettingsCached = unstable_cache(
  async () => getGlobalSettings(),
  ['cms-global-settings'],
  { tags: ['global-settings'], revalidate: 3600 }
);

export async function updateGlobalSettings(
  input: Omit<CmsGlobalSettingsRecord, 'updatedAt'>
): Promise<CmsGlobalSettingsRecord> {
  const prisma = getPrismaClient();
  if (prisma) {
    const saved = await prisma.globalSettings.upsert({
      where: { id: 'singleton' },
      update: {
        siteName: input.siteName,
        logoUrl: input.logoUrl,
        faviconUrl: input.faviconUrl,
        defaultOgImage: input.defaultOgImage,
        headScripts: input.headScripts,
        bodyScripts: input.bodyScripts,
        maintenanceMode: input.maintenanceMode,
        maintenanceMessage: input.maintenanceMessage,
      },
      create: {
        id: 'singleton',
        siteName: input.siteName,
        logoUrl: input.logoUrl,
        faviconUrl: input.faviconUrl,
        defaultOgImage: input.defaultOgImage,
        headScripts: input.headScripts,
        bodyScripts: input.bodyScripts,
        maintenanceMode: input.maintenanceMode,
        maintenanceMessage: input.maintenanceMessage,
      },
    });
    revalidateCmsCache();
    return {
      siteName: saved.siteName,
      logoUrl: saved.logoUrl,
      faviconUrl: saved.faviconUrl,
      defaultOgImage: saved.defaultOgImage,
      headScripts: saved.headScripts,
      bodyScripts: saved.bodyScripts,
      maintenanceMode: saved.maintenanceMode,
      maintenanceMessage: saved.maintenanceMessage,
      updatedAt: saved.updatedAt.toISOString(),
    };
  }

  const store = ensureStoreFile();
  const updated: CmsGlobalSettingsRecord = {
    ...input,
    updatedAt: new Date().toISOString(),
  };
  store.globalSettings = updated;
  writeStoreFile(store);
  revalidateCmsCache();
  return updated;
}

// ---------- Download Logs & Dashboard Analytics ----------
export async function recordDownloadEvent(input: {
  platform: CmsPlatformKey;
  videoUrl: string;
  status: 'SUCCESS' | 'FAILED';
  errorMessage?: string | null;
  errorCode?: string | null;
  quality?: string | null;
  locale?: string;
}): Promise<void> {
  const prisma = getPrismaClient();
  const safeUrl = input.videoUrl.slice(0, 1000);
  const safeErr = input.errorMessage ? input.errorMessage.slice(0, 1000) : null;

  if (prisma) {
    try {
      await prisma.downloadLog.create({
        data: {
          platform: input.platform,
          videoUrl: safeUrl,
          status: input.status,
          errorMessage: safeErr,
          errorCode: input.errorCode || null,
          quality: input.quality || null,
          locale: input.locale || 'en',
        },
      });
      return;
    } catch (error) {
      console.error('Prisma recordDownloadEvent fallback:', error);
    }
  }

  const store = ensureStoreFile();
  store.downloadLogs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform: input.platform,
    videoUrl: safeUrl,
    status: input.status,
    errorMessage: safeErr,
    errorCode: input.errorCode || null,
    quality: input.quality || null,
    locale: input.locale || 'en',
    createdAt: new Date().toISOString(),
  });
  store.downloadLogs = store.downloadLogs.slice(0, 500);
  writeStoreFile(store);
}

export async function clearFailedDownloadLogs(): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    await prisma.downloadLog.deleteMany({ where: { status: 'FAILED' } });
    return;
  }
  const store = ensureStoreFile();
  store.downloadLogs = store.downloadLogs.filter((l) => l.status !== 'FAILED');
  writeStoreFile(store);
}

export async function deleteDownloadLogById(id: string): Promise<void> {
  const prisma = getPrismaClient();
  if (prisma) {
    await prisma.downloadLog.delete({ where: { id } }).catch(() => {});
    return;
  }
  const store = ensureStoreFile();
  store.downloadLogs = store.downloadLogs.filter((l) => l.id !== id);
  writeStoreFile(store);
}

export async function getDashboardMetrics(): Promise<DashboardMetricsResponse> {
  const platformConfigs = await listPlatformConfigs({ maskSecrets: true });
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  let logs: CmsDownloadLogRecord[] = [];
  let totalSuccess = 0;
  let totalFailed = 0;
  let todaySuccess = 0;
  let todayFailed = 0;

  const platformLabels: Record<CmsPlatformKey, string> = {
    youtube: 'YouTube',
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  };

  const breakdownMap = new Map<
    CmsPlatformKey,
    { total: number; today: number; success: number; failed: number }
  >(
    PLATFORM_KEYS.map((k) => [k, { total: 0, today: 0, success: 0, failed: 0 }])
  );

  const prisma = getPrismaClient();
  if (prisma) {
    try {
      const [allAgg, todayAgg, failedRows, recentRows] = await Promise.all([
        prisma.downloadLog.groupBy({
          by: ['platform', 'status'],
          _count: { _all: true },
        }),
        prisma.downloadLog.groupBy({
          by: ['platform', 'status'],
          where: { createdAt: { gte: startOfToday } },
          _count: { _all: true },
        }),
        prisma.downloadLog.findMany({
          where: { status: 'FAILED' },
          orderBy: { createdAt: 'desc' },
          take: 50,
        }),
        prisma.downloadLog.findMany({
          orderBy: { createdAt: 'desc' },
          take: 25,
        }),
      ]);

      for (const row of allAgg) {
        const entry = breakdownMap.get(row.platform as CmsPlatformKey);
        if (!entry) continue;
        const c = row._count._all;
        entry.total += c;
        if (row.status === 'SUCCESS') {
          entry.success += c;
          totalSuccess += c;
        } else {
          entry.failed += c;
          totalFailed += c;
        }
      }

      for (const row of todayAgg) {
        const entry = breakdownMap.get(row.platform as CmsPlatformKey);
        if (!entry) continue;
        const c = row._count._all;
        entry.today += c;
        if (row.status === 'SUCCESS') todaySuccess += c;
        else todayFailed += c;
      }

      const mapRow = (r: typeof failedRows[number]): CmsDownloadLogRecord => ({
        id: r.id,
        platform: r.platform as CmsPlatformKey,
        videoUrl: r.videoUrl,
        status: r.status,
        errorMessage: r.errorMessage,
        errorCode: r.errorCode,
        quality: r.quality,
        locale: r.locale,
        createdAt: r.createdAt.toISOString(),
      });

      const totalDownloads = totalSuccess;
      const totalAttempts = totalSuccess + totalFailed;
      return {
        todayDownloads: todaySuccess,
        totalDownloads,
        todayFailed,
        totalFailed,
        successRate: totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 100,
        platformBreakdown: PLATFORM_KEYS.map((platform) => {
          const stats = breakdownMap.get(platform)!;
          const cfg = platformConfigs.find((c) => c.platform === platform);
          return {
            platform,
            label: platformLabels[platform],
            total: stats.success,
            today: stats.today,
            success: stats.success,
            failed: stats.failed,
            isEnabled: cfg ? cfg.isEnabled : true,
          };
        }),
        failedLogs: failedRows.map(mapRow),
        recentLogs: recentRows.map(mapRow),
      };
    } catch (error) {
      console.error('Prisma getDashboardMetrics fallback:', error);
    }
  }

  logs = ensureStoreFile().downloadLogs;
  for (const log of logs) {
    const entry = breakdownMap.get(log.platform);
    if (!entry) continue;
    const isToday = new Date(log.createdAt) >= startOfToday;
    entry.total += 1;
    if (isToday) entry.today += 1;
    if (log.status === 'SUCCESS') {
      entry.success += 1;
      totalSuccess += 1;
      if (isToday) todaySuccess += 1;
    } else {
      entry.failed += 1;
      totalFailed += 1;
      if (isToday) todayFailed += 1;
    }
  }

  const totalAttempts = totalSuccess + totalFailed;
  return {
    todayDownloads: todaySuccess,
    totalDownloads: totalSuccess,
    todayFailed,
    totalFailed,
    successRate: totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 100) : 100,
    platformBreakdown: PLATFORM_KEYS.map((platform) => {
      const stats = breakdownMap.get(platform)!;
      const cfg = platformConfigs.find((c) => c.platform === platform);
      return {
        platform,
        label: platformLabels[platform],
        total: stats.success,
        today: stats.today,
        success: stats.success,
        failed: stats.failed,
        isEnabled: cfg ? cfg.isEnabled : true,
      };
    }),
    failedLogs: logs.filter((l) => l.status === 'FAILED').slice(0, 50),
    recentLogs: logs.slice(0, 25),
  };
}
