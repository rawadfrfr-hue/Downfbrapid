import React from 'react';
import type { Metadata } from 'next';
import {
  buildCmsJsonLdSchemas,
  generateCmsPageMetadata,
  getPublicPageBootstrap,
} from '@/lib/cms-seo';
import { PlatformPageClient } from '@/components/PlatformPageClient';

export async function generateMetadata(): Promise<Metadata> {
  return generateCmsPageMetadata('youtube', 'en');
}

export default async function YoutubeDownloaderPage() {
  const { content, activeLanguages, siteName } = await getPublicPageBootstrap('en', 'youtube');
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
      <PlatformPageClient
        platform="youtube"
        locale="en"
        cmsContent={content}
        activeLanguages={activeLanguages}
        siteName={siteName}
      />
    </>
  );
}
