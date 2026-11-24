import { PrismaClient } from '@prisma/client';
import {
  buildAllDefaultContents,
  buildDefaultGlobalSettings,
  buildDefaultLanguages,
  buildDefaultPlatformConfigs,
} from '../lib/cms-defaults';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SaveVibe database...');

  const languages = buildDefaultLanguages();
  for (const lang of languages) {
    await prisma.language.upsert({
      where: { code: lang.code },
      update: {
        name: lang.name,
        nativeName: lang.nativeName,
        hreflang: lang.hreflang,
        direction: lang.direction,
        isDefault: lang.isDefault,
        isActive: lang.isActive,
        sortOrder: lang.sortOrder,
      },
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

  const contents = buildAllDefaultContents();
  for (const item of contents) {
    const lang = await prisma.language.findUnique({ where: { code: item.languageCode } });
    if (!lang) continue;

    await prisma.pageContent.upsert({
      where: {
        languageId_pageSlug: {
          languageId: lang.id,
          pageSlug: item.pageSlug,
        },
      },
      update: {},
      create: {
        languageId: lang.id,
        pageSlug: item.pageSlug,
        heroTitle: item.heroTitle,
        heroSubtitle: item.heroSubtitle,
        placeholder: item.placeholder,
        featuresSubtitle: item.featuresSubtitle,
        features: item.features as unknown as object,
        guideBadge: item.guideBadge,
        guideTitle: item.guideTitle,
        guideParagraphs: item.guideParagraphs as unknown as object,
        supportedFormats: item.supportedFormats as unknown as object,
        howToSteps: item.howToSteps as unknown as object,
        faqs: item.faqs as unknown as object,
        seoTitle: item.seoTitle,
        seoDescription: item.seoDescription,
        seoKeywords: item.seoKeywords as unknown as object,
        ogTitle: item.ogTitle,
        ogDescription: item.ogDescription,
        ogImageUrl: item.ogImageUrl,
      },
    });
  }

  for (const platformCfg of buildDefaultPlatformConfigs()) {
    await prisma.platformConfig.upsert({
      where: { platform: platformCfg.platform },
      update: {},
      create: {
        platform: platformCfg.platform,
        isEnabled: platformCfg.isEnabled,
        cookies: platformCfg.cookies || null,
        proxyUrl: platformCfg.proxyUrl || null,
        userAgent: platformCfg.userAgent || null,
        statusNote: platformCfg.statusNote || null,
      },
    });
  }

  const globalDef = buildDefaultGlobalSettings();
  await prisma.globalSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      siteName: globalDef.siteName,
      logoUrl: globalDef.logoUrl,
      faviconUrl: globalDef.faviconUrl,
      defaultOgImage: globalDef.defaultOgImage,
      headScripts: globalDef.headScripts,
      bodyScripts: globalDef.bodyScripts,
      maintenanceMode: globalDef.maintenanceMode,
      maintenanceMessage: globalDef.maintenanceMessage,
    },
  });

  console.log('SaveVibe seed completed.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
