import React from 'react';
import type { Metadata } from 'next';
import {
  buildCmsJsonLdSchemas,
  generateCmsPageMetadata,
  getPublicPageBootstrap,
} from '@/lib/cms-seo';
import { PlatformPageClient } from '@/components/PlatformPageClient';

export async function generateMetadata(): Promise<Metadata> {
  return generateCmsPageMetadata('facebook', 'bn');
}

export default async function BnFacebookDownloaderPage() {
  const { content, activeLanguages, siteName } = await getPublicPageBootstrap('bn', 'facebook');
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
        platform="facebook"
        locale="bn"
        cmsContent={content}
        activeLanguages={activeLanguages}
        siteName={siteName}
      />
    </>
  );
}
