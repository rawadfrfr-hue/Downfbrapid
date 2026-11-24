import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  buildCmsJsonLdSchemas,
  generateCmsPageMetadata,
  getPublicPageBootstrap,
} from '@/lib/cms-seo';
import { PlatformPageClient } from '@/components/PlatformPageClient';
import { TranscriptPageClient } from '@/components/TranscriptPageClient';
import type { CmsPageSlug } from '@/lib/cms-types';
import type { PagePlatform } from '@/lib/platforms';

const VALID_SUBPAGES: ReadonlyArray<Exclude<CmsPageSlug, 'home'>> = [
  'facebook',
  'youtube',
  'instagram',
  'tiktok',
  'youtube-transcript',
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; platform: string }>;
}): Promise<Metadata> {
  const { lang, platform } = await params;
  const slug = platform.toLowerCase();
  if (!VALID_SUBPAGES.includes(slug as Exclude<CmsPageSlug, 'home'>)) {
    return {};
  }
  return generateCmsPageMetadata(slug as CmsPageSlug, lang.toLowerCase());
}

export default async function DynamicLangPlatformPage({
  params,
}: {
  params: Promise<{ lang: string; platform: string }>;
}) {
  const { lang, platform } = await params;
  const code = lang.toLowerCase();
  const slug = platform.toLowerCase();

  if (!VALID_SUBPAGES.includes(slug as Exclude<CmsPageSlug, 'home'>)) {
    notFound();
  }

  const typedSlug = slug as Exclude<CmsPageSlug, 'home'>;
  const { content, activeLanguages, siteName } = await getPublicPageBootstrap(code, typedSlug);
  const schemas = buildCmsJsonLdSchemas(content, siteName);

  return (
    <>
      {schemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {typedSlug === 'youtube-transcript' ? (
        <TranscriptPageClient locale={code} />
      ) : (
        <PlatformPageClient
          platform={typedSlug as PagePlatform}
          locale={code}
          cmsContent={content}
          activeLanguages={activeLanguages}
          siteName={siteName}
        />
      )}
    </>
  );
}
